import os
import io
import uuid
import json
from typing import Optional, List
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Query, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from pydantic import BaseModel, EmailStr
from PIL import Image
import numpy as np

# Import config
from src import config

# Import handlers
from src.models.blip_handler import BLIPHandler
from src.models.suno_handler import SunoHandler
from src.services.cultural_mapper import CulturalMapper
from src.services.prompt_builder import PromptBuilder
from src.utils.audio_utils import save_audio

# Import database
from src import database

# Import services
from src.services import playlist_service
from src.services.narrative_builder import create_narrative

# Import schemas
from src.models.schemas import SongResponse, SongUpdate


# ---------- PYDANTIC MODELS FOR AUTH ----------
class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    name: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class FollowRequest(BaseModel):
    follower_id: int

# ---------- APP SETUP ----------
app = FastAPI(
    title="WaveLength Backend",
    description="Transform images into music using AI",
    version="1.0.0"
)

# CORS - Allow specific origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=config.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create output directory
os.makedirs(config.OUT_DIR, exist_ok=True)

# ---------- GLOBAL HANDLERS (Lazy Load) ----------
blip_handler: Optional[BLIPHandler] = None
suno_handler: Optional[SunoHandler] = None
cultural_mapper = CulturalMapper()
prompt_builder = PromptBuilder()

# AI availability flags
BLIP_READY = False
SUNO_READY = False


@app.on_event("startup")
async def startup_event():
    """Force load AI models on startup."""
    print("[main] Running startup event - loading AI models...")
    init_ai_handlers()
    print("[main] Startup complete!")


def init_ai_handlers():
    """Initialize AI handlers (lazy loading)."""
    global blip_handler, suno_handler, BLIP_READY, SUNO_READY

    try:
        # Initialize BLIP only if enabled (can be disabled to save memory)
        if config.USE_BLIP and blip_handler is None:
            blip_handler = BLIPHandler(model_name=config.BLIP_MODEL)
            BLIP_READY = True
            print("[main] BLIP handler initialized successfully")
        elif not config.USE_BLIP:
            print("[main] BLIP disabled via USE_BLIP=false")
            BLIP_READY = False
    except Exception as e:
        print(f"[main] Failed to initialize BLIP: {repr(e)}")
        BLIP_READY = False

    try:
        # Initialize SunoAPI if enabled and API key provided
        if config.USE_SUNO and config.SUNO_API_KEY:
            if suno_handler is None:
                suno_handler = SunoHandler(
                    api_key=config.SUNO_API_KEY,
                    api_url=config.SUNO_API_URL
                )
                SUNO_READY = True
                print("[main] SunoAPI handler initialized successfully")
        else:
            print("[main] SunoAPI disabled or no API key provided")
    except Exception as e:
        print(f"[main] Failed to initialize SunoAPI: {repr(e)}")
        SUNO_READY = False


def generate_mock_audio(duration: int = 15, sample_rate: int = 32000) -> tuple[np.ndarray, int]:
    """Generate mock audio (sine wave) for testing."""
    t = np.linspace(0, duration, int(sample_rate * duration), endpoint=False)
    # Simple sine wave at 440 Hz
    wave = 0.2 * np.sin(2 * np.pi * 440.0 * t)
    audio_int16 = (wave * 32767).astype(np.int16)
    return audio_int16, sample_rate


# ---------- ENDPOINTS ----------

@app.get("/")
def root():
    """Root endpoint."""
    return {
        "message": "WaveLength Backend API",
        "version": "1.0.0",
        "endpoints": [
            "/health",
            "/generate (POST)",
            "/audio/{filename} (GET)"
        ]
    }


@app.get("/health")
def health():
    """Health check endpoint."""
    # Try to initialize AI handlers
    try:
        init_ai_handlers()
    except Exception as e:
        print(f"[health] Error initializing AI: {repr(e)}")

    device = "cpu"
    if blip_handler:
        device = blip_handler.device

    return {
        "status": "ok",
        "blip_ready": BLIP_READY,
        "suno_ready": SUNO_READY,
        "device": device,
        "music_generation": "suno_api" if SUNO_READY else "mock",
        "models_loaded": {
            "blip": blip_handler is not None and blip_handler.is_loaded() if blip_handler else False,
            "suno": suno_handler is not None if suno_handler else False
        }
    }


# ---------- AUTH ENDPOINTS ----------

@app.post("/auth/register")
def register(req: RegisterRequest):
    """Register a new user."""
    try:
        user = database.create_user(req.email, req.password, req.name)
        return {
            "user_id": user["id"],
            "name": user["name"],
            "email": user["email"]
        }
    except ValueError as e:
        raise HTTPException(400, str(e))
    except Exception as e:
        print(f"[register] Error: {e}")
        raise HTTPException(500, "Registration failed")


