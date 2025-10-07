"""
Tests for MusicGenHandler
"""
import pytest
from unittest.mock import Mock, patch, MagicMock
import numpy as np
import torch

from src.models.musicgen_handler import MusicGenHandler


def create_mock_audio_output(audio_array=None):
    """Helper to create mock audio output tensor"""
    if audio_array is None:
        audio_array = np.random.randn(32000).astype(np.float32)

    # Create mock chain: audio_values[0, 0].detach().cpu().numpy()
    # Note: [0, 0] is equivalent to [(0, 0)] - it's a single __getitem__ call with a tuple

    mock_after_cpu = Mock()
    mock_after_cpu.numpy = Mock(return_value=audio_array)

    mock_after_detach = Mock()
    mock_after_detach.cpu = Mock(return_value=mock_after_cpu)

    mock_after_getitem = Mock()
    mock_after_getitem.detach = Mock(return_value=mock_after_detach)

    # tensor[0, 0] is a single call with tuple (0, 0)
    def getitem_handler(key):
        if key == (0, 0):
            return mock_after_getitem
        return Mock()

    mock_tensor = Mock()
    mock_tensor.__getitem__ = Mock(side_effect=getitem_handler)

    return mock_tensor


def setup_musicgen_mocks(mock_processor, mock_model):
    """Helper to setup MusicGen processor and model mocks"""
    # Create dict-like mock for inputs
    mock_input_ids = Mock()
    mock_input_ids.to = Mock(return_value=mock_input_ids)

    mock_attention_mask = Mock()
    mock_attention_mask.to = Mock(return_value=mock_attention_mask)

    # Use actual dict to allow item assignment
    mock_inputs = {
        'input_ids': mock_input_ids,
        'attention_mask': mock_attention_mask
    }

    mock_processor.return_value = mock_inputs

    # Mock audio generation
    mock_audio_tensor = create_mock_audio_output()
    mock_model.generate.return_value = mock_audio_tensor

    return mock_inputs


