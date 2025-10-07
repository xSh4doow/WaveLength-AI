"""
Tests for CulturalMapper
"""
import pytest
from src.services.cultural_mapper import CulturalMapper


class TestCulturalMapper:
    """Test suite for CulturalMapper"""

    @pytest.fixture
    def mapper(self):
        return CulturalMapper()

    def test_map_beach_sunset(self, mapper):
        """Test mapping beach sunset keywords"""
        caption = "a beach at sunset with palm trees"
        result = mapper.map_caption_to_style(caption)

        assert result["genre"] == "tropical house"
        assert result["subgenre"] == "chill"
        assert result["bpm"] == 85
        assert "soft synths" in result["instrumentation"]

    def test_map_coastal_highway(self, mapper):
        """Test mapping coastal highway keywords"""
        caption = "a coastal highway with ocean view"
        result = mapper.map_caption_to_style(caption)

        assert result["genre"] == "french house"
        assert result["bpm"] == 120

    def test_map_city_night(self, mapper):
        """Test mapping city night keywords"""
        caption = "city at night with neon lights"
        result = mapper.map_caption_to_style(caption)

        assert result["genre"] == "synthwave"
        assert result["bpm"] == 110

    def test_map_forest(self, mapper):
        """Test mapping forest keywords"""
        caption = "a forest with green trees"
        result = mapper.map_caption_to_style(caption)

        assert result["genre"] == "ambient"
        assert result["subgenre"] == "cinematic"

    def test_map_mountain(self, mapper):
        """Test mapping mountain keywords"""
        caption = "mountain peak with snow"
        result = mapper.map_caption_to_style(caption)

        assert result["genre"] == "epic orchestral"
        assert result["bpm"] == 80

    def test_map_desert(self, mapper):
        """Test mapping desert keywords"""
        caption = "desert sand dunes at sunset"
        result = mapper.map_caption_to_style(caption)

        assert result["genre"] == "ethnic ambient"
        assert result["bpm"] == 85

    def test_map_rainy_city(self, mapper):
        """Test mapping rainy city keywords"""
        caption = "rainy city street at night"
        result = mapper.map_caption_to_style(caption)

        assert result["genre"] == "lo-fi hip hop"
        assert "jazzy piano" in result["instrumentation"]

    def test_map_cafe(self, mapper):
        """Test mapping cafe keywords"""
        caption = "cozy cafe interior with coffee"
        result = mapper.map_caption_to_style(caption)

        assert result["genre"] == "bossa nova"
        assert result["bpm"] == 95

    def test_map_skyline(self, mapper):
        """Test mapping skyline keywords"""
        caption = "city skyline with skyscrapers"
        result = mapper.map_caption_to_style(caption)

        assert result["genre"] == "downtempo electronic"
        assert result["bpm"] == 100

    def test_map_tropical_beach(self, mapper):
        """Test mapping tropical beach keywords"""
        caption = "tropical paradise with turquoise water"
        result = mapper.map_caption_to_style(caption)

        assert result["genre"] == "reggae fusion"
        assert "steel drums" in result["instrumentation"]

    def test_fallback_to_default(self, mapper):
        """Test fallback when no keywords match"""
        caption = "something completely unrecognized"
        result = mapper.map_caption_to_style(caption)

        assert result["genre"] == "ambient"
        assert result["subgenre"] == "neutral"
        assert result["bpm"] == 90

    def test_multiple_keyword_matching(self, mapper):
        """Test that multiple keywords improve match"""
        # More keywords should match better
        caption1 = "beach"  # One keyword
        caption2 = "beach sunset tropical palm"  # Multiple keywords

        result1 = mapper.map_caption_to_style(caption1)
        result2 = mapper.map_caption_to_style(caption2)

        # Both should match beach_sunset category
        assert result1["genre"] == result2["genre"]

    def test_get_all_categories(self, mapper):
        """Test getting all category names"""
        categories = mapper.get_all_categories()

        assert len(categories) >= 12
        assert "beach_sunset" in categories
        assert "coastal_highway" in categories
        assert "city_night_neon" in categories

    def test_case_insensitive_matching(self, mapper):
        """Test that matching is case insensitive"""
        caption_lower = "beach at sunset"
        caption_upper = "BEACH AT SUNSET"

        result_lower = mapper.map_caption_to_style(caption_lower)
        result_upper = mapper.map_caption_to_style(caption_upper)

        assert result_lower["genre"] == result_upper["genre"]
