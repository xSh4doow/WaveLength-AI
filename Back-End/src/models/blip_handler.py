import torch
import re
from PIL import Image
from transformers import (
    BlipProcessor, BlipForConditionalGeneration,
    Blip2Processor, Blip2ForConditionalGeneration
)
from typing import Optional, Dict, List


class BLIPHandler:
    """Handler for BLIP/BLIP-2 image captioning model with advanced optimization."""

    # Keyword-based mood enhancement mapping (BALANCED - avoid always "dark melancholic")
    MOOD_KEYWORDS = {
        # POSITIVE/UPLIFTING
        "sunset": ["warm", "golden", "peaceful"],
        "sunrise": ["fresh", "hopeful", "energizing"],
        "beach": ["relaxing", "breezy", "tropical"],
        "sunshine": ["bright", "cheerful", "radiant"],
        "bright": ["vibrant", "lively", "uplifting"],
        "colorful": ["vibrant", "joyful", "dynamic"],
        "happy": ["cheerful", "uplifting", "joyful"],
        "smile": ["joyful", "heartwarming", "positive"],
        "smiling": ["joyful", "cheerful", "happy"],
        "laughing": ["joyful", "cheerful", "playful"],
        "grinning": ["exuberant", "joyful", "enthusiastic"],
        "flowers": ["beautiful", "delicate", "blooming"],
        "spring": ["fresh", "renewing", "hopeful"],
        "summer": ["warm", "vibrant", "energetic"],

        # CALM/PEACEFUL
        "ocean": ["vast", "serene", "flowing"],
        "calm": ["peaceful", "tranquil", "serene"],
        "peaceful": ["serene", "harmonious", "gentle"],
        "snow": ["pristine", "quiet", "pure"],
        "lake": ["still", "reflective", "tranquil"],
        "forest": ["natural", "grounding", "organic"],
        "nature": ["organic", "harmonious", "balanced"],
        "park": ["relaxing", "green", "refreshing"],

        # ENERGETIC/DYNAMIC
        "city": ["urban", "dynamic", "vibrant"],
        "neon": ["vibrant", "electric", "bold"],
        "lights": ["dazzling", "bright", "exciting"],
        "crowd": ["lively", "bustling", "energetic"],
        "festival": ["celebratory", "joyful", "festive"],
        "dance": ["energetic", "rhythmic", "dynamic"],
        "sports": ["active", "energetic", "competitive"],

        # ATMOSPHERIC/MOODY (not necessarily sad)
        "night": ["atmospheric", "mysterious", "cinematic"],
        "dusk": ["transitional", "contemplative", "atmospheric"],
        "fog": ["mysterious", "ethereal", "dreamy"],
        "mist": ["soft", "ethereal", "mystical"],
        "rain": ["reflective", "gentle", "rhythmic"],  # Not melancholic!
        "clouds": ["dramatic", "atmospheric", "layered"],

        # ARCHITECTURAL/URBAN
        "building": ["structured", "modern", "architectural"],
        "architecture": ["geometric", "designed", "urban"],
        "street": ["authentic", "urban", "lived-in"],
        "cafe": ["cozy", "intimate", "warm"],
        "interior": ["inviting", "designed", "curated"],

        # EPIC/GRAND
        "mountain": ["majestic", "grand", "powerful"],
        "canyon": ["vast", "dramatic", "monumental"],
        "waterfall": ["powerful", "dynamic", "flowing"],
        "castle": ["grand", "historic", "majestic"],

        # DREAMY/ETHEREAL
        "vintage": ["nostalgic", "timeless", "classic"],
        "pastel": ["soft", "gentle", "dreamy"],
        "ethereal": ["dreamlike", "light", "floating"],
        "golden": ["warm", "glowing", "radiant"],

        # MODERN/TECH
        "futuristic": ["sleek", "innovative", "cutting-edge"],
        "technology": ["modern", "precise", "advanced"],
        "minimalist": ["clean", "focused", "refined"],

        # DESERT/WARM - Fixed from "dark" tendency
        "desert": ["warm", "vast", "sun-drenched"],
        "sand": ["warm", "textured", "natural"],
        "arid": ["stark", "pristine", "minimal"],

        # WATER/FLOW
        "water": ["fluid", "flowing", "refreshing"],
        "river": ["flowing", "continuous", "natural"],
        "waves": ["rhythmic", "powerful", "dynamic"],
        "sky": ["expansive", "open", "boundless"],

        # HUMAN/PORTRAIT KEYWORDS
        "person": ["human", "emotive", "personal"],
        "people": ["social", "communal", "connected"],
        "man": ["masculine", "confident"],
        "woman": ["feminine", "graceful"],
        "child": ["innocent", "playful", "youthful"],
        "looking": ["contemplative", "observant", "focused"],
        "standing": ["present", "grounded", "poised"],
        "sitting": ["relaxed", "contemplative", "casual"],
        "walking": ["moving", "purposeful", "dynamic"],

        # OBJECT/ACTION KEYWORDS
        "holding": ["intimate", "possessive", "careful"],
        "hands": ["delicate", "expressive", "gentle"],
        "close": ["intimate", "detailed", "personal"],
        "bottle": ["contained", "still", "reflective"],
        "cup": ["cozy", "warm", "comforting"],
        "book": ["intellectual", "thoughtful", "quiet"]
    }

    def __init__(self, model_name: str = "Salesforce/blip-image-captioning-large", auto_load: bool = True):
        self.model_name = model_name
        self.is_blip2 = "blip2" in model_name.lower()  # Auto-detect BLIP-2
        self.processor = None
        self.model = None
        self.device = self._detect_device()

        # FORCE DOWNLOAD ON STARTUP
        if auto_load:
            print(f"[BLIPHandler] Auto-loading model on startup...")
            self.load()

    def _detect_device(self) -> str:
        """Detect best available device (CUDA > MPS > CPU)."""
        if torch.cuda.is_available():
            return "cuda"
        elif hasattr(torch.backends, "mps") and torch.backends.mps.is_available():
            return "mps"
        else:
            return "cpu"

    def load(self):
        """Lazy load the BLIP/BLIP-2 model and processor."""
        if self.model is not None:
            return  # Already loaded

        model_type = "BLIP-2" if self.is_blip2 else "BLIP"
        print(f"[BLIPHandler] Loading {model_type} model ({self.model_name}) on {self.device}...")

        if self.is_blip2:
            # Load BLIP-2
            self.processor = Blip2Processor.from_pretrained(self.model_name)
            self.model = Blip2ForConditionalGeneration.from_pretrained(
                self.model_name,
                torch_dtype=torch.float16 if self.device == "cuda" else torch.float32
            )
        else:
            # Load BLIP (original)
            self.processor = BlipProcessor.from_pretrained(self.model_name)
            self.model = BlipForConditionalGeneration.from_pretrained(self.model_name)

        self.model.to(self.device)
        print(f"[BLIPHandler] {model_type} model loaded successfully")

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

        # For image captioning, DO NOT pass text prompts to BLIP-2
        # Passing text makes it behave like VQA instead of captioning
        inputs = self.processor(image, return_tensors="pt").to(self.device)

        if enhanced:
            # Advanced generation parameters for richer descriptions
            # BLIP-2 generates longer, more detailed captions
            max_tokens = 75 if self.is_blip2 else 100
            outputs = self.model.generate(
                **inputs,
                max_new_tokens=max_tokens,   # BLIP-2 captions are naturally longer
                num_beams=5,                 # Beam search for better quality
                temperature=0.7,             # Slightly creative
                repetition_penalty=1.2,      # Avoid repetitions
                do_sample=False,             # Deterministic with beam search
                early_stopping=True,
                length_penalty=1.0           # Encourage longer outputs
            )
        else:
            # Standard generation (backward compatibility)
            outputs = self.model.generate(**inputs, max_new_tokens=50)

        caption = self.processor.decode(outputs[0], skip_special_tokens=True)

        # Clean up the caption
        return caption.strip()

    @staticmethod
    def normalize_word(word: str) -> str:
        """
        Normalize word for flexible matching.
        Removes common suffixes to match word variations.

        Args:
            word: Word to normalize

        Returns:
            Normalized word stem
        """
        # Remove -ing, -ed, -s suffixes
        word = re.sub(r'ing$', '', word)
        word = re.sub(r'ed$', '', word)
        word = re.sub(r's$', '', word)
        return word

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

        # Detect moods based on keywords (with flexible matching)
        for keyword, moods in self.MOOD_KEYWORDS.items():
            # Exact match OR normalized match
            if keyword in caption_lower or self.normalize_word(keyword) in caption_lower:
                keywords.append(keyword)
                detected_moods.extend(moods)

        # Remove duplicates while preserving order
        detected_moods = list(dict.fromkeys(detected_moods))

        # Fallback: sentiment analysis when no keywords matched
        if not detected_moods:
            positive_words = ["smile", "smiling", "happy", "joy", "laugh", "bright", "beautiful", "cheerful"]
            negative_words = ["sad", "dark", "cry", "angry", "fear", "pain", "sorrow", "gloomy"]

            if any(w in caption_lower for w in positive_words):
                detected_moods = ["cheerful", "positive", "uplifting"]
                print("[BLIPHandler] Sentiment fallback: POSITIVE mood detected")
            elif any(w in caption_lower for w in negative_words):
                detected_moods = ["melancholic", "somber", "reflective"]
                print("[BLIPHandler] Sentiment fallback: NEGATIVE mood detected")
            else:
                detected_moods = ["neutral", "balanced", "contemplative"]
                print("[BLIPHandler] Sentiment fallback: NEUTRAL mood detected")

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
