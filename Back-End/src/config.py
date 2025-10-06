import os
from dotenv import load_dotenv

load_dotenv()

# Server
PORT = int(os.getenv("PORT", "8000"))

# Models
BLIP_MODEL = os.getenv("BLIP_MODEL", "Salesforce/blip-image-captioning-large")
MUSICGEN_MODEL = os.getenv("MUSICGEN_MODEL", "facebook/musicgen-small")

# Paths
OUT_DIR = os.path.join(os.path.dirname(__file__), "out")

# Feature flags
USE_CLIP = os.getenv("USE_CLIP", "false").lower() == "true"

# Device (auto, cuda, cpu, mps)
DEVICE = os.getenv("DEVICE", "auto")
