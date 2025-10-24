"""Tests for FastAPI main application"""
import pytest
from fastapi.testclient import TestClient
from io import BytesIO
from PIL import Image


@pytest.fixture
def client():
    """Create test client"""
    from src.main import app
    return TestClient(app)


@pytest.fixture
def test_image_file():
    """Create test image file"""
    img = Image.new('RGB', (100, 100), color='red')
    img_bytes = BytesIO()
    img.save(img_bytes, format='PNG')
    img_bytes.seek(0)
    return img_bytes


class TestRootEndpoint:
    """Test root endpoint"""

    def test_root_returns_info(self, client):
        """Test root endpoint returns API info"""
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "endpoints" in data


class TestHealthEndpoint:
    """Test health endpoint"""

    def test_health_returns_ok(self, client):
        """Test health endpoint returns OK"""
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert "blip_ready" in data
        assert "udio_ready" in data
        assert "device" in data

    def test_health_includes_models_status(self, client):
        """Test health endpoint includes model status"""
        response = client.get("/health")
        data = response.json()
        assert "models_loaded" in data
        assert "blip" in data["models_loaded"]


class TestGenerateEndpoint:
    """Test generate endpoint"""

    def test_generate_mock_mode(self, client, test_image_file):
        """Test generate in mock mode"""
        response = client.post(
            "/generate",
            files={"image": ("test.png", test_image_file, "image/png")},
            data={
                "user_name": "TestUser",
                "duration": "30",
                "engine": "mock"
            }
        )

        assert response.status_code == 200
        data = response.json()
        assert "caption" in data
        assert "prompt" in data
        assert "audio_url" in data
        assert data["engine"] == "mock"
        assert data["duration"] == 30

    def test_generate_validates_duration(self, client, test_image_file):
        """Test that duration is validated"""
        response = client.post(
            "/generate",
            files={"image": ("test.png", test_image_file, "image/png")},
            data={
                "user_name": "TestUser",
                "duration": "150"  # Invalid, > 100
            }
        )

        assert response.status_code == 400

    def test_generate_saves_audio(self, client, test_image_file):
        """Test that generate saves audio file"""
        response = client.post(
            "/generate",
            files={"image": ("test.png", test_image_file, "image/png")},
            data={
                "user_name": "TestUser",
                "duration": "30",
                "engine": "mock"
            }
        )

        data = response.json()
        audio_url = data["audio_url"]

        # Try to get the audio file
        audio_response = client.get(audio_url)
        assert audio_response.status_code == 200

    def test_generate_returns_metadata(self, client, test_image_file):
        """Test that generate returns metadata"""
        response = client.post(
            "/generate",
            files={"image": ("test.png", test_image_file, "image/png")},
            data={
                "user_name": "TestUser",
                "duration": "30",
                "engine": "mock"
            }
        )

        data = response.json()
        assert "metadata" in data
        assert "genre" in data["metadata"]
        assert "bpm" in data["metadata"]
        assert "mood" in data["metadata"]

    def test_generate_with_genre_and_tags(self, client, test_image_file):
        """Test generate with user-specified genre and tags"""
        response = client.post(
            "/generate",
            files={"image": ("test.png", test_image_file, "image/png")},
            data={
                "user_name": "TestUser",
                "song_name": "Test Song",
                "genre": "rock",
                "tags": "energetic, loud, powerful",
                "duration": "30",
                "engine": "mock"
            }
        )

        assert response.status_code == 200
        data = response.json()
        # Genre and tags should be reflected in the response
        assert data["song_name"] == "Test Song"


class TestAudioEndpoint:
    """Test audio serving endpoint"""

    def test_audio_endpoint_not_found(self, client):
        """Test audio endpoint returns 404 for non-existent file"""
        response = client.get("/audio/nonexistent.wav")
        assert response.status_code == 404