@app.post("/auth/login")
def login(req: LoginRequest):
    """Login user."""
    user = database.get_user_by_email(req.email)

    if not user:
        raise HTTPException(401, "Invalid email or password")

    if not database.verify_password(req.password, user["password_hash"]):
        raise HTTPException(401, "Invalid email or password")

    return {
        "user_id": user["id"],
        "name": user["name"],
        "email": user["email"]
    }


@app.get("/auth/user/{user_id}")
def get_user(user_id: int):
    """Get user by ID."""
    user = database.get_user_by_id(user_id)

    if not user:
        raise HTTPException(404, "User not found")

    return user


# ---------- USER/FOLLOW ENDPOINTS ----------

@app.get("/users/search")
def search_users_endpoint(q: str = Query(..., min_length=1), limit: int = Query(50, le=200)):
    """Search users by name."""
    users = database.search_users(q, limit)
    return users


@app.post("/users/{user_id}/follow")
def follow_user(user_id: int, req: FollowRequest):
    """Follow a user."""
    try:
        success = database.create_follow(req.follower_id, user_id)
        return {"success": success, "message": "Following" if success else "Already following"}
    except ValueError as e:
        raise HTTPException(400, str(e))


@app.delete("/users/{user_id}/unfollow")
def unfollow_user(user_id: int, follower_id: int = Query(...)):
    """Unfollow a user."""
    success = database.delete_follow(follower_id, user_id)
    return {"success": success}


@app.get("/users/{user_id}/following")
def get_following_endpoint(user_id: int):
    """Get list of users that user is following."""
    following = database.get_following(user_id)
    return following


@app.get("/users/{user_id}/followers")
def get_followers_endpoint(user_id: int):
    """Get list of followers."""
    followers = database.get_followers(user_id)
    return followers


@app.get("/songs/friends/{user_id}")
def get_friends_songs_endpoint(
    user_id: int,
    limit: int = Query(100, le=500),
    offset: int = Query(0, ge=0)
):
    """Get songs from users that user_id is following."""
    songs = database.get_friends_songs(user_id, limit, offset)
    return songs


# ---------- MUSIC GENERATION ----------

