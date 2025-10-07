import os
import io
import uuid
from typing import Optional
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
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
    duration: int = Form(15),
    engine: Optional[str] = Form(None)  # "blip" | "mock" | None
):
    """
    Generate music from image.

    Args:
        image: Image file
        duration: Duration in seconds (15-60)
        engine: "mock" | "blip" | None (auto)

    Returns:
        JSON with caption, prompt, audio_url, metadata
    """
    # Validate duration
    if not 15 <= duration <= 60:
        raise HTTPException(400, "Duration must be between 15 and 60 seconds")

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

    # 6. Save audio
    file_id = uuid.uuid4().hex
    audio_filename = f"{file_id}.wav"
    audio_path = os.path.join(config.OUT_DIR, audio_filename)
    save_audio(audio_path, audio_data, sample_rate)

    # 7. Return response
    return JSONResponse({
        "caption": caption,
        "prompt": prompt,
        "duration": duration,
        "audio_url": f"/audio/{audio_filename}",
        "engine": "mock" if use_mock else "blip",
        "metadata": {
            "genre": music_style.get("genre", "unknown"),
            "bpm": music_style.get("bpm", 0),
            "mood": music_style.get("mood", "neutral")
        }
    })


@app.get("/audio/{filename}")
def get_audio(filename: str):
    """
    Serve audio file.

    Args:
        filename: Audio filename (e.g., "abc123.wav")

    Returns:
        WAV file
    """
    audio_path = os.path.join(config.OUT_DIR, filename)

    if not os.path.exists(audio_path):
        raise HTTPException(404, "Audio file not found")

    return FileResponse(
        audio_path,
        media_type="audio/wav",
        filename=filename
    )


# ---------- RUN ----------
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=config.PORT)
