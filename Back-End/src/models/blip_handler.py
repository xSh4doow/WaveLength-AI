import torch
from PIL import Image
from transformers import BlipProcessor, BlipForConditionalGeneration
from typing import Optional, Dict, List


class BLIPHandler:
    """Handler for BLIP image captioning model with advanced optimization."""

    # Keyword-based mood enhancement mapping
    MOOD_KEYWORDS = {
        "sunset": ["warm", "golden hour", "peaceful"],
        "sunrise": ["fresh", "hopeful", "awakening"],
        "beach": ["relaxing", "coastal", "tropical"],
        "ocean": ["vast", "serene", "flowing"],
        "city": ["urban", "dynamic", "bustling"],
        "night": ["atmospheric", "moody", "nocturnal"],
        "neon": ["vibrant", "electric", "energetic"],
        "forest": ["natural", "organic", "earthy"],
        "mountain": ["majestic", "grand", "epic"],
        "desert": ["vast", "minimalist", "warm"],
        "rain": ["melancholic", "contemplative", "soft"],
        "snow": ["pristine", "calm", "ethereal"],
        "cafe": ["cozy", "intimate", "comfortable"],
        "street": ["raw", "authentic", "gritty"],
        "nature": ["organic", "peaceful", "harmonious"],
        "sky": ["expansive", "airy", "atmospheric"],
        "water": ["fluid", "flowing", "dynamic"],
        "architecture": ["structured", "modern", "geometric"],
        "vintage": ["nostalgic", "classic", "timeless"],
        "futuristic": ["sleek", "modern", "innovative"]
    }

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

    def generate_caption(self, image: Image.Image, enhanced: bool = False) -> str:
        """
        Generate caption from image.

        Args:
            image: PIL Image in RGB format
            enhanced: If True, use advanced parameters and enhancement

        Returns:
            Clean caption string without prefixes/suffixes
        """
        self.load()  # Ensure model is loaded

        # Process image and generate caption
        inputs = self.processor(image, return_tensors="pt").to(self.device)

        if enhanced:
            # Advanced generation parameters for richer descriptions
            outputs = self.model.generate(
                **inputs,
                max_new_tokens=80,           # Longer descriptions
                num_beams=5,                 # Beam search for better quality
                temperature=0.7,             # Slightly creative
                repetition_penalty=1.2,      # Avoid repetitions
                do_sample=False,             # Deterministic with beam search
                early_stopping=True
            )
        else:
            # Standard generation (backward compatibility)
            outputs = self.model.generate(**inputs, max_new_tokens=40)

        caption = self.processor.decode(outputs[0], skip_special_tokens=True)
        return caption.strip()

    def generate_enhanced_caption(self, image: Image.Image) -> Dict[str, any]:
        """
        Generate enhanced caption with mood analysis and keywords.

        Args:
            image: PIL Image in RGB format

        Returns:
            Dictionary with:
                - caption: Base caption from BLIP
                - enhanced_caption: Caption with mood descriptors
                - detected_moods: List of detected mood keywords
                - keywords: List of key visual elements
        """
        # Generate rich caption with advanced parameters
        base_caption = self.generate_caption(image, enhanced=True)

        # Analyze caption for keywords
        caption_lower = base_caption.lower()
        detected_moods = []
        keywords = []

        # Detect moods based on keywords
        for keyword, moods in self.MOOD_KEYWORDS.items():
            if keyword in caption_lower:
                keywords.append(keyword)
                detected_moods.extend(moods)

        # Remove duplicates while preserving order
        detected_moods = list(dict.fromkeys(detected_moods))

        # Build enhanced caption
        if detected_moods:
            mood_str = ", ".join(detected_moods[:3])  # Top 3 moods
            enhanced_caption = f"{base_caption}, {mood_str} atmosphere"
        else:
            enhanced_caption = base_caption

        return {
            "caption": base_caption,
            "enhanced_caption": enhanced_caption,
            "detected_moods": detected_moods[:5],  # Top 5 moods
            "keywords": keywords
        }

    def is_loaded(self) -> bool:
        """Check if model is loaded in memory."""
        return self.model is not None
