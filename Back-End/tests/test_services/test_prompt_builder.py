"""
Tests for PromptBuilder
"""
import pytest
from src.services.prompt_builder import PromptBuilder


class TestPromptBuilder:
    """Test suite for PromptBuilder"""

    @pytest.fixture
    def builder(self):
        return PromptBuilder()

    @pytest.fixture
    def sample_style(self):
        return {
            "genre": "tropical house",
            "subgenre": "chill",
            "bpm": 85,
            "mood": "relaxing and warm",
            "instrumentation": ["soft synths", "light percussion", "warm pads"]
        }

    def test_build_complete_prompt(self, builder, sample_style):
        """Test building complete prompt with all fields"""
        caption = "a beach at sunset"
        prompt = builder.build(caption, sample_style)

        assert "tropical house chill" in prompt
        assert "relaxing and warm atmosphere" in prompt
        assert "85 BPM" in prompt
        assert "soft synths" in prompt
        assert "light percussion" in prompt
        assert "warm pads" in prompt
        assert "inspired by: a beach at sunset" in prompt

    def test_build_without_subgenre(self, builder):
        """Test building prompt without subgenre"""
        style = {
            "genre": "ambient",
            "subgenre": "",
            "bpm": 90,
            "mood": "peaceful",
            "instrumentation": ["pads"]
        }
        caption = "test"
        prompt = builder.build(caption, style)

        assert "ambient," in prompt  # Genre followed by comma, no subgenre
        assert "ambient ambient" not in prompt  # No duplication

    def test_instrumentation_joining(self, builder, sample_style):
        """Test that instrumentation list is properly joined"""
        caption = "test"
        prompt = builder.build(caption, sample_style)

        # Should be comma-separated
        assert "soft synths, light percussion, warm pads" in prompt

    def test_empty_instrumentation(self, builder):
        """Test handling empty instrumentation list"""
        style = {
            "genre": "ambient",
            "subgenre": "neutral",
            "bpm": 90,
            "mood": "calm",
            "instrumentation": []
        }
        caption = "test"
        prompt = builder.build(caption, style)

        assert "soft instruments" in prompt  # Default fallback

    def test_prompt_format_correct(self, builder, sample_style):
        """Test that prompt follows correct template format"""
        caption = "beautiful landscape"
        prompt = builder.build(caption, sample_style)

        # Format: {genre} {subgenre}, {mood} atmosphere, {bpm} BPM, {instrumentation}, inspired by: {caption}
        parts = prompt.split(", ")

        assert len(parts) >= 4
        assert "atmosphere" in parts[1]
        assert "BPM" in parts[2]
        assert "inspired by:" in prompt

    def test_special_characters_in_caption(self, builder, sample_style):
        """Test handling special characters in caption"""
        caption = "a café with 'quotes' & symbols!"
        prompt = builder.build(caption, sample_style)

        assert caption in prompt
        assert "inspired by: " + caption in prompt

    def test_long_instrumentation_list(self, builder):
        """Test handling long instrumentation list"""
        style = {
            "genre": "orchestral",
            "subgenre": "epic",
            "bpm": 120,
            "mood": "dramatic",
            "instrumentation": ["strings", "brass", "timpani", "horns", "cellos", "violins"]
        }
        caption = "test"
        prompt = builder.build(caption, style)

        # All instruments should be included
        for instrument in style["instrumentation"]:
            assert instrument in prompt

    def test_missing_optional_fields(self, builder):
        """Test handling missing optional fields gracefully"""
        minimal_style = {
            "genre": "ambient",
            "bpm": 90
        }
        caption = "test"
        prompt = builder.build(caption, minimal_style)

        assert "ambient" in prompt
        assert "90 BPM" in prompt
