"""
Global pytest fixtures and configuration
"""
import pytest
from unittest.mock import Mock, MagicMock
from PIL import Image
import numpy as np
from fastapi.testclient import TestClient


@pytest.fixture
def mock_blip_processor():
    """Mock BLIP processor"""
    processor = Mock()
    processor.return_value = {"input_ids": Mock()}
    processor.decode = Mock(return_value="a beautiful sunset over the ocean")
    return processor


@pytest.fixture
def mock_blip_model():
    """Mock BLIP model"""
    model = Mock()
    model.generate = Mock(return_value=[[1, 2, 3]])  # Token IDs
    model.to = Mock(return_value=model)
    return model


@pytest.fixture
def mock_musicgen_processor():
    """Mock MusicGen processor"""
    processor = Mock()
    processor.return_value = {"input_ids": Mock()}
    return processor


@pytest.fixture
def mock_musicgen_model():
    """Mock MusicGen model"""
    model = Mock()
    # Simulate audio output
    audio_tensor = Mock()
    audio_tensor.__getitem__ = Mock(return_value=Mock())
    audio_tensor.__getitem__.return_value.__getitem__ = Mock(return_value=Mock())
    audio_np_mock = Mock()
    audio_np_mock.detach = Mock(return_value=audio_np_mock)
    audio_np_mock.cpu = Mock(return_value=audio_np_mock)
    audio_np_mock.numpy = Mock(return_value=np.zeros(32000))  # 1s of audio at 32kHz
    audio_tensor.__getitem__.return_value.__getitem__.return_value = audio_np_mock

    model.generate = Mock(return_value=audio_tensor)
    model.to = Mock(return_value=model)
    model.config.audio_encoder.sampling_rate = 32000
    return model


@pytest.fixture
def test_image():
    """Create a test PIL Image"""
    return Image.new('RGB', (100, 100), color='red')


@pytest.fixture
def test_audio():
    """Create test audio data"""
    return np.random.randint(-32767, 32767, 32000, dtype=np.int16)


@pytest.fixture
def client():
    """FastAPI test client"""
    from src.main import app
    return TestClient(app)


@pytest.fixture
def sample_music_style():
    """Sample music style dictionary"""
    return {
        "genre": "tropical house",
        "subgenre": "chill",
        "bpm": 85,
        "mood": "relaxing and warm",
        "instrumentation": ["soft synths", "light percussion", "warm pads"]
    }


@pytest.fixture
def sample_caption():
    """Sample image caption"""
    return "a beach at sunset with palm trees"
