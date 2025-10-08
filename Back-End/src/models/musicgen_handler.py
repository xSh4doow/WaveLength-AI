import torch
import numpy as np
from typing import Optional, Tuple

# Try to import AudioCraft first (for 30s generation)
# Fall back to transformers if AudioCraft not available (for 15s generation)
try:
    from audiocraft.models import MusicGen
    USING_AUDIOCRAFT = True
    print("[MusicGenHandler] Using AudioCraft (supports up to 30s)")
except ImportError:
    from transformers import AutoProcessor, MusicgenForConditionalGeneration
    USING_AUDIOCRAFT = False
    print("[MusicGenHandler] Using Transformers (limited to 15s) - Install AudioCraft for 30s support")


class MusicGenHandler:
    """
    Handler for MusicGen audio generation.

    Uses AudioCraft if available (30s support), falls back to Transformers (15s max).
    """

    def __init__(self, model_name: str = "facebook/musicgen-small"):
        self.model_name = model_name
        self.model: Optional[any] = None
        self.processor: Optional[any] = None  # Only for transformers
        self.device = self._detect_device()
        self.using_audiocraft = USING_AUDIOCRAFT

    def _detect_device(self) -> str:
        """Detect best available device (CUDA > MPS > CPU)."""
        if torch.cuda.is_available():
            return "cuda"
        elif hasattr(torch.backends, "mps") and torch.backends.mps.is_available():
            return "mps"
        else:
            return "cpu"

    def load(self):
        """Lazy load the MusicGen model."""
        if self.model is not None:
            return  # Already loaded

        print(f"[MusicGenHandler] Loading MusicGen model on {self.device}...")

        if self.using_audiocraft:
            # AudioCraft version (30s support)
            self.model = MusicGen.get_pretrained(self.model_name, device=self.device)
            self.model.set_generation_params(
                use_sampling=True,
                top_k=250,
                top_p=0.0,
                temperature=1.0,
                cfg_coef=3.0,
            )
        else:
            # Transformers version (15s max)
            self.processor = AutoProcessor.from_pretrained(self.model_name)
            self.model = MusicgenForConditionalGeneration.from_pretrained(self.model_name)
            self.model.to(self.device)

        print(f"[MusicGenHandler] MusicGen model loaded successfully")

    def generate_audio(self, prompt: str, duration: int = 30) -> Tuple[np.ndarray, int]:
        """
        Generate audio from text prompt.

        Args:
            prompt: Text description of music to generate
            duration: Duration in seconds
                - AudioCraft: up to 30s
                - Transformers: up to 15s (will be clamped)

        Returns:
            Tuple of (audio_array, sample_rate)
            - audio_array: numpy array of int16 audio data
            - sample_rate: sample rate (typically 32000)
        """
        self.load()  # Ensure model is loaded

        if self.using_audiocraft:
            return self._generate_audiocraft(prompt, duration)
        else:
            return self._generate_transformers(prompt, duration)

    def _generate_audiocraft(self, prompt: str, duration: int) -> Tuple[np.ndarray, int]:
        """Generate audio using AudioCraft (up to 30s)."""
        # AudioCraft supports up to 30s natively
        duration = min(duration, 30)

        # Set generation duration
        self.model.set_generation_params(duration=duration)

        # Generate audio
        wav = self.model.generate([prompt])

        # Extract audio from tensor
        # wav shape: (1, channels, samples)
        audio_np = wav[0, 0].cpu().numpy()

        # Normalize to int16 range
        audio_int16 = (audio_np * 32767).astype(np.int16)

        # Get sample rate from model
        sample_rate = self.model.sample_rate

        return audio_int16, sample_rate

    def _generate_transformers(self, prompt: str, duration: int) -> Tuple[np.ndarray, int]:
        """Generate audio using Transformers (up to 15s)."""
        # Transformers limited to ~15s
        duration = min(duration, 15)

        # Process text prompt
        inputs = self.processor(text=[prompt], padding=True, return_tensors="pt")

        # Move inputs to device
        for key, value in inputs.items():
            if hasattr(value, "to"):
                inputs[key] = value.to(self.device)

        # Calculate tokens: ~256 tokens for 10s, scale based on duration
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

    def get_max_duration(self) -> int:
        """Get maximum supported duration for current backend."""
        return 30 if self.using_audiocraft else 15

    def is_loaded(self) -> bool:
        """Check if model is loaded in memory."""
        return self.model is not None
