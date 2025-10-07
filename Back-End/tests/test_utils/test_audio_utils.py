"""Tests for audio_utils"""
import pytest
import numpy as np
from pathlib import Path
from src.utils.audio_utils import save_audio, normalize_audio


class TestAudioUtils:
    """Test suite for audio utilities"""

    def test_save_audio_creates_file(self, tmp_path, test_audio):
        """Test that save_audio creates a file"""
        filepath = tmp_path / "test.wav"
        save_audio(str(filepath), test_audio, 32000)

        assert filepath.exists()
        assert filepath.stat().st_size > 0

    def test_normalize_audio_int16(self):
        """Test normalizing int16 audio"""
        audio = np.array([-32767, 0, 32767], dtype=np.int16)
        normalized = normalize_audio(audio)

        assert normalized.dtype == np.float32
        assert np.max(np.abs(normalized)) <= 1.0

    def test_normalize_audio_float(self):
        """Test normalizing float audio"""
        audio = np.array([-2.0, 0.0, 2.0], dtype=np.float32)
        normalized = normalize_audio(audio)

        assert normalized.dtype == np.float32
        assert np.max(np.abs(normalized)) <= 0.95  # Headroom applied

    def test_normalize_prevents_clipping(self):
        """Test that normalization prevents clipping"""
        # Very loud audio that would clip
        audio = np.array([-100000.0, 100000.0], dtype=np.float32)
        normalized = normalize_audio(audio)

        assert np.max(np.abs(normalized)) <= 1.0
