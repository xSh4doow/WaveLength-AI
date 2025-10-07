import os
import io
import uuid
from typing import Optional, List
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from PIL import Image
import numpy as np

# Import config
from src import config

# Import handlers
from src.models.blip_handler import BLIPHandler
from src.models.musicgen_handler import MusicGenHandler
from src.services.cultural_mapper import CulturalMapper
from src.services.prompt_builder import PromptBuilder
from src.utils.audio_utils import save_audio

# Import database
from src import database

# Import schemas
from src.models.schemas import SongResponse, SongUpdate

# ---------- APP SETUP ----------
app = FastAPI(
    title="WaveLength Backend",
    description="Transform images into music using AI",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production: restrict to specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create output directory
os.makedirs(config.OUT_DIR, exist_ok=True)

# ---------- GLOBAL HANDLERS (Lazy Load) ----------
blip_handler: Optional[BLIPHandler] = None
musicgen_handler: Optional[MusicGenHandler] = None
cultural_mapper = CulturalMapper()
prompt_builder = PromptBuilder()

# AI availability flag
AI_READY = False


def init_ai_handlers():
    """Initialize AI handlers (lazy loading)."""
    global blip_handler, musicgen_handler, AI_READY

    if AI_READY:
        return

    try:
        # Initialize BLIP
        if blip_handler is None:
            blip_handler = BLIPHandler(model_name=config.BLIP_MODEL)

        # Initialize MusicGen
        if musicgen_handler is None:
            musicgen_handler = MusicGenHandler(model_name=config.MUSICGEN_MODEL)

        AI_READY = True
        print("[main] AI handlers initialized successfully")
    except Exception as e:
        print(f"[main] Failed to initialize AI handlers: {repr(e)}")
        AI_READY = False


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
        "ai_ready": AI_READY,
        "device": device,
        "models_loaded": {
            "blip": blip_handler is not None and blip_handler.is_loaded() if blip_handler else False,
            "musicgen": musicgen_handler is not None and musicgen_handler.is_loaded() if musicgen_handler else False
        }
    }


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
    # Validate duration
    if not 15 <= duration <= 100:
        raise HTTPException(400, "Duration must be between 15 and 100 seconds")

    # Validate user_name
    if not user_name or not user_name.strip():
        raise HTTPException(400, "user_name is required")

    # Read image
    img_bytes = await image.read()

    # Try to initialize AI if not in mock mode
    use_mock = (engine == "mock")
    if not use_mock:
        try:
            init_ai_handlers()
        except Exception as e:
            print(f"[generate] Failed to initialize AI: {repr(e)}")

    # Final decision: use mock if AI not ready or explicitly requested
    use_mock = (engine == "mock") or (not AI_READY)

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

            # 2. Generate caption with BLIP
            caption = blip_handler.generate_caption(pil_image)
            print(f"[generate] Caption: {caption}")

            # 3. Map to musical style
            music_style = cultural_mapper.map_caption_to_style(caption)
            print(f"[generate] Style: {music_style['genre']} - {music_style['subgenre']}")

            # 4. Build prompt
            prompt = prompt_builder.build(caption, music_style)
            print(f"[generate] Prompt: {prompt}")

            # 5. Generate audio with MusicGen
            audio_data, sample_rate = musicgen_handler.generate_audio(
                prompt=prompt,
                duration=duration
            )

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
        use_mock = True

    # 6. Save files
    file_id = uuid.uuid4().hex

    # Save audio
    audio_filename = f"{file_id}.wav"
    audio_path = os.path.join(config.OUT_DIR, audio_filename)
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
    return JSONResponse({
        "id": file_id,
        "song_name": final_song_name,
        "caption": caption,
        "prompt": prompt,
        "duration": duration,
        "audio_url": f"/audio/{audio_filename}",
        "image_url": f"/audio/{image_filename}",
        "engine": "mock" if use_mock else "blip",
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
