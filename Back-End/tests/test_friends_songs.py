"""Tests for friends' songs endpoint"""
import pytest
from fastapi.testclient import TestClient
from io import BytesIO
from PIL import Image
from src.database import init_database


@pytest.fixture(autouse=True)
def setup_database():
    """Initialize database before each test"""
    from src.database import get_db
    # Drop all tables before each test to ensure clean state
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("DROP TABLE IF EXISTS songs")
        cursor.execute("DROP TABLE IF EXISTS follows")
        cursor.execute("DROP TABLE IF EXISTS users")
        conn.commit()
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
    img = Image.new('RGB', (100, 100), color='red')
    img_bytes = BytesIO()
    img.save(img_bytes, format='PNG')
    img_bytes.seek(0)
    return img_bytes


@pytest.fixture
def test_users_with_songs(client, test_image_file):
    """Create users with songs"""
    # Create 3 users
    user1 = client.post(
        "/auth/register",
        json={"email": "user1@test.com", "password": "Pass123!", "name": "User One"}
    ).json()

    user2 = client.post(
        "/auth/register",
        json={"email": "user2@test.com", "password": "Pass123!", "name": "User Two"}
    ).json()

    user3 = client.post(
        "/auth/register",
        json={"email": "user3@test.com", "password": "Pass123!", "name": "User Three"}
    ).json()

    # User 2 creates 2 songs
    user2_song_ids = []
    for i in range(2):
        # Reset image file pointer
        img = Image.new('RGB', (100, 100), color='blue')
        img_bytes = BytesIO()
        img.save(img_bytes, format='PNG')
        img_bytes.seek(0)

        response = client.post(
            "/generate",
            files={"image": ("test.png", img_bytes, "image/png")},
            data={
                "user_name": "User Two",
                "song_name": f"Song {i+1} by User 2",
                "duration": "30",
                "engine": "mock"
            }
        )
        user2_song_ids.append(response.json()["id"])

    # User 3 creates 1 song
    img = Image.new('RGB', (100, 100), color='green')
    img_bytes = BytesIO()
    img.save(img_bytes, format='PNG')
    img_bytes.seek(0)

    response = client.post(
        "/generate",
        files={"image": ("test.png", img_bytes, "image/png")},
        data={
            "user_name": "User Three",
            "song_name": "Song by User 3",
            "duration": "30",
            "engine": "mock"
        }
    )
    user3_song_id = response.json()["id"]

    # Manually link songs to users in database for testing friends functionality
    from src.database import get_db
    with get_db() as conn:
        cursor = conn.cursor()
        for song_id in user2_song_ids:
            cursor.execute("UPDATE songs SET user_id = ? WHERE id = ?", (user2["user_id"], song_id))
        cursor.execute("UPDATE songs SET user_id = ? WHERE id = ?", (user3["user_id"], user3_song_id))
        conn.commit()

    return {
        "user1": user1,
        "user2": user2,
        "user3": user3
    }


class TestFriendsSongsEndpoint:
    """Test /songs/friends/{user_id} endpoint"""

    def test_get_friends_songs_success(self, client, test_users_with_songs):
        """Test getting songs from friends"""
        user1_id = test_users_with_songs["user1"]["user_id"]
        user2_id = test_users_with_songs["user2"]["user_id"]
        user3_id = test_users_with_songs["user3"]["user_id"]

        # User 1 follows User 2 and User 3
        client.post(f"/users/{user2_id}/follow", json={"follower_id": user1_id})
        client.post(f"/users/{user3_id}/follow", json={"follower_id": user1_id})

        # Get friends' songs
        response = client.get(f"/songs/friends/{user1_id}")

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 3  # 2 from User 2 + 1 from User 3

        # Verify songs are from friends
        for song in data:
            assert song["user_name"] in ["User Two", "User Three"]

    def test_get_friends_songs_excludes_own_songs(self, client, test_users_with_songs, test_image_file):
        """Test that friends' songs don't include own songs"""
        user1_id = test_users_with_songs["user1"]["user_id"]
        user2_id = test_users_with_songs["user2"]["user_id"]

        # User 1 creates a song
        img = Image.new('RGB', (100, 100), color='red')
        img_bytes = BytesIO()
        img.save(img_bytes, format='PNG')
        img_bytes.seek(0)

        client.post(
            "/generate",
            files={"image": ("test.png", img_bytes, "image/png")},
            data={
                "user_name": "User One",
                "song_name": "Own Song",
                "duration": "30",
                "engine": "mock"
            }
        )

        # User 1 follows User 2
        client.post(f"/users/{user2_id}/follow", json={"follower_id": user1_id})

        # Get friends' songs
        response = client.get(f"/songs/friends/{user1_id}")

        data = response.json()
        # Should only have User 2's songs, not User 1's own song
        assert all(song["user_name"] != "User One" for song in data)

    def test_get_friends_songs_empty_when_no_follows(self, client, test_users_with_songs):
        """Test that returns empty list when not following anyone"""
        user1_id = test_users_with_songs["user1"]["user_id"]

        response = client.get(f"/songs/friends/{user1_id}")

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 0

    def test_get_friends_songs_pagination(self, client, test_users_with_songs):
        """Test pagination works for friends' songs"""
        user1_id = test_users_with_songs["user1"]["user_id"]
        user2_id = test_users_with_songs["user2"]["user_id"]

        # User 1 follows User 2
        client.post(f"/users/{user2_id}/follow", json={"follower_id": user1_id})

        # Get with limit
        response = client.get(f"/songs/friends/{user1_id}?limit=1&offset=0")

        assert response.status_code == 200
        data = response.json()
        assert len(data) <= 1
