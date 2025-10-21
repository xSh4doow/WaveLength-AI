"""Tests for authentication endpoints"""
import pytest
from fastapi.testclient import TestClient
from src.database import init_database, create_user, get_user_by_email


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


class TestRegisterEndpoint:
    """Test user registration"""

    def test_register_success(self, client):
        """Test successful user registration"""
        response = client.post(
            "/auth/register",
            json={
                "email": "test@example.com",
                "password": "Test123!@#",
                "name": "Test User"
            }
        )

        assert response.status_code == 200
        data = response.json()
        assert "user_id" in data
        assert data["email"] == "test@example.com"
        assert data["name"] == "Test User"
        assert "password" not in data  # Don't leak password

    def test_register_duplicate_email(self, client):
        """Test registration with duplicate email"""
        # First registration
        client.post(
            "/auth/register",
            json={
                "email": "duplicate@example.com",
                "password": "Password123!",
                "name": "First User"
            }
        )

        # Try to register again with same email
        response = client.post(
            "/auth/register",
            json={
                "email": "duplicate@example.com",
                "password": "Different123!",
                "name": "Second User"
            }
        )

        assert response.status_code == 400
        assert "already exists" in response.json()["detail"].lower()

    def test_register_invalid_email(self, client):
        """Test registration with invalid email format"""
        response = client.post(
            "/auth/register",
            json={
                "email": "not-an-email",
                "password": "Password123!",
                "name": "Test User"
            }
        )

        assert response.status_code == 422  # Validation error

    def test_register_password_hashed(self, client):
        """Test that password is hashed in database"""
        email = "hash@example.com"
        password = "PlainPassword123!"

        client.post(
            "/auth/register",
            json={
                "email": email,
                "password": password,
                "name": "Hash Test"
            }
        )

        # Check database directly
        user = get_user_by_email(email)
        assert user is not None
        assert user["password_hash"] != password  # Should be hashed
        assert user["password_hash"].startswith("$2b$")  # bcrypt hash


class TestLoginEndpoint:
    """Test user login"""

    def test_login_success(self, client):
        """Test successful login with correct credentials"""
        email = "login@example.com"
        password = "LoginPassword123!"

        # Register user first
        client.post(
            "/auth/register",
            json={"email": email, "password": password, "name": "Login User"}
        )

        # Attempt login
        response = client.post(
            "/auth/login",
            json={"email": email, "password": password}
        )

        assert response.status_code == 200
        data = response.json()
        assert "user_id" in data
        assert data["email"] == email
        assert data["name"] == "Login User"

    def test_login_wrong_password(self, client):
        """Test login with incorrect password"""
        email = "wrong@example.com"

        # Register user
        client.post(
            "/auth/register",
            json={"email": email, "password": "Correct123!", "name": "User"}
        )

        # Try login with wrong password
        response = client.post(
            "/auth/login",
            json={"email": email, "password": "Wrong123!"}
        )

        assert response.status_code == 401
        assert "incorrect" in response.json()["detail"].lower()

    def test_login_nonexistent_user(self, client):
        """Test login with non-existent email"""
        response = client.post(
            "/auth/login",
            json={"email": "nonexistent@example.com", "password": "Password123!"}
        )

        assert response.status_code == 401
        assert "not found" in response.json()["detail"].lower() or \
               "incorrect" in response.json()["detail"].lower()


class TestGetUserEndpoint:
    """Test get user by ID"""

    def test_get_user_success(self, client):
        """Test getting user by valid ID"""
        # Create user
        response = client.post(
            "/auth/register",
            json={"email": "get@example.com", "password": "Pass123!", "name": "Get User"}
        )
        user_id = response.json()["user_id"]

        # Get user
        response = client.get(f"/auth/user/{user_id}")

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == user_id
        assert data["email"] == "get@example.com"
        assert data["name"] == "Get User"
        assert "password" not in data
        assert "password_hash" not in data

    def test_get_user_not_found(self, client):
        """Test getting non-existent user"""
        response = client.get("/auth/user/99999")

        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()