@app.post("/generate")
async def generate(
    images: List[UploadFile] = File(...),
    user_name: str = Form(...),
    song_name: Optional[str] = Form(None),
    genre: Optional[str] = Form(None),
    tags: Optional[str] = Form(None),
    duration: int = Form(30),
    has_vocals: bool = Form(False),
    has_lyrics: bool = Form(False),
    include_title_in_lyrics: bool = Form(True),
    language: str = Form("en"),  # "en" | "pt" | "es"
    engine: Optional[str] = Form(None)  # "blip" | "mock" | None
):
    """
    Generate music from one or multiple images (ASYNC - returns task_id immediately).

    Args:
        images: List of image files (1-3 images)
        user_name: Name of the user creating the song
        song_name: Name of the song (optional)
        genre: Music genre (optional)
        tags: Tags separated by commas (optional)
        duration: Duration in seconds (15-100) - note: SunoAPI V4 supports up to 240s
        has_vocals: Whether the music has vocals
        has_lyrics: Whether to generate lyrics (only if has_vocals=True)
        engine: "mock" | "blip" | None (auto)

    Returns:
        JSON with task_id and song_id for polling
    """
    # Validate duration
    if not 15 <= duration <= 100:
        raise HTTPException(400, "Duration must be between 15 and 100 seconds")

    # Validate user_name
    if not user_name or not user_name.strip():
        raise HTTPException(400, "user_name is required")

    # Validate number of images (1-3)
    if not images or len(images) == 0:
        raise HTTPException(400, "At least one image is required")
    if len(images) > 3:
        raise HTTPException(400, "Maximum 3 images allowed")

    # Read all images
    images_bytes = []
    for img in images:
        img_bytes = await img.read()
        images_bytes.append(img_bytes)

    print(f"[generate] Processing {len(images_bytes)} image(s)")

    # Try to initialize AI handlers
    use_mock = (engine == "mock")
    if not use_mock:
        try:
            init_ai_handlers()
        except Exception as e:
            print(f"[generate] Failed to initialize AI: {repr(e)}")

    # Final decision: use mock only if explicitly requested or SunoAPI not ready
    # BLIP is optional - we can use SunoAPI without it
    use_mock = (engine == "mock") or (not SUNO_READY)

    # Generate unique song ID
    song_id = uuid.uuid4().hex
    final_song_name = song_name if song_name and song_name.strip() else "Música Gerada"

    # Look up user_id from user_name
    user_id = None
    try:
        users = database.search_users(user_name.strip(), limit=1)
        if users and len(users) > 0 and users[0]["name"] == user_name.strip():
            user_id = users[0]["id"]
    except Exception as e:
        print(f"[generate] Could not find user_id for '{user_name}': {e}")

    try:
        if use_mock:
            # ---------- MOCK MODE ----------
            print("[generate] Using MOCK mode")
            caption = "Mock description (activate AI for real generation)"
            prompt = "Mock music prompt"
            music_style = {"genre": "ambient", "bpm": 90, "mood": "neutral"}

            # Generate and save mock audio immediately
            audio_data, sample_rate = generate_mock_audio(duration=duration)
            audio_filename = f"{song_id}.wav"
            audio_path = os.path.join(config.OUT_DIR, audio_filename)
            save_audio(audio_path, audio_data, sample_rate)

            # Save ALL images
            saved_image_paths = []
            for idx, img_bytes_item in enumerate(images_bytes):
                img_filename = f"{song_id}_{idx}.jpg" if idx > 0 else f"{song_id}.jpg"
                img_path = os.path.join(config.OUT_DIR, img_filename)
                with open(img_path, "wb") as f:
                    f.write(img_bytes_item)
                saved_image_paths.append(f"/audio/{img_filename}")

            image_filename = f"{song_id}.jpg"

            # Save to database with SUCCESS status (mock completes immediately)
            database.create_song({
                "id": song_id,
                "user_id": user_id,
                "user_name": user_name.strip(),
                "song_name": final_song_name,
                "image_path": f"/audio/{image_filename}",
                "image_paths": json.dumps(saved_image_paths),  # ALL images
                "image_captions": json.dumps([]),  # Empty captions for mock mode
                "audio_path": f"/audio/{audio_filename}",
                "caption": caption,
                "genre": genre or "ambient",
                "tags": tags,
                "duration": duration,
                "has_vocals": has_vocals,
                "has_lyrics": False,
                "lyrics": None,
                "suno_task_id": None,
                "generation_status": "SUCCESS"
            })

            return JSONResponse({
                "song_id": song_id,
                "task_id": None,
                "status": "SUCCESS",
                "message": "Mock music generated successfully",
                "engine": "mock"
            })

        else:
            # ---------- AI MODE with SunoAPI ----------
            # 1. Generate captions for all images with BLIP (or use generic captions if BLIP unavailable)
            captions_data = []
            if BLIP_READY:
                print(f"[generate] Processing {len(images_bytes)} image(s) with BLIP...")
                for idx, img_bytes_item in enumerate(images_bytes):
                    pil_image = Image.open(io.BytesIO(img_bytes_item)).convert("RGB")
                    caption_data = blip_handler.generate_enhanced_caption(pil_image)
                    captions_data.append(caption_data)
                    print(f"[generate] Image {idx+1}/{len(images_bytes)} - Caption: {caption_data['caption']}")
            else:
                # Fallback: use generic captions when BLIP is disabled
                for idx in range(len(images_bytes)):
                    caption_data = {
                        "caption": f"A {genre or 'musical'} piece inspired by image {idx+1}",
                        "enhanced_caption": f"A {genre or 'musical'} piece inspired by image {idx+1}",
                        "detected_moods": [],
                        "keywords": []
                    }
                    captions_data.append(caption_data)
                print(f"[generate] Using generic captions (BLIP disabled) for {len(images_bytes)} image(s)")

            # 2. Create narrative connecting all images
            narrative_result = create_narrative(captions_data)
            caption = narrative_result["narrative"]
            enhanced_caption = narrative_result["narrative"]
            combined_caption = narrative_result["combined_caption"]
            all_moods = narrative_result["all_moods"]
            dominant_mood = narrative_result["dominant_mood"]

            print(f"[generate] Narrative created: {caption}")
            print(f"[generate] Dominant mood: {dominant_mood}")
            print(f"[generate] All moods: {all_moods}")

            # 3. Map to musical style
            if BLIP_READY:
                music_style = cultural_mapper.map_caption_to_style(caption)
                print(f"[generate] CulturalMapper suggested: {music_style['genre']}")
            else:
                # Default music style when BLIP unavailable
                music_style = {"genre": genre or "ambient", "bpm": 100, "mood": "neutral"}
                print(f"[generate] Using default style (BLIP disabled): {music_style['genre']}")

            # PRIORITY: Use user genre if provided, otherwise use CulturalMapper/default
            if genre and genre.strip():
                print(f"[generate] User override: Using user genre '{genre}' instead of '{music_style['genre']}'")
                music_style["genre"] = genre.strip()

            # 4. Build parameters for SunoAPI Custom Mode
            style, title, lyrics_prompt = prompt_builder.build_for_custom_mode(
                caption=enhanced_caption,
                music_style=music_style,
                user_genre=genre,
                user_tags=tags,
                song_name=song_name,
                has_vocals=has_vocals,
                include_title_in_lyrics=include_title_in_lyrics,
                language=language,  # Pass language for lyrics
                detected_moods=all_moods  # Pass BLIP-detected moods for theme generation
            )
            print(f"[generate] Custom Mode - Style: {style}, Title: {title}")

            # 5. Save ALL images locally
            saved_image_paths = []
            for idx, img_bytes_item in enumerate(images_bytes):
                # Use song_id with index for unique filenames
                img_filename = f"{song_id}_{idx}.jpg" if idx > 0 else f"{song_id}.jpg"
                img_path = os.path.join(config.OUT_DIR, img_filename)
                with open(img_path, "wb") as f:
                    f.write(img_bytes_item)
                saved_image_paths.append(f"/audio/{img_filename}")

            print(f"[generate] Saved {len(saved_image_paths)} image(s): {saved_image_paths}")

            # For backward compatibility, use first image as main image_path
            image_filename = f"{song_id}.jpg"
            main_image_path = f"/audio/{image_filename}"

            # 6. Create task in SunoAPI (ASYNC - don't wait)
            if SUNO_READY and suno_handler:
                print("[generate] Creating SunoAPI task...")

                # Determine instrumental flag (opposite of has_vocals)
                instrumental = not has_vocals

                print(f"[generate] Generating with: instrumental={instrumental}, has_vocals={has_vocals}, has_lyrics={has_lyrics}")

                # --- TWO-STEP FLOW for vocals with lyrics ---
                generated_lyrics = None
                lyrics_mood_adjustment = ""

                if has_vocals and has_lyrics and lyrics_prompt:
                    # Step 1: Generate lyrics first (with 3 retries)
                    print(f"[generate] Step 1: Generating lyrics with prompt: {lyrics_prompt[:100]}...")

                    max_retries = 3
                    retry_count = 0
                    lyrics_success = False

                    while retry_count < max_retries and not lyrics_success:
                        try:
                            if retry_count > 0:
                                print(f"[generate] Retry {retry_count}/{max_retries} for lyrics generation...")

                            lyrics_response = suno_handler.generate_lyrics(
                                prompt=lyrics_prompt
                            )
                            lyrics_task_id = lyrics_response.get("data", {}).get("taskId")

                            if lyrics_task_id:
                                # Wait for lyrics to complete (with timeout)
                                print(f"[generate] Waiting for lyrics task: {lyrics_task_id}")
                                lyrics_result = suno_handler.wait_for_completion(
                                    task_id=lyrics_task_id,
                                    timeout=120,  # 2 minutes max for lyrics
                                    poll_interval=5,
                                    task_type="lyrics"  # SPECIFY LYRICS TYPE
                                )

                                # Extract lyrics text
                                lyrics_data = lyrics_result.get("data", {}).get("response", {}).get("data", [])
                                if lyrics_data and len(lyrics_data) > 0:
                                    generated_lyrics = lyrics_data[0].get("text", "")
                                    print(f"[generate] Lyrics generated successfully: {generated_lyrics[:100]}...")

                                    # Analyze lyrics sentiment ONLY if no moods were detected from images
                                    # This prevents lyrics from overriding BLIP-detected moods
                                    if not all_moods or len(all_moods) == 0:
                                        print("[generate] No image moods detected - analyzing lyrics for mood...")
                                        lyrics_lower = generated_lyrics.lower()

                                        # Detect emotional intensity keywords
                                        if any(word in lyrics_lower for word in ["battle", "fight", "war", "blood", "rage", "fury", "destroy"]):
                                            lyrics_mood_adjustment = "intense and aggressive"
                                            print("[generate] Lyrics analysis: INTENSE/AGGRESSIVE mood detected")
                                        elif any(word in lyrics_lower for word in ["dark", "shadow", "fear", "death", "pain", "sorrow", "cry"]):
                                            lyrics_mood_adjustment = "dark and melancholic"
                                            print("[generate] Lyrics analysis: DARK/MELANCHOLIC mood detected")
                                        elif any(word in lyrics_lower for word in ["love", "heart", "dream", "hope", "light", "joy", "happy"]):
                                            lyrics_mood_adjustment = "uplifting and hopeful"
                                            print("[generate] Lyrics analysis: UPLIFTING/HOPEFUL mood detected")
                                        elif any(word in lyrics_lower for word in ["king", "legend", "hero", "power", "glory", "rise"]):
                                            lyrics_mood_adjustment = "epic and triumphant"
                                            print("[generate] Lyrics analysis: EPIC/TRIUMPHANT mood detected")

                                        # Add mood to style if detected
                                        if lyrics_mood_adjustment and style:
                                            style = f"{style}, {lyrics_mood_adjustment}"
                                            print(f"[generate] Adjusted style with lyrics mood: {style}")
                                    else:
                                        print(f"[generate] Skipping lyrics mood analysis - using image moods: {all_moods}")

                                    lyrics_success = True
                                else:
                                    print(f"[generate] Attempt {retry_count + 1}: No lyrics data in response")
                                    retry_count += 1
                            else:
                                print(f"[generate] Attempt {retry_count + 1}: No task ID received")
                                retry_count += 1

                        except Exception as e:
                            retry_count += 1
                            print(f"[generate] Attempt {retry_count}/{max_retries} failed: {e}")
                            if retry_count >= max_retries:
                                print("[generate] All lyrics attempts failed, continuing with instrumental")
                                instrumental = True  # Fallback to instrumental
                                break

                # Step 2: Generate music with Custom Mode
                print(f"[generate] Step 2: Generating music...")
                suno_response = suno_handler.generate_music(
                    prompt=generated_lyrics if generated_lyrics else "",  # Use generated lyrics or empty
                    style=style,
                    title=title,
                    custom_mode=True,
                    instrumental=instrumental,
                    model=config.SUNO_MODEL
                )

                # Extract task_id from response
                task_id = suno_response.get("data", {}).get("taskId")
                if not task_id:
                    raise RuntimeError("Failed to get taskId from SunoAPI")

                print(f"[generate] SunoAPI task created: {task_id}")

                # Save song to database with PENDING status
                # Capitalize tags properly
                capitalized_tags = None
                if tags:
                    tags_list = [tag.strip().title() for tag in tags.split(",")]
                    capitalized_tags = ", ".join(tags_list)

                # Build individual captions array for carousel
                individual_captions = []
                for idx, caption_data in enumerate(captions_data):
                    individual_captions.append({
                        "index": idx,
                        "caption": caption_data.get("caption", ""),
                        "moods": caption_data.get("detected_moods", [])[:3]  # Top 3 moods
                    })

                # DIAGNOSTIC LOGS
                print(f"[generate] Saved image paths: {saved_image_paths}")
                print(f"[generate] Individual captions: {individual_captions}")
                image_paths_json = json.dumps(saved_image_paths)
                image_captions_json = json.dumps(individual_captions)
                print(f"[generate] image_paths JSON: {image_paths_json}")
                print(f"[generate] image_captions JSON: {image_captions_json}")

                database.create_song({
                    "id": song_id,
                    "user_id": user_id,
                    "user_name": user_name.strip(),
                    "song_name": final_song_name,
                    "image_path": main_image_path,  # Main image (first one)
                    "image_paths": image_paths_json,  # ALL images as JSON array
                    "image_captions": image_captions_json,  # Individual captions for each image
                    "audio_path": "",  # Will be updated when task completes
                    "caption": caption,
                    "genre": style,  # Use capitalized style from Custom Mode
                    "tags": capitalized_tags,  # Capitalized tags
                    "duration": duration,  # Requested duration, may change when complete
                    "has_vocals": has_vocals,
                    "has_lyrics": has_lyrics and has_vocals and generated_lyrics is not None,
                    "lyrics": generated_lyrics,  # Store generated lyrics
                    "suno_task_id": task_id,
                    "generation_status": "PENDING"
                })

                # Return task_id for polling
                return JSONResponse({
                    "song_id": song_id,
                    "task_id": task_id,
                    "status": "PENDING",
                    "message": "Music generation started. Use task_id to check status.",
                    "engine": "suno"
                })
            else:
                # SunoAPI not available, fallback to mock
                print("[generate] SunoAPI not available, using mock")
                raise RuntimeError("SunoAPI not available")

    except Exception as e:
        # Error: Fallback to mock
        print(f"[generate] Error: {repr(e)}, falling back to mock")

        # Generate and save mock audio
        audio_data, sample_rate = generate_mock_audio(duration=duration)
        audio_filename = f"{song_id}.wav"
        audio_path = os.path.join(config.OUT_DIR, audio_filename)
        save_audio(audio_path, audio_data, sample_rate)

        # Save ALL images if not saved yet
        saved_image_paths = []
        for idx, img_bytes_item in enumerate(images_bytes):
            img_filename = f"{song_id}_{idx}.jpg" if idx > 0 else f"{song_id}.jpg"
            img_path = os.path.join(config.OUT_DIR, img_filename)
            if not os.path.exists(img_path):
                with open(img_path, "wb") as f:
                    f.write(img_bytes_item)
            saved_image_paths.append(f"/audio/{img_filename}")

        image_filename = f"{song_id}.jpg"

        # Save to database
        database.create_song({
            "id": song_id,
            "user_id": user_id,
            "user_name": user_name.strip(),
            "song_name": final_song_name,
            "image_path": f"/audio/{image_filename}",
            "image_paths": json.dumps(saved_image_paths),  # ALL images
            "image_captions": json.dumps([]),  # Empty captions for error fallback
            "audio_path": f"/audio/{audio_filename}",
            "caption": "Error occurred (fallback to mock)",
            "genre": genre or "ambient",
            "tags": tags,
            "duration": duration,
            "has_vocals": has_vocals,
            "has_lyrics": False,
            "lyrics": None,
            "suno_task_id": None,
            "generation_status": "SUCCESS"
        })

        return JSONResponse({
            "song_id": song_id,
            "task_id": None,
            "status": "SUCCESS",
            "message": "Fallback to mock music (error occurred)",
            "engine": "mock",
            "error": str(e)
        })