class TestMusicGenHandler:
    """Test suite for MusicGenHandler"""

    @pytest.fixture
    def handler(self):
        """Create a MusicGenHandler instance"""
        return MusicGenHandler(model_name="facebook/musicgen-small")

    def test_init(self, handler):
        """Test handler initialization"""
        assert handler.model_name == "facebook/musicgen-small"
        assert handler.processor is None
        assert handler.model is None
        assert handler.device in ["cpu", "cuda", "mps"]

    def test_detect_device_cpu(self, handler):
        """Test device detection defaults to CPU"""
        with patch('torch.cuda.is_available', return_value=False):
            with patch('torch.backends.mps.is_available', return_value=False):
                device = handler._detect_device()
                assert device == "cpu"

    def test_detect_device_cuda(self, handler):
        """Test device detection with CUDA available"""
        with patch('torch.cuda.is_available', return_value=True):
            device = handler._detect_device()
            assert device == "cuda"

    def test_detect_device_mps(self, handler):
        """Test device detection with MPS available"""
        with patch('torch.cuda.is_available', return_value=False):
            with patch('torch.backends.mps.is_available', return_value=True):
                device = handler._detect_device()
                assert device == "mps"

    def test_is_loaded_initially_false(self, handler):
        """Test is_loaded returns False before loading"""
        assert handler.is_loaded() is False

    @patch('src.models.musicgen_handler.MusicgenForConditionalGeneration')
    @patch('src.models.musicgen_handler.AutoProcessor')
    def test_load_models(self, mock_processor_class, mock_model_class, handler, mock_musicgen_processor, mock_musicgen_model):
        """Test lazy loading of models"""
        mock_processor_class.from_pretrained.return_value = mock_musicgen_processor
        mock_model_class.from_pretrained.return_value = mock_musicgen_model

        handler.load()

        # Verify models were loaded
        mock_processor_class.from_pretrained.assert_called_once_with(
            "facebook/musicgen-small"
        )
        mock_model_class.from_pretrained.assert_called_once_with(
            "facebook/musicgen-small"
        )

        # Verify model was moved to device
        mock_musicgen_model.to.assert_called_once_with(handler.device)

    @patch('src.models.musicgen_handler.MusicgenForConditionalGeneration')
    @patch('src.models.musicgen_handler.AutoProcessor')
    def test_load_only_once(self, mock_processor_class, mock_model_class, handler, mock_musicgen_processor, mock_musicgen_model):
        """Test that load() doesn't reload if already loaded"""
        mock_processor_class.from_pretrained.return_value = mock_musicgen_processor
        mock_model_class.from_pretrained.return_value = mock_musicgen_model

        # Load twice
        handler.load()
        handler.load()

        # Should only be called once
        assert mock_processor_class.from_pretrained.call_count == 1
        assert mock_model_class.from_pretrained.call_count == 1

    @patch('src.models.musicgen_handler.MusicgenForConditionalGeneration')
    @patch('src.models.musicgen_handler.AutoProcessor')
    def test_is_loaded_after_loading(self, mock_processor_class, mock_model_class, handler, mock_musicgen_processor, mock_musicgen_model):
        """Test is_loaded returns True after loading"""
        mock_processor_class.from_pretrained.return_value = mock_musicgen_processor
        mock_model_class.from_pretrained.return_value = mock_musicgen_model

        handler.load()
        assert handler.is_loaded() is True

    @patch('src.models.musicgen_handler.MusicgenForConditionalGeneration')
    @patch('src.models.musicgen_handler.AutoProcessor')
    def test_generate_audio(self, mock_processor_class, mock_model_class, handler, mock_musicgen_processor, mock_musicgen_model):
        """Test audio generation"""
        mock_processor_class.from_pretrained.return_value = mock_musicgen_processor
        mock_model_class.from_pretrained.return_value = mock_musicgen_model

        setup_musicgen_mocks(mock_musicgen_processor, mock_musicgen_model)

        # Generate audio
        prompt = "tropical house, 85 BPM, relaxing"
        audio_data, sample_rate = handler.generate_audio(prompt, duration=15)

        # Verify
        assert isinstance(audio_data, np.ndarray)
        assert audio_data.dtype == np.int16
        assert sample_rate == 32000
        mock_musicgen_processor.assert_called_once()
        mock_musicgen_model.generate.assert_called_once()

    @patch('src.models.musicgen_handler.MusicgenForConditionalGeneration')
    @patch('src.models.musicgen_handler.AutoProcessor')
    def test_generate_audio_token_calculation_15s(self, mock_processor_class, mock_model_class, handler, mock_musicgen_processor, mock_musicgen_model):
        """Test token calculation for 15 second duration"""
        mock_processor_class.from_pretrained.return_value = mock_musicgen_processor
        mock_model_class.from_pretrained.return_value = mock_musicgen_model

        setup_musicgen_mocks(mock_musicgen_processor, mock_musicgen_model)

        handler.generate_audio("test prompt", duration=15)

        # Check token calculation: 256 * (15 / 10) = 384
        expected_tokens = min(int(256 * (15 / 10)), 1503)
        call_kwargs = mock_musicgen_model.generate.call_args[1]
        assert call_kwargs["max_new_tokens"] == expected_tokens

    @patch('src.models.musicgen_handler.MusicgenForConditionalGeneration')
    @patch('src.models.musicgen_handler.AutoProcessor')
    def test_generate_audio_token_calculation_30s(self, mock_processor_class, mock_model_class, handler, mock_musicgen_processor, mock_musicgen_model):
        """Test token calculation for 30 second duration"""
        mock_processor_class.from_pretrained.return_value = mock_musicgen_processor
        mock_model_class.from_pretrained.return_value = mock_musicgen_model

        setup_musicgen_mocks(mock_musicgen_processor, mock_musicgen_model)

        handler.generate_audio("test prompt", duration=30)

        # Check token calculation: 256 * (30 / 10) = 768
        expected_tokens = min(int(256 * (30 / 10)), 1503)
        call_kwargs = mock_musicgen_model.generate.call_args[1]
        assert call_kwargs["max_new_tokens"] == expected_tokens

    @patch('src.models.musicgen_handler.MusicgenForConditionalGeneration')
    @patch('src.models.musicgen_handler.AutoProcessor')
    def test_generate_audio_token_limit(self, mock_processor_class, mock_model_class, handler, mock_musicgen_processor, mock_musicgen_model):
        """Test that token count doesn't exceed 1503"""
        mock_processor_class.from_pretrained.return_value = mock_musicgen_processor
        mock_model_class.from_pretrained.return_value = mock_musicgen_model

        setup_musicgen_mocks(mock_musicgen_processor, mock_musicgen_model)

        handler.generate_audio("test prompt", duration=60)

        # Should be capped at 1503
        call_kwargs = mock_musicgen_model.generate.call_args[1]
        assert call_kwargs["max_new_tokens"] == 1503

    @patch('src.models.musicgen_handler.MusicgenForConditionalGeneration')
    @patch('src.models.musicgen_handler.AutoProcessor')
    def test_generate_audio_guidance_scale(self, mock_processor_class, mock_model_class, handler, mock_musicgen_processor, mock_musicgen_model):
        """Test that guidance_scale is set correctly"""
        mock_processor_class.from_pretrained.return_value = mock_musicgen_processor
        mock_model_class.from_pretrained.return_value = mock_musicgen_model

        setup_musicgen_mocks(mock_musicgen_processor, mock_musicgen_model)

        handler.generate_audio("test prompt", duration=15)

        # Check guidance_scale
        call_kwargs = mock_musicgen_model.generate.call_args[1]
        assert call_kwargs["guidance_scale"] == 3.0

    @patch('src.models.musicgen_handler.MusicgenForConditionalGeneration')
    @patch('src.models.musicgen_handler.AutoProcessor')
    def test_generate_audio_do_sample(self, mock_processor_class, mock_model_class, handler, mock_musicgen_processor, mock_musicgen_model):
        """Test that do_sample is enabled"""
        mock_processor_class.from_pretrained.return_value = mock_musicgen_processor
        mock_model_class.from_pretrained.return_value = mock_musicgen_model

        setup_musicgen_mocks(mock_musicgen_processor, mock_musicgen_model)

        handler.generate_audio("test prompt", duration=15)

        # Check do_sample
        call_kwargs = mock_musicgen_model.generate.call_args[1]
        assert call_kwargs["do_sample"] is True

    @patch('src.models.musicgen_handler.MusicgenForConditionalGeneration')
    @patch('src.models.musicgen_handler.AutoProcessor')
    def test_generate_audio_loads_model_if_not_loaded(self, mock_processor_class, mock_model_class, handler, mock_musicgen_processor, mock_musicgen_model):
        """Test that generate_audio loads model if not already loaded"""
        mock_processor_class.from_pretrained.return_value = mock_musicgen_processor
        mock_model_class.from_pretrained.return_value = mock_musicgen_model

        setup_musicgen_mocks(mock_musicgen_processor, mock_musicgen_model)

        # Handler not loaded initially
        assert handler.is_loaded() is False

        # Generate audio should load model
        handler.generate_audio("test prompt", duration=15)

        # Model should be loaded now
        assert handler.is_loaded() is True

    @patch('src.models.musicgen_handler.MusicgenForConditionalGeneration')
    @patch('src.models.musicgen_handler.AutoProcessor')
    def test_audio_normalization_to_int16(self, mock_processor_class, mock_model_class, handler, mock_musicgen_processor, mock_musicgen_model):
        """Test that audio is properly normalized to int16"""
        mock_processor_class.from_pretrained.return_value = mock_musicgen_processor
        mock_model_class.from_pretrained.return_value = mock_musicgen_model

        setup_musicgen_mocks(mock_musicgen_processor, mock_musicgen_model)

        audio_data, _ = handler.generate_audio("test prompt", duration=15)

        # Should be int16
        assert audio_data.dtype == np.int16
        # Should be properly scaled (int16 range is -32768 to 32767)
        assert audio_data.min() >= -32768
        assert audio_data.max() <= 32767
