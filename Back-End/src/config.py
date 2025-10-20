import os
from dotenv import load_dotenv

load_dotenv()

# Server
PORT = int(os.getenv("PORT", "8000"))

# Image Captioning Model
BLIP_MODEL = os.getenv("BLIP_MODEL", "Salesforce/blip-image-captioning-large")

# Music Generation API (Udio/Suno)
USE_UDIO = os.getenv("USE_UDIO", "false").lower() == "true"
UDIO_API_KEY = os.getenv("UDIO_API_KEY", "")
UDIO_API_URL = os.getenv("UDIO_API_URL", "https://api.udio.com/v1")

# Paths
OUT_DIR = os.path.join(os.path.dirname(__file__), "out")

# Device (auto, cuda, cpu, mps)
DEVICE = os.getenv("DEVICE", "auto")