@app.post("/webhook/suno")
async def suno_webhook(request_data: dict = Body(...)):
    """
    Webhook endpoint to receive SunoAPI callbacks.

    This endpoint receives notifications when music generation completes,
    allowing us to update the database immediately instead of waiting for polling.

    Args:
        request_data: Callback data from SunoAPI

    Returns:
        Success confirmation
    """
    try:
        print(f"[webhook/suno] Received callback: {request_data}")

        # Extract callback data
        code = request_data.get("code")
        msg = request_data.get("msg")
        data = request_data.get("data", {})
        callback_type = data.get("callbackType")
        task_id = data.get("task_id") or data.get("taskId")

        if not task_id:
            print(f"[webhook/suno] No task_id in callback")
            return JSONResponse({"status": "error", "message": "No task_id"}, status_code=400)

        # Find song by task_id
        song = database.get_song_by_task_id(task_id)
        if not song:
            print(f"[webhook/suno] Song not found for task_id: {task_id}")
            return JSONResponse({"status": "error", "message": "Song not found"}, status_code=404)

        song_id = song["id"]

        # Handle different callback types
        if code == 200 and callback_type == "complete":
            # Success - extract music data
            music_data = data.get("data", [])

            if music_data and len(music_data) > 0:
                track = music_data[0]

                audio_url = track.get("audio_url")
                actual_duration = track.get("duration", song["duration"])
                lyrics = track.get("prompt") if song["has_lyrics"] else None

                # Update database
                database.update_song_status(
                    song_id=song_id,
                    status="SUCCESS",
                    audio_url=audio_url,
                    image_url=None,  # Keep original uploaded image
                    duration=int(actual_duration) if actual_duration else song["duration"],
                    lyrics=lyrics
                )

                print(f"[webhook/suno] Successfully updated song {song_id}")
                return JSONResponse({"status": "success", "message": "Song updated"})
            else:
                # No music data
                database.update_song_status(song_id, status="FAILED")
                print(f"[webhook/suno] No music data in callback")
                return JSONResponse({"status": "error", "message": "No music data"}, status_code=500)

        elif callback_type == "error" or code != 200:
            # Failed
            error_msg = msg or "Unknown error"
            database.update_song_status(song_id, status="FAILED")
            print(f"[webhook/suno] Task failed: {error_msg}")
            return JSONResponse({"status": "error", "message": error_msg}, status_code=500)
        else:
            # Still generating (text, first, etc.)
            print(f"[webhook/suno] Task still generating: {callback_type}")
            return JSONResponse({"status": "pending", "message": f"Status: {callback_type}"})

    except Exception as e:
        print(f"[webhook/suno] Error processing callback: {repr(e)}")
        return JSONResponse({"status": "error", "message": str(e)}, status_code=500)


