"""
Tests for BLIPHandler
"""
import pytest
from unittest.mock import Mock, patch, MagicMock
from PIL import Image
import torch

from src.models.blip_handler import BLIPHandler


class TestBLIPHandler:
    """Test suite for BLIPHandler"""

    @pytest.fixture
    def handler(self):
        """Create a BLIPHandler instance"""
        return BLIPHandler(model_name="Salesforce/blip-image-captioning-large")

    def test_init(self, handler):
        """Test handler initialization"""
        assert handler.model_name == "Salesforce/blip-image-captioning-large"
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

    @patch('src.models.blip_handler.BlipForConditionalGeneration')
    @patch('src.models.blip_handler.BlipProcessor')
    def test_load_models(self, mock_processor_class, mock_model_class, handler, mock_blip_processor, mock_blip_model):
        """Test lazy loading of models"""
        mock_processor_class.from_pretrained.return_value = mock_blip_processor
        mock_model_class.from_pretrained.return_value = mock_blip_model

        handler.load()

        # Verify models were loaded
        mock_processor_class.from_pretrained.assert_called_once_with(
            "Salesforce/blip-image-captioning-large"
        )
        mock_model_class.from_pretrained.assert_called_once_with(
            "Salesforce/blip-image-captioning-large"
        )

        # Verify model was moved to device
        mock_blip_model.to.assert_called_once_with(handler.device)

    @patch('src.models.blip_handler.BlipForConditionalGeneration')
    @patch('src.models.blip_handler.BlipProcessor')
    def test_load_only_once(self, mock_processor_class, mock_model_class, handler, mock_blip_processor, mock_blip_model):
        """Test that load() doesn't reload if already loaded"""
        mock_processor_class.from_pretrained.return_value = mock_blip_processor
        mock_model_class.from_pretrained.return_value = mock_blip_model

        # Load twice
        handler.load()
        handler.load()

        # Should only be called once
        assert mock_processor_class.from_pretrained.call_count == 1
        assert mock_model_class.from_pretrained.call_count == 1

    @patch('src.models.blip_handler.BlipForConditionalGeneration')
    @patch('src.models.blip_handler.BlipProcessor')
    def test_is_loaded_after_loading(self, mock_processor_class, mock_model_class, handler, mock_blip_processor, mock_blip_model):
        """Test is_loaded returns True after loading"""
        mock_processor_class.from_pretrained.return_value = mock_blip_processor
        mock_model_class.from_pretrained.return_value = mock_blip_model

        handler.load()
        assert handler.is_loaded() is True

    @patch('src.models.blip_handler.BlipForConditionalGeneration')
    @patch('src.models.blip_handler.BlipProcessor')
    def test_generate_caption(self, mock_processor_class, mock_model_class, handler, test_image, mock_blip_processor, mock_blip_model):
        """Test caption generation"""
        # Setup mocks
        mock_processor_class.from_pretrained.return_value = mock_blip_processor
        mock_model_class.from_pretrained.return_value = mock_blip_model

        # Mock processor call - needs to return BatchEncoding-like object with .to() and dict-like behavior
        mock_inputs = MagicMock()
        mock_inputs.to = Mock(return_value=mock_inputs)
        mock_inputs.keys = Mock(return_value=['pixel_values'])
        mock_inputs.__getitem__ = Mock(return_value=Mock())
        mock_blip_processor.return_value = mock_inputs

        # Mock model generate
        mock_blip_model.generate.return_value = torch.tensor([[1, 2, 3, 4]])

        # Mock decode
        mock_blip_processor.decode.return_value = "a beautiful sunset over the ocean"

        # Generate caption
        caption = handler.generate_caption(test_image)

        # Verify
        assert caption == "a beautiful sunset over the ocean"
        mock_blip_processor.assert_called_once()
        mock_blip_model.generate.assert_called_once()
        mock_blip_processor.decode.assert_called_once()

    @patch('src.models.blip_handler.BlipForConditionalGeneration')
    @patch('src.models.blip_handler.BlipProcessor')
    def test_generate_caption_strips_whitespace(self, mock_processor_class, mock_model_class, handler, test_image, mock_blip_processor, mock_blip_model):
        """Test that caption is stripped of whitespace"""
        mock_processor_class.from_pretrained.return_value = mock_blip_processor
        mock_model_class.from_pretrained.return_value = mock_blip_model

        # Mock processor call - needs to return BatchEncoding-like object with .to() and dict-like behavior
        mock_inputs = MagicMock()
        mock_inputs.to = Mock(return_value=mock_inputs)
        mock_inputs.keys = Mock(return_value=['pixel_values'])
        mock_inputs.__getitem__ = Mock(return_value=Mock())
        mock_blip_processor.return_value = mock_inputs

        # Mock model generate
        mock_blip_model.generate.return_value = torch.tensor([[1, 2, 3, 4]])

        # Mock decode with whitespace
        mock_blip_processor.decode.return_value = "  a caption with spaces  "

        caption = handler.generate_caption(test_image)

        assert caption == "a caption with spaces"
        assert caption == caption.strip()

    @patch('src.models.blip_handler.BlipForConditionalGeneration')
    @patch('src.models.blip_handler.BlipProcessor')
    def test_generate_caption_loads_model_if_not_loaded(self, mock_processor_class, mock_model_class, handler, test_image, mock_blip_processor, mock_blip_model):
        """Test that generate_caption loads model if not already loaded"""
        mock_processor_class.from_pretrained.return_value = mock_blip_processor
        mock_model_class.from_pretrained.return_value = mock_blip_model

        # Mock processor call - needs to return BatchEncoding-like object with .to() and dict-like behavior
        mock_inputs = MagicMock()
        mock_inputs.to = Mock(return_value=mock_inputs)
        mock_inputs.keys = Mock(return_value=['pixel_values'])
        mock_inputs.__getitem__ = Mock(return_value=Mock())
        mock_blip_processor.return_value = mock_inputs

        # Mock model generate
        mock_blip_model.generate.return_value = torch.tensor([[1, 2, 3, 4]])
        mock_blip_processor.decode.return_value = "test caption"

        # Handler not loaded initially
        assert handler.is_loaded() is False

        # Generate caption should load model
        handler.generate_caption(test_image)

        # Model should be loaded now
        assert handler.is_loaded() is True
