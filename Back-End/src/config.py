import os
from dotenv import load_dotenv

load_dotenv()

# Server
PORT = int(os.getenv("PORT", "8000"))

# Image Captioning Model
USE_BLIP = os.getenv("USE_BLIP", "true").lower() == "true"
BLIP_MODEL = os.getenv("BLIP_MODEL", "Salesforce/blip-image-captioning-large")

# Music Generation API (SunoAPI)
USE_SUNO = os.getenv("USE_SUNO", "true").lower() == "true"
SUNO_API_KEY = os.getenv("SUNO_API_KEY", "c76638c2827ca387dde5107e4ac2ca73")
SUNO_API_URL = os.getenv("SUNO_API_URL", "https://api.sunoapi.org")
SUNO_MODEL = os.getenv("SUNO_MODEL", "V4")  # V3_5, V4, V4_5, V4_5PLUS, V5

# Paths
OUT_DIR = os.path.join(os.path.dirname(__file__), "out")

# Device (auto, cuda, cpu, mps)
DEVICE = os.getenv("DEVICE", "auto")

# CORS - Allowed origins
CORS_ORIGINS = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:5173,http://localhost:3000,http://localhost:8080,https://wave-length-ai.vercel.app"
).split(",")