@app.get("/generate/status/{task_id}")
def check_generation_status(task_id: str):
    """
    Check status of a SunoAPI music generation task.

    Args:
        task_id: SunoAPI task ID

    Returns:
        JSON with task status and song data when complete
    """
    try:
        # Find song by task_id
        song = database.get_song_by_task_id(task_id)
        if not song:
            raise HTTPException(404, "Song not found for this task_id")

        song_id = song["id"]

        # Check if already completed
        if song["generation_status"] == "SUCCESS":
            return JSONResponse({
                "status": "SUCCESS",
                "song_id": song_id,
                "song": song
            })

        # Check SunoAPI status
        if not SUNO_READY or not suno_handler:
            raise HTTPException(503, "SunoAPI not available")

        # Query SunoAPI for task status
        suno_status = suno_handler.check_status(task_id)
        suno_data = suno_status.get("data", {})
        status = suno_data.get("status", "UNKNOWN")

        print(f"[check_status] Task {task_id}: {status}")

        # Update database based on status
        if status == "SUCCESS":
            # Extract song data from response
            response = suno_data.get("response", {})
            suno_songs = response.get("sunoData", [])

            if suno_songs and len(suno_songs) > 0:
                suno_song = suno_songs[0]

                # Extract data
                audio_url = suno_song.get("audioUrl")
                # Don't use SunoAPI image - keep the uploaded image
                actual_duration = suno_song.get("duration", song["duration"])
                lyrics = suno_song.get("prompt") if song["has_lyrics"] else None

                # Update song in database (without image_url to keep original)
                database.update_song_status(
                    song_id=song_id,
                    status="SUCCESS",
                    audio_url=audio_url,
                    image_url=None,  # Keep original uploaded image
                    duration=int(actual_duration) if actual_duration else song["duration"],
                    lyrics=lyrics
                )

                # Fetch updated song
                updated_song = database.get_song(song_id)

                return JSONResponse({
                    "status": "SUCCESS",
                    "song_id": song_id,
                    "song": updated_song
                })
            else:
                # No songs in response, mark as failed
                database.update_song_status(song_id, status="FAILED")
                raise HTTPException(500, "No songs in SunoAPI response")

        elif status in ["CREATE_TASK_FAILED", "GENERATE_AUDIO_FAILED",
                       "CALLBACK_EXCEPTION", "SENSITIVE_WORD_ERROR"]:
            # Task failed
            error_message = suno_data.get("errorMessage", "Unknown error")
            database.update_song_status(song_id, status="FAILED")

            return JSONResponse({
                "status": "FAILED",
                "song_id": song_id,
                "error": error_message
            })

        else:
            # Still generating (PENDING, TEXT_SUCCESS, FIRST_SUCCESS, etc.)
            return JSONResponse({
                "status": "GENERATING",
                "song_id": song_id,
                "message": f"Task status: {status}"
            })

    except HTTPException:
        raise
    except Exception as e:
        print(f"[check_status] Error: {repr(e)}")
        raise HTTPException(500, f"Error checking status: {str(e)}")


