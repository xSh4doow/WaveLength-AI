"""
Tests for MusicGenHandler with AudioCraft
"""
import pytest
import numpy as np
from src.models.musicgen_handler import MusicGenHandler


class TestMusicGenHandler:
    """Test suite for MusicGenHandler"""

    @pytest.fixture
    def handler(self):
        return MusicGenHandler()

    def test_initialization(self, handler):
        """Test that handler initializes correctly"""
        assert handler.model_name == "facebook/musicgen-small"
        assert handler.device in ["cuda", "mps", "cpu"]
        assert handler.model is None  # Lazy loading

    def test_device_detection(self, handler):
        """Test device detection logic"""
        device = handler._detect_device()
        assert device in ["cuda", "mps", "cpu"]

    def test_is_loaded_before_load(self, handler):
        """Test is_loaded before model is loaded"""
        assert handler.is_loaded() is False

    def test_lazy_loading(self, handler):
        """Test that model loads on first use"""
        # Model should not be loaded initially
        assert handler.model is None

        # Load the model
        handler.load()

        # Model should now be loaded
        assert handler.model is not None
        assert handler.is_loaded() is True

    def test_load_idempotent(self, handler):
        """Test that calling load() multiple times doesn't reload"""
        handler.load()
        model_ref = handler.model

        handler.load()

        # Should be same model instance
        assert handler.model is model_ref

    @pytest.mark.slow
    def test_generate_audio_basic(self, handler):
        """Test basic audio generation"""
        prompt = "upbeat pop music"
        duration = 5  # Short duration for faster test

        audio, sr = handler.generate_audio(prompt, duration)

        # Check audio properties
        assert isinstance(audio, np.ndarray)
        assert audio.dtype == np.int16
        assert sr == 32000  # AudioCraft default sample rate

        # Check duration (5s @ 32kHz = 160000 samples)
        # Allow ±10% tolerance
        expected_samples = duration * sr
        assert abs(len(audio) - expected_samples) < expected_samples * 0.1

    @pytest.mark.slow
    def test_generate_audio_30s(self, handler):
        """Test 30s generation (maximum for musicgen-small)"""
        prompt = "calm ambient music"
        duration = 30

        audio, sr = handler.generate_audio(prompt, duration)

        # Check duration (30s @ 32kHz = 960000 samples)
        # Allow ±5% tolerance
        expected_samples = duration * sr
        assert abs(len(audio) - expected_samples) < expected_samples * 0.05

    def test_generate_audio_clamps_duration(self, handler):
        """Test that duration is clamped to maximum 30s"""
        prompt = "test music"
        duration = 60  # Request 60s

        audio, sr = handler.generate_audio(prompt, duration)

        # Should be clamped to 30s
        expected_samples = 30 * sr
        # Allow ±5% tolerance
        assert abs(len(audio) - expected_samples) < expected_samples * 0.05

    @pytest.mark.slow
    def test_generate_audio_different_prompts(self, handler):
        """Test that different prompts generate different audio"""
        duration = 5

        audio1, _ = handler.generate_audio("happy upbeat music", duration)
        audio2, _ = handler.generate_audio("dark ambient drone", duration)

        # Audio should be different
        # (not exact comparison due to randomness, but should not be identical)
        assert not np.array_equal(audio1, audio2)

    def test_generate_audio_returns_int16(self, handler):
        """Test that generated audio is in int16 format"""
        audio, _ = handler.generate_audio("test", duration=5)

        # Check dtype
        assert audio.dtype == np.int16

        # Check value range
        assert audio.min() >= -32768
        assert audio.max() <= 32767

    def test_sample_rate_consistency(self, handler):
        """Test that sample rate is consistent across generations"""
        sr1 = handler.generate_audio("test1", duration=5)[1]
        sr2 = handler.generate_audio("test2", duration=5)[1]

        assert sr1 == sr2 == 32000
