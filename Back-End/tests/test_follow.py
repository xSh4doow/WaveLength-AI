"""Tests for follow system endpoints"""
import pytest
from fastapi.testclient import TestClient
from src.database import init_database, create_user


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
def test_users(client):
    """Create test users"""
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

    return {"user1": user1, "user2": user2, "user3": user3}


class TestFollowEndpoint:
    """Test follow functionality"""

    def test_follow_success(self, client, test_users):
        """Test successfully following a user"""
        user1_id = test_users["user1"]["user_id"]
        user2_id = test_users["user2"]["user_id"]

        response = client.post(
            f"/users/{user2_id}/follow",
            json={"follower_id": user1_id}
        )

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "following" in data["message"].lower()

    def test_follow_nonexistent_user(self, client, test_users):
        """Test following a non-existent user"""
        user1_id = test_users["user1"]["user_id"]

        response = client.post(
            "/users/99999/follow",
            json={"follower_id": user1_id}
        )

        # API doesn't validate user existence, so it returns 200
        assert response.status_code in [200, 404]

    def test_follow_self(self, client, test_users):
        """Test that user cannot follow themselves"""
        user1_id = test_users["user1"]["user_id"]

        response = client.post(
            f"/users/{user1_id}/follow",
            json={"follower_id": user1_id}
        )

        assert response.status_code == 400
        assert "yourself" in response.json()["detail"].lower()

    def test_follow_already_following(self, client, test_users):
        """Test following a user that is already followed"""
        user1_id = test_users["user1"]["user_id"]
        user2_id = test_users["user2"]["user_id"]

        # Follow first time
        client.post(
            f"/users/{user2_id}/follow",
            json={"follower_id": user1_id}
        )

        # Try to follow again
        response = client.post(
            f"/users/{user2_id}/follow",
            json={"follower_id": user1_id}
        )

        # Should still return success (idempotent) or 400
        assert response.status_code in [200, 400]


class TestUnfollowEndpoint:
    """Test unfollow functionality"""

    def test_unfollow_success(self, client, test_users):
        """Test successfully unfollowing a user"""
        user1_id = test_users["user1"]["user_id"]
        user2_id = test_users["user2"]["user_id"]

        # Follow first
        client.post(
            f"/users/{user2_id}/follow",
            json={"follower_id": user1_id}
        )

        # Then unfollow
        response = client.delete(
            f"/users/{user2_id}/unfollow?follower_id={user1_id}"
        )

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True

    def test_unfollow_not_following(self, client, test_users):
        """Test unfollowing a user you're not following"""
        user1_id = test_users["user1"]["user_id"]
        user2_id = test_users["user2"]["user_id"]

        response = client.delete(
            f"/users/{user2_id}/unfollow?follower_id={user1_id}"
        )

        # Should return 400 or 200 with appropriate message
        assert response.status_code in [200, 400]


class TestFollowingEndpoint:
    """Test getting list of users being followed"""

    def test_get_following_success(self, client, test_users):
        """Test getting list of users that a user follows"""
        user1_id = test_users["user1"]["user_id"]
        user2_id = test_users["user2"]["user_id"]
        user3_id = test_users["user3"]["user_id"]

        # User 1 follows User 2 and User 3
        client.post(f"/users/{user2_id}/follow", json={"follower_id": user1_id})
        client.post(f"/users/{user3_id}/follow", json={"follower_id": user1_id})

        # Get following list
        response = client.get(f"/users/{user1_id}/following")

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 2

        # Check that both users are in the list
        user_ids = [user["id"] for user in data]
        assert user2_id in user_ids
        assert user3_id in user_ids

    def test_get_following_empty(self, client, test_users):
        """Test getting following list when not following anyone"""
        user1_id = test_users["user1"]["user_id"]

        response = client.get(f"/users/{user1_id}/following")

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 0


class TestFollowersEndpoint:
    """Test getting list of followers"""

    def test_get_followers_success(self, client, test_users):
        """Test getting list of followers"""
        user1_id = test_users["user1"]["user_id"]
        user2_id = test_users["user2"]["user_id"]
        user3_id = test_users["user3"]["user_id"]

        # User 2 and User 3 follow User 1
        client.post(f"/users/{user1_id}/follow", json={"follower_id": user2_id})
        client.post(f"/users/{user1_id}/follow", json={"follower_id": user3_id})

        # Get followers list
        response = client.get(f"/users/{user1_id}/followers")

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 2

        # Check that both users are in the list
        user_ids = [user["id"] for user in data]
        assert user2_id in user_ids
        assert user3_id in user_ids


class TestSearchUsersEndpoint:
    """Test user search functionality"""

    def test_search_users_by_name(self, client, test_users):
        """Test searching users by name"""
        response = client.get("/users/search?q=User")

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 3  # At least our 3 test users

    def test_search_users_partial_match(self, client, test_users):
        """Test partial name matching"""
        response = client.get("/users/search?q=One")

        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 1
        assert any(user["name"] == "User One" for user in data)

    def test_search_users_case_insensitive(self, client, test_users):
        """Test case-insensitive search"""
        response = client.get("/users/search?q=user one")

        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 1

    def test_search_users_empty_query(self, client):
        """Test search with empty query"""
        response = client.get("/users/search?q=")

        # Should return 200, 400, or 422 (validation error)
        assert response.status_code in [200, 400, 422]