@app.get("/audio/{filename}")
def get_audio(filename: str):
    """
    Serve audio/image file.

    Args:
        filename: File filename (e.g., "abc123.wav" or "abc123.jpg")

    Returns:
        Audio or Image file
    """
    file_path = os.path.join(config.OUT_DIR, filename)

    if not os.path.exists(file_path):
        raise HTTPException(404, "File not found")

    # Determine media type
    if filename.endswith('.wav'):
        media_type = "audio/wav"
    elif filename.endswith('.mp3'):
        media_type = "audio/mpeg"
    elif filename.endswith('.jpg') or filename.endswith('.jpeg'):
        media_type = "image/jpeg"
    elif filename.endswith('.png'):
        media_type = "image/png"
    else:
        media_type = "application/octet-stream"

    return FileResponse(
        file_path,
        media_type=media_type,
        filename=filename
    )


# ---------- SONGS ENDPOINTS ----------

@app.get("/songs", response_model=List[SongResponse])
def get_songs(
    limit: int = Query(default=100, le=500),
    offset: int = Query(default=0, ge=0)
):
    """
    Get all songs with pagination.

    Args:
        limit: Maximum number of songs to return (max 500)
        offset: Number of songs to skip

    Returns:
        List of songs
    """
    songs = database.get_all_songs(limit=limit, offset=offset)
    return songs


