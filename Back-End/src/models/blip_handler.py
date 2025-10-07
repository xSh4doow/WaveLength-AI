import torch
from PIL import Image
from transformers import BlipProcessor, BlipForConditionalGeneration
from typing import Optional


class BLIPHandler:
    """Handler for BLIP image captioning model."""

    def __init__(self, model_name: str = "Salesforce/blip-image-captioning-large"):
        self.model_name = model_name
        self.processor: Optional[BlipProcessor] = None
        self.model: Optional[BlipForConditionalGeneration] = None
        self.device = self._detect_device()

    def _detect_device(self) -> str:
        """Detect best available device (CUDA > MPS > CPU)."""
        if torch.cuda.is_available():
            return "cuda"
        elif hasattr(torch.backends, "mps") and torch.backends.mps.is_available():
            return "mps"
        else:
            return "cpu"

    def load(self):
        """Lazy load the BLIP model and processor."""
        if self.model is not None:
            return  # Already loaded

        print(f"[BLIPHandler] Loading BLIP model on {self.device}...")
        self.processor = BlipProcessor.from_pretrained(self.model_name)
        self.model = BlipForConditionalGeneration.from_pretrained(self.model_name)
        self.model.to(self.device)
        print(f"[BLIPHandler] BLIP model loaded successfully")

    def generate_caption(self, image: Image.Image) -> str:
        """
        Generate caption from image.

        Args:
            image: PIL Image in RGB format

        Returns:
            Clean caption string without prefixes/suffixes
        """
        self.load()  # Ensure model is loaded

        # Process image and generate caption
        inputs = self.processor(image, return_tensors="pt").to(self.device)
        outputs = self.model.generate(**inputs, max_new_tokens=40)
        caption = self.processor.decode(outputs[0], skip_special_tokens=True)

        return caption.strip()

    def is_loaded(self) -> bool:
        """Check if model is loaded in memory."""
        return self.model is not None
