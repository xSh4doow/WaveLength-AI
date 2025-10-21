"""Tests for vocals and lyrics functionality"""
import pytest
from fastapi.testclient import TestClient
from io import BytesIO
from PIL import Image
from src.database import init_database


@pytest.fixture(autouse=True)
def setup_database():
    """Initialize database before each test"""
    init_database()
    yield


@pytest.fixture
def client():
    """Create test client"""
    from src.main import app
    return TestClient(app)


@pytest.fixture
def test_image_file():
    """Create test image file"""
    img = Image.new('RGB', (100, 100), color='blue')
    img_bytes = BytesIO()
    img.save(img_bytes, format='PNG')
    img_bytes.seek(0)
    return img_bytes


class TestVocalsParameter:
    """Test has_vocals parameter"""

    def test_generate_instrumental_has_vocals_false(self, client, test_image_file):
        """Test generating instrumental music (has_vocals=false)"""
        response = client.post(
            "/generate",
            files={"image": ("test.png", test_image_file, "image/png")},
            data={
                "user_name": "Test User",
                "song_name": "Instrumental Song",
                "duration": "30",
                "has_vocals": "false",
                "has_lyrics": "false",
                "engine": "mock"
            }
        )

        assert response.status_code == 200
        data = response.json()
        assert data["has_vocals"] is False
        assert data["has_lyrics"] is False
        assert data["lyrics"] is None

    def test_generate_with_vocals_has_vocals_true(self, client, test_image_file):
        """Test generating music with vocals (has_vocals=true)"""
        response = client.post(
            "/generate",
            files={"image": ("test.png", test_image_file, "image/png")},
            data={
                "user_name": "Test User",
                "song_name": "Vocal Song",
                "duration": "30",
                "has_vocals": "true",
                "has_lyrics": "true",
                "engine": "mock"
            }
        )

        assert response.status_code == 200
        data = response.json()
        assert data["has_vocals"] is True


class TestLyricsParameter:
    """Test has_lyrics parameter"""

    def test_generate_with_lyrics_has_lyrics_true(self, client, test_image_file):
        """Test generating music with lyrics (has_lyrics=true)"""
        response = client.post(
            "/generate",
            files={"image": ("test.png", test_image_file, "image/png")},
            data={
                "user_name": "Test User",
                "song_name": "Song with Lyrics",
                "duration": "30",
                "has_vocals": "true",
                "has_lyrics": "true",
                "engine": "mock"
            }
        )

        assert response.status_code == 200
        data = response.json()
        assert data["has_lyrics"] is True
        # In mock mode, lyrics might be generated or null
        # Real API would return lyrics

    def test_generate_without_lyrics_has_lyrics_false(self, client, test_image_file):
        """Test generating music without lyrics (has_lyrics=false)"""
        response = client.post(
            "/generate",
            files={"image": ("test.png", test_image_file, "image/png")},
            data={
                "user_name": "Test User",
                "song_name": "No Lyrics Song",
                "duration": "30",
                "has_vocals": "false",
                "has_lyrics": "false",
                "engine": "mock"
            }
        )

        assert response.status_code == 200
        data = response.json()
        assert data["has_lyrics"] is False
        assert data["lyrics"] is None


class TestDatabaseStorage:
    """Test that vocals/lyrics data is stored in database"""

    def test_song_stored_with_vocals_info(self, client, test_image_file):
        """Test that song is stored with has_vocals and has_lyrics"""
        response = client.post(
            "/generate",
            files={"image": ("test.png", test_image_file, "image/png")},
            data={
                "user_name": "Test User",
                "song_name": "Stored Song",
                "duration": "30",
                "has_vocals": "true",
                "has_lyrics": "true",
                "engine": "mock"
            }
        )

        song_id = response.json()["id"]

        # Get song from database
        song_response = client.get(f"/songs/{song_id}")

        assert song_response.status_code == 200
        song_data = song_response.json()
        assert "has_vocals" in song_data
        assert "has_lyrics" in song_data
        assert "lyrics" in song_data


class TestBackwardsCompatibility:
    """Test that old behavior still works (default to instrumental)"""

    def test_generate_without_vocals_params_defaults_to_instrumental(self, client, test_image_file):
        """Test that omitting vocals params defaults to instrumental"""
        response = client.post(
            "/generate",
            files={"image": ("test.png", test_image_file, "image/png")},
            data={
                "user_name": "Test User",
                "song_name": "Default Song",
                "duration": "30",
                "engine": "mock"
            }
        )

        assert response.status_code == 200
        data = response.json()
        # Should default to instrumental
        assert data["has_vocals"] is False
        assert data["has_lyrics"] is False