@app.get("/songs/user/{user_name}", response_model=List[SongResponse])
def get_songs_by_user(
    user_name: str,
    limit: int = Query(default=100, le=500),
    offset: int = Query(default=0, ge=0)
):
    """
    Get all songs by a specific user.

    Args:
        user_name: Name of the user
        limit: Maximum number of songs to return
        offset: Number of songs to skip

    Returns:
        List of songs by the user
    """
    songs = database.get_songs_by_user(user_name=user_name, limit=limit, offset=offset)
    return songs


@app.get("/songs/{song_id}", response_model=SongResponse)
def get_song(song_id: str):
    """
    Get a specific song by ID.

    Args:
        song_id: ID of the song

    Returns:
        Song data
    """
    song = database.get_song(song_id)

    if not song:
        raise HTTPException(404, "Song not found")

    return song


@app.put("/songs/{song_id}/like")
def toggle_like(song_id: str, is_liked: bool = Query(...)):
    """
    Toggle like status for a song.

    Args:
        song_id: ID of the song
        is_liked: New like status (true/false)

    Returns:
        Success message
    """
    success = database.update_song_like(song_id, is_liked)

    if not success:
        raise HTTPException(404, "Song not found")

    return {"success": True, "is_liked": is_liked}


@app.delete("/songs/{song_id}")
def delete_song(song_id: str):
    """
    Delete a song.

    Args:
        song_id: ID of the song

    Returns:
        Success message
    """
    # Get song to find files
    song = database.get_song(song_id)

    if not song:
        raise HTTPException(404, "Song not found")

    # Delete from database
    database.delete_song(song_id)

    # Delete files (optional: keep files for backup)
    # Uncomment if you want to delete files too
    # if song.get("audio_path"):
    #     audio_file = song["audio_path"].replace("/audio/", "")
    #     audio_path = os.path.join(config.OUT_DIR, audio_file)
    #     if os.path.exists(audio_path):
    #         os.remove(audio_path)
    #
    # if song.get("image_path"):
    #     image_file = song["image_path"].replace("/audio/", "")
    #     image_path = os.path.join(config.OUT_DIR, image_file)
    #     if os.path.exists(image_path):
    #         os.remove(image_path)

    return {"success": True, "message": "Song deleted successfully"}


@app.get("/songs/search/query")
def search_songs(q: str = Query(..., min_length=1), limit: int = Query(default=50, le=200)):
    """
    Search songs by name, user, tags, or caption.

    Args:
        q: Search query
        limit: Maximum number of results

    Returns:
        List of matching songs
    """
    songs = database.search_songs(query=q, limit=limit)
    return songs


# ---------- PLAYLISTS ENDPOINTS ----------

class CreatePlaylistRequest(BaseModel):
    user_id: int
    name: str
    description: Optional[str] = None
    is_public: bool = True


class UpdatePlaylistRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_public: Optional[bool] = None


class AddSongToPlaylistRequest(BaseModel):
    song_id: str


