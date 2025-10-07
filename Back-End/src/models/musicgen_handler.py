import torch
import numpy as np
from transformers import AutoProcessor, MusicgenForConditionalGeneration
from typing import Optional, Tuple


class MusicGenHandler:
    """Handler for MusicGen audio generation model."""

    def __init__(self, model_name: str = "facebook/musicgen-small"):
        self.model_name = model_name
        self.processor: Optional[AutoProcessor] = None
        self.model: Optional[MusicgenForConditionalGeneration] = None
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
        """Lazy load the MusicGen model and processor."""
        if self.model is not None:
            return  # Already loaded

        print(f"[MusicGenHandler] Loading MusicGen model on {self.device}...")
        self.processor = AutoProcessor.from_pretrained(self.model_name)
        self.model = MusicgenForConditionalGeneration.from_pretrained(self.model_name)
        self.model.to(self.device)
        print(f"[MusicGenHandler] MusicGen model loaded successfully")

    def generate_audio(self, prompt: str, duration: int = 15) -> Tuple[np.ndarray, int]:
        """
        Generate audio from text prompt.

        Args:
            prompt: Text description of music to generate
            duration: Duration in seconds (15-60)

        Returns:
            Tuple of (audio_array, sample_rate)
            - audio_array: numpy array of int16 audio data
            - sample_rate: sample rate (typically 32000)
        """
        self.load()  # Ensure model is loaded

        # Process text prompt
        inputs = self.processor(text=[prompt], padding=True, return_tensors="pt")

        # Move inputs to device
        for key, value in inputs.items():
            if hasattr(value, "to"):
                inputs[key] = value.to(self.device)

        # Calculate tokens: ~256 tokens for 10s, max ~1503 for 30s
        # Scale based on duration
        tokens = min(int(256 * (duration / 10)), 1503)

        # Generate audio
        audio_values = self.model.generate(
            **inputs,
            do_sample=True,
            guidance_scale=3.0,
            max_new_tokens=tokens
        )

        # Extract audio and convert to numpy
        audio_np = audio_values[0, 0].detach().cpu().numpy()

        # Normalize to int16 range
        audio_int16 = (audio_np * 32767).astype(np.int16)

        # Get sample rate from model config
        sample_rate = (
            self.model.config.audio_encoder.sampling_rate
            if hasattr(self.model.config, "audio_encoder")
            else 32000
        )

        return audio_int16, sample_rate

    def is_loaded(self) -> bool:
        """Check if model is loaded in memory."""
        return self.model is not None
