import os
import io
import uuid
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
from src.models.udio_handler import UdioHandler
from src.services.cultural_mapper import CulturalMapper
from src.services.prompt_builder import PromptBuilder
from src.utils.audio_utils import save_audio

# Import database
from src import database

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

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://wave-length-ai.vercel.app",  # Production Vercel URL
        "https://wave-length-l708r2qg0-xsh4doows-projects.vercel.app",  # Vercel Preview URL
        "https://wavelength-ai.onrender.com",  # Render Backend URL
        "https://wavelength-frontend.loca.lt",  # localtunnel frontend
        "http://localhost:8080",  # Development
        "http://localhost:8081",  # Development
        "http://localhost:8082",  # Development
        "http://localhost:5173",  # Vite dev alternate port
        "http://localhost:5174",  # Vite dev alternate port
        "http://localhost:3000",  # React dev
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create output directory
os.makedirs(config.OUT_DIR, exist_ok=True)

# ---------- GLOBAL HANDLERS (Lazy Load) ----------
blip_handler: Optional[BLIPHandler] = None
udio_handler: Optional[UdioHandler] = None
cultural_mapper = CulturalMapper()
prompt_builder = PromptBuilder()

# AI availability flags
BLIP_READY = False
UDIO_READY = False


def init_ai_handlers():
    """Initialize AI handlers (lazy loading)."""
    global blip_handler, udio_handler, BLIP_READY, UDIO_READY

    try:
        # Initialize BLIP (always needed for image captioning)
        if blip_handler is None:
            blip_handler = BLIPHandler(model_name=config.BLIP_MODEL)
            BLIP_READY = True
            print("[main] BLIP handler initialized successfully")
    except Exception as e:
        print(f"[main] Failed to initialize BLIP: {repr(e)}")
        BLIP_READY = False

    try:
        # Initialize GoAPI.ai (Udio/Suno) if enabled and API key provided
        if config.USE_UDIO and config.GOAPI_API_KEY:
            if udio_handler is None:
                udio_handler = UdioHandler(
                    api_key=config.GOAPI_API_KEY,
                    api_url=config.GOAPI_API_URL
                )
                UDIO_READY = True
                print("[main] GoAPI.ai handler initialized successfully")
        else:
            print("[main] GoAPI.ai disabled or no API key provided")
    except Exception as e:
        print(f"[main] Failed to initialize GoAPI.ai: {repr(e)}")
        UDIO_READY = False


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
        "udio_ready": UDIO_READY,
        "device": device,
        "music_generation": "udio_api" if UDIO_READY else "mock",
        "models_loaded": {
            "blip": blip_handler is not None and blip_handler.is_loaded() if blip_handler else False,
            "udio": udio_handler is not None if udio_handler else False
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
    image: UploadFile = File(...),
    user_name: str = Form(...),
    song_name: Optional[str] = Form(None),
    genre: Optional[str] = Form(None),
    tags: Optional[str] = Form(None),
    duration: int = Form(30),
    has_vocals: bool = Form(False),
    has_lyrics: bool = Form(False),
    engine: Optional[str] = Form(None)  # "blip" | "mock" | None
):
    """
    Generate music from image.

    Args:
        image: Image file
        user_name: Name of the user creating the song
        song_name: Name of the song (optional)
        genre: Music genre (optional)
        tags: Tags separated by commas (optional)
        duration: Duration in seconds (15-100)
        has_vocals: Whether the music has vocals
        has_lyrics: Whether to generate lyrics
        engine: "mock" | "blip" | None (auto)

    Returns:
        JSON with song data including audio_url
    """
    # Validate duration (Udio typically supports up to 60-120s, but we keep 15-100 range)
    if not 15 <= duration <= 100:
        raise HTTPException(400, "Duration must be between 15 and 100 seconds")

    # Validate user_name
    if not user_name or not user_name.strip():
        raise HTTPException(400, "user_name is required")

    # Read image
    img_bytes = await image.read()

    # Try to initialize AI handlers
    use_mock = (engine == "mock")
    if not use_mock:
        try:
            init_ai_handlers()
        except Exception as e:
            print(f"[generate] Failed to initialize AI: {repr(e)}")

    # Final decision: use mock if BLIP not ready or explicitly requested
    use_mock = (engine == "mock") or (not BLIP_READY)

    # Initialize lyrics variable
    lyrics = None

    try:
        if use_mock:
            # ---------- MOCK MODE ----------
            caption = "Mock description (activate AI for real generation)"
            prompt = "Mock music prompt"
            music_style = {
                "genre": "ambient",
                "bpm": 90,
                "mood": "neutral"
            }
            audio_data, sample_rate = generate_mock_audio(duration=duration)
        else:
            # ---------- AI MODE ----------
            # 1. Convert to PIL Image
            pil_image = Image.open(io.BytesIO(img_bytes)).convert("RGB")

            # 2. Generate enhanced caption with BLIP
            caption_data = blip_handler.generate_enhanced_caption(pil_image)
            caption = caption_data["caption"]
            enhanced_caption = caption_data["enhanced_caption"]
            print(f"[generate] Caption: {caption}")
            print(f"[generate] Enhanced: {enhanced_caption}")

            # 3. Map to musical style
            music_style = cultural_mapper.map_caption_to_style(caption)
            print(f"[generate] Style: {music_style['genre']} - {music_style['subgenre']}")

            # 4. Build prompt (pass user genre and tags if provided)
            prompt = prompt_builder.build(
                caption=enhanced_caption,  # Use enhanced caption for better results
                music_style=music_style,
                user_genre=genre if genre else None,
                user_tags=tags if tags else None
            )
            print(f"[generate] Prompt: {prompt}")

            # 5. Generate audio with Udio API or fallback to mock
            if UDIO_READY and udio_handler:
                # Use Udio API for music generation
                print(f"[generate] Using Udio API for music generation...")

                # Determine lyrics type based on parameters
                if has_vocals and has_lyrics:
                    lyrics_type = "generate"  # Let Udio generate lyrics
                elif has_vocals:
                    lyrics_type = "generate"  # Vocals with auto-generated lyrics
                else:
                    lyrics_type = "instrumental"  # No vocals

                # Create temporary path for Udio download
                file_id = uuid.uuid4().hex
                audio_filename = f"{file_id}.wav"
                audio_path = os.path.join(config.OUT_DIR, audio_filename)

                # Generate and download from Udio
                try:
                    # Determine song title
                    final_song_name = song_name if song_name and song_name.strip() else "Generated Song"

                    # Generate and download
                    _, api_result = udio_handler.generate_and_download(
                        prompt=prompt,
                        save_path=audio_path,
                        title=final_song_name,
                        lyrics_type=lyrics_type,
                        timeout=300  # 5 minutes timeout
                    )
                    print(f"[generate] GoAPI.ai generation successful!")

                    # Extract lyrics from API response if available
                    # GoAPI.ai structure: result.data.output.lyrics or result.data.lyrics
                    data = api_result.get("data", {})
                    api_lyrics = data.get("lyrics") or data.get("output", {}).get("lyrics")

                    if api_lyrics and (has_lyrics and has_vocals):
                        lyrics = api_lyrics  # Use API-generated lyrics
                        print(f"[generate] Lyrics received from API ({len(api_lyrics)} chars)")

                    # Audio already saved, set flag to skip save_audio later
                    audio_saved = True
                except Exception as udio_error:
                    print(f"[generate] GoAPI.ai failed: {udio_error}, falling back to mock")
                    audio_data, sample_rate = generate_mock_audio(duration=duration)
                    audio_saved = False
                    use_mock = True
            else:
                # Fallback to mock audio
                print(f"[generate] Udio not available, using mock audio")
                audio_data, sample_rate = generate_mock_audio(duration=duration)
                audio_saved = False
                use_mock = True

    except Exception as e:
        # Fallback to mock on any error
        print(f"[generate] Error during generation, falling back to mock: {repr(e)}")
        caption = "Error occurred (fallback to mock)"
        prompt = "Mock music prompt (fallback)"
        music_style = {
            "genre": "ambient",
            "bpm": 90,
            "mood": "neutral"
        }
        audio_data, sample_rate = generate_mock_audio(duration=duration)
        audio_saved = False
        use_mock = True

    # 6. Save files
    # Check if we need to generate file_id (might already exist from Udio flow)
    if 'file_id' not in locals():
        file_id = uuid.uuid4().hex
        audio_filename = f"{file_id}.wav"
        audio_path = os.path.join(config.OUT_DIR, audio_filename)

    # Save audio (only if not already saved by Udio)
    if 'audio_saved' not in locals() or not audio_saved:
        save_audio(audio_path, audio_data, sample_rate)

    # Save image
    image_filename = f"{file_id}.jpg"
    image_path = os.path.join(config.OUT_DIR, image_filename)
    with open(image_path, "wb") as f:
        f.write(img_bytes)

    # 7. Generate lyrics if requested
    lyrics = None
    if has_lyrics and has_vocals:
        # TODO: Integrate with LLM for lyrics generation
        # For now, use placeholder
        lyrics = f"♪ Letra baseada em: {caption} ♪\n\n(Em breve: letras geradas por IA)"

    # 8. Save to database
    final_song_name = song_name if song_name and song_name.strip() else "Música Gerada"
    song_data = {
        "id": file_id,
        "user_name": user_name.strip(),
        "song_name": final_song_name,
        "image_path": f"/audio/{image_filename}",
        "audio_path": f"/audio/{audio_filename}",
        "caption": caption,
        "genre": genre or music_style.get("genre", "unknown"),
        "tags": tags,
        "duration": duration,
        "has_vocals": has_vocals,
        "has_lyrics": has_lyrics and has_vocals,
        "lyrics": lyrics,
    }

    database.create_song(song_data)

    # 9. Return response
    # Determine engine used
    if use_mock:
        engine_used = "mock"
    elif UDIO_READY and udio_handler:
        engine_used = "udio"
    else:
        engine_used = "blip"

    return JSONResponse({
        "id": file_id,
        "song_name": final_song_name,
        "caption": caption,
        "prompt": prompt,
        "duration": duration,
        "audio_url": f"/audio/{audio_filename}",
        "image_url": f"/audio/{image_filename}",
        "engine": engine_used,
        "has_vocals": has_vocals,
        "has_lyrics": has_lyrics and has_vocals,
        "lyrics": lyrics,
        "metadata": {
            "genre": music_style.get("genre", "unknown"),
            "bpm": music_style.get("bpm", 0),
            "mood": music_style.get("mood", "neutral")
        }
    })


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


# ---------- RUN ----------
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=config.PORT)