@app.post("/playlists")
def create_playlist_endpoint(req: CreatePlaylistRequest):
    """
    Create a new playlist.

    Args:
        req: Playlist creation data

    Returns:
        Playlist ID
    """
    try:
        playlist_id = playlist_service.create_playlist(
            user_id=req.user_id,
            name=req.name,
            description=req.description,
            is_public=req.is_public
        )
        return {"playlist_id": playlist_id, "success": True}
    except Exception as e:
        print(f"[create_playlist] Error: {e}")
        raise HTTPException(500, "Failed to create playlist")


@app.get("/playlists/user/{user_id}")
def get_user_playlists_endpoint(user_id: int):
    """
    Get all playlists for a user.

    Args:
        user_id: User ID

    Returns:
        List of playlists with song count
    """
    try:
        playlists = playlist_service.get_user_playlists(user_id)
        return playlists
    except Exception as e:
        print(f"[get_user_playlists] Error: {e}")
        raise HTTPException(500, "Failed to get playlists")


@app.get("/playlists/public")
def get_public_playlists_endpoint(limit: int = Query(default=50, le=200)):
    """
    Get all public playlists.

    Args:
        limit: Maximum number of playlists

    Returns:
        List of public playlists
    """
    try:
        playlists = playlist_service.get_public_playlists(limit)
        return playlists
    except Exception as e:
        print(f"[get_public_playlists] Error: {e}")
        raise HTTPException(500, "Failed to get public playlists")


@app.get("/playlists/{playlist_id}")
def get_playlist_endpoint(playlist_id: int):
    """
    Get a specific playlist.

    Args:
        playlist_id: Playlist ID

    Returns:
        Playlist data
    """
    try:
        playlist = playlist_service.get_playlist_by_id(playlist_id)
        if not playlist:
            raise HTTPException(404, "Playlist not found")
        return playlist
    except HTTPException:
        raise
    except Exception as e:
        print(f"[get_playlist] Error: {e}")
        raise HTTPException(500, "Failed to get playlist")


@app.get("/playlists/{playlist_id}/songs")
def get_playlist_songs_endpoint(playlist_id: int):
    """
    Get all songs in a playlist.

    Args:
        playlist_id: Playlist ID

    Returns:
        List of songs in playlist order
    """
    try:
        songs = playlist_service.get_playlist_songs(playlist_id)
        return songs
    except Exception as e:
        print(f"[get_playlist_songs] Error: {e}")
        raise HTTPException(500, "Failed to get playlist songs")


@app.post("/playlists/{playlist_id}/songs")
def add_song_to_playlist_endpoint(playlist_id: int, req: AddSongToPlaylistRequest):
    """
    Add a song to a playlist.

    Args:
        playlist_id: Playlist ID
        req: Song ID to add

    Returns:
        Success status
    """
    try:
        success = playlist_service.add_song_to_playlist(playlist_id, req.song_id)
        if not success:
            raise HTTPException(400, "Failed to add song to playlist")
        return {"success": True, "message": "Song added to playlist"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"[add_song_to_playlist] Error: {e}")
        raise HTTPException(500, "Failed to add song to playlist")


@app.delete("/playlists/{playlist_id}/songs/{song_id}")
def remove_song_from_playlist_endpoint(playlist_id: int, song_id: str):
    """
    Remove a song from a playlist.

    Args:
        playlist_id: Playlist ID
        song_id: Song ID to remove

    Returns:
        Success status
    """
    try:
        success = playlist_service.remove_song_from_playlist(playlist_id, song_id)
        if not success:
            raise HTTPException(400, "Failed to remove song from playlist")
        return {"success": True, "message": "Song removed from playlist"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"[remove_song_from_playlist] Error: {e}")
        raise HTTPException(500, "Failed to remove song from playlist")


@app.put("/playlists/{playlist_id}")
def update_playlist_endpoint(playlist_id: int, req: UpdatePlaylistRequest):
    """
    Update playlist details.

    Args:
        playlist_id: Playlist ID
        req: Updated playlist data

    Returns:
        Success status
    """
    try:
        success = playlist_service.update_playlist(
            playlist_id=playlist_id,
            name=req.name,
            description=req.description,
            is_public=req.is_public
        )
        if not success:
            raise HTTPException(400, "No fields to update or playlist not found")
        return {"success": True, "message": "Playlist updated"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"[update_playlist] Error: {e}")
        raise HTTPException(500, "Failed to update playlist")


@app.delete("/playlists/{playlist_id}")
def delete_playlist_endpoint(playlist_id: int):
    """
    Delete a playlist.

    Args:
        playlist_id: Playlist ID

    Returns:
        Success status
    """
    try:
        success = playlist_service.delete_playlist(playlist_id)
        if not success:
            raise HTTPException(404, "Playlist not found")
        return {"success": True, "message": "Playlist deleted"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"[delete_playlist] Error: {e}")
        raise HTTPException(500, "Failed to delete playlist")


# ---------- RUN ----------
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=config.PORT)
