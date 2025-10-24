"""
Database module for WaveLength backend
Supports both SQLite (local) and PostgreSQL (production)
Automatically detects based on DATABASE_URL environment variable
"""

import os
import sqlite3
import bcrypt
from typing import Optional, List, Dict, Any
from datetime import datetime
from contextlib import contextmanager

# Check if PostgreSQL URL is provided
DATABASE_URL = os.getenv("DATABASE_URL")
USE_POSTGRES = DATABASE_URL is not None

# Import psycopg2 only if using PostgreSQL
if USE_POSTGRES:
    try:
        import psycopg2
        from psycopg2.extras import RealDictCursor
        print(f"[Database] Using PostgreSQL: {DATABASE_URL[:30]}...")
    except ImportError:
        print("[Database] psycopg2 not installed, falling back to SQLite")
        USE_POSTGRES = False
        DATABASE_URL = None

# SQLite path
DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "wavelength.db")


@contextmanager
def get_db():
    """Context manager for database connections (SQLite or PostgreSQL)."""
    if USE_POSTGRES:
        # PostgreSQL connection
        conn = psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)
        conn.autocommit = False
        try:
            yield conn
            conn.commit()
        except Exception as e:
            conn.rollback()
            raise e
        finally:
            conn.close()
    else:
        # SQLite connection
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row  # Enable column access by name
        try:
            yield conn
            conn.commit()
        except Exception as e:
            conn.rollback()
            raise e
        finally:
            conn.close()


def init_database():
    """Initialize database and create tables if they don't exist."""
    with get_db() as conn:
        cursor = conn.cursor()

        if USE_POSTGRES:
            # PostgreSQL syntax
            # Users table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    id SERIAL PRIMARY KEY,
                    email TEXT UNIQUE NOT NULL,
                    password_hash TEXT NOT NULL,
                    name TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)

            # Follows table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS follows (
                    id SERIAL PRIMARY KEY,
                    follower_id INTEGER NOT NULL,
                    following_id INTEGER NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
                    FOREIGN KEY (following_id) REFERENCES users(id) ON DELETE CASCADE,
                    UNIQUE(follower_id, following_id)
                )
            """)

            # Songs table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS songs (
                    id TEXT PRIMARY KEY,
                    user_id INTEGER,
                    user_name TEXT NOT NULL,
                    song_name TEXT NOT NULL,
                    image_path TEXT,
                    audio_path TEXT NOT NULL,
                    caption TEXT,
                    genre TEXT,
                    tags TEXT,
                    duration INTEGER NOT NULL,
                    has_vocals BOOLEAN DEFAULT FALSE,
                    has_lyrics BOOLEAN DEFAULT FALSE,
                    lyrics TEXT,
                    is_liked BOOLEAN DEFAULT FALSE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
                )
            """)
        else:
            # SQLite syntax
            # Users table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    email TEXT UNIQUE NOT NULL,
                    password_hash TEXT NOT NULL,
                    name TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)

            # Follows table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS follows (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    follower_id INTEGER NOT NULL,
                    following_id INTEGER NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
                    FOREIGN KEY (following_id) REFERENCES users(id) ON DELETE CASCADE,
                    UNIQUE(follower_id, following_id)
                )
            """)

            # Songs table (add user_id column)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS songs (
                    id TEXT PRIMARY KEY,
                    user_id INTEGER,
                    user_name TEXT NOT NULL,
                    song_name TEXT NOT NULL,
                    image_path TEXT,
                    audio_path TEXT NOT NULL,
                    caption TEXT,
                    genre TEXT,
                    tags TEXT,
                    duration INTEGER NOT NULL,
                    has_vocals BOOLEAN DEFAULT 0,
                    has_lyrics BOOLEAN DEFAULT 0,
                    lyrics TEXT,
                    is_liked BOOLEAN DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
                )
            """)

        # Playlists table
        if USE_POSTGRES:
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS playlists (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER NOT NULL,
                    name TEXT NOT NULL,
                    description TEXT,
                    is_public BOOLEAN DEFAULT TRUE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                )
            """)
        else:
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS playlists (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    name TEXT NOT NULL,
                    description TEXT,
                    is_public BOOLEAN DEFAULT 1,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                )
            """)

        # Playlist songs (many-to-many relationship)
        if USE_POSTGRES:
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS playlist_songs (
                    id SERIAL PRIMARY KEY,
                    playlist_id INTEGER NOT NULL,
                    song_id TEXT NOT NULL,
                    position INTEGER NOT NULL,
                    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (playlist_id) REFERENCES playlists(id) ON DELETE CASCADE,
                    FOREIGN KEY (song_id) REFERENCES songs(id) ON DELETE CASCADE,
                    UNIQUE(playlist_id, song_id)
                )
            """)
        else:
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS playlist_songs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    playlist_id INTEGER NOT NULL,
                    song_id TEXT NOT NULL,
                    position INTEGER NOT NULL,
                    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (playlist_id) REFERENCES playlists(id) ON DELETE CASCADE,
                    FOREIGN KEY (song_id) REFERENCES songs(id) ON DELETE CASCADE,
                    UNIQUE(playlist_id, song_id)
                )
            """)

        # Add new columns for SunoAPI integration (if not exists)
        if USE_POSTGRES:
            # PostgreSQL syntax
            cursor.execute("""
                ALTER TABLE songs
                ADD COLUMN IF NOT EXISTS suno_task_id TEXT,
                ADD COLUMN IF NOT EXISTS generation_status TEXT DEFAULT 'SUCCESS'
            """)
        else:
            # SQLite syntax - check if columns exist first
            cursor.execute("PRAGMA table_info(songs)")
            columns = [row[1] if isinstance(row, tuple) else row["name"] for row in cursor.fetchall()]

            if "suno_task_id" not in columns:
                cursor.execute("ALTER TABLE songs ADD COLUMN suno_task_id TEXT")

            if "generation_status" not in columns:
                cursor.execute("ALTER TABLE songs ADD COLUMN generation_status TEXT DEFAULT 'SUCCESS'")

        conn.commit()
        print(f"[Database] Tables initialized successfully ({'PostgreSQL' if USE_POSTGRES else 'SQLite'})")


def create_song(song_data: Dict[str, Any]) -> str:
    """Create a new song in the database with all metadata."""
    with get_db() as conn:
        cursor = conn.cursor()

        if USE_POSTGRES:
            cursor.execute("""
                INSERT INTO songs (
                    id, user_id, user_name, song_name, image_path, audio_path,
                    caption, genre, tags, duration, has_vocals, has_lyrics,
                    lyrics, is_liked, suno_task_id, generation_status, created_at
                ) VALUES (
                    %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
                )
            """, (
                song_data["id"],
                song_data.get("user_id"),
                song_data["user_name"],
                song_data["song_name"],
                song_data.get("image_path"),
                song_data["audio_path"],
                song_data.get("caption"),
                song_data.get("genre"),
                song_data.get("tags"),
                song_data["duration"],
                song_data.get("has_vocals", False),
                song_data.get("has_lyrics", False),
                song_data.get("lyrics"),
                song_data.get("is_liked", False),
                song_data.get("suno_task_id"),
                song_data.get("generation_status", "SUCCESS"),
                song_data.get("created_at", datetime.now())
            ))
        else:
            cursor.execute("""
                INSERT INTO songs (
                    id, user_id, user_name, song_name, image_path, audio_path,
                    caption, genre, tags, duration, has_vocals, has_lyrics,
                    lyrics, is_liked, suno_task_id, generation_status, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                song_data["id"],
                song_data.get("user_id"),
                song_data["user_name"],
                song_data["song_name"],
                song_data.get("image_path"),
                song_data["audio_path"],
                song_data.get("caption"),
                song_data.get("genre"),
                song_data.get("tags"),
                song_data["duration"],
                song_data.get("has_vocals", False),
                song_data.get("has_lyrics", False),
                song_data.get("lyrics"),
                song_data.get("is_liked", False),
                song_data.get("suno_task_id"),
                song_data.get("generation_status", "SUCCESS"),
                song_data.get("created_at", datetime.now())
            ))

        return song_data["id"]


def get_song(song_id: str) -> Optional[Dict[str, Any]]:
    """Get a song by ID."""
    with get_db() as conn:
        cursor = conn.cursor()

        if USE_POSTGRES:
            cursor.execute("SELECT * FROM songs WHERE id = %s", (song_id,))
        else:
            cursor.execute("SELECT * FROM songs WHERE id = ?", (song_id,))

        row = cursor.fetchone()
        if row:
            return dict(row)
        return None


def get_all_songs(limit: int = 100, offset: int = 0) -> List[Dict[str, Any]]:
    """Get all songs with pagination."""
    with get_db() as conn:
        cursor = conn.cursor()

        if USE_POSTGRES:
            cursor.execute("""
                SELECT * FROM songs
                ORDER BY created_at DESC
                LIMIT %s OFFSET %s
            """, (limit, offset))
        else:
            cursor.execute("""
                SELECT * FROM songs
                ORDER BY created_at DESC
                LIMIT ? OFFSET ?
            """, (limit, offset))

        rows = cursor.fetchall()
        return [dict(row) for row in rows]


def get_songs_by_user(user_name: str, limit: int = 100, offset: int = 0) -> List[Dict[str, Any]]:
    """Get all songs by a specific user."""
    with get_db() as conn:
        cursor = conn.cursor()

        if USE_POSTGRES:
            cursor.execute("""
                SELECT * FROM songs
                WHERE user_name = %s
                ORDER BY created_at DESC
                LIMIT %s OFFSET %s
            """, (user_name, limit, offset))
        else:
            cursor.execute("""
                SELECT * FROM songs
                WHERE user_name = ?
                ORDER BY created_at DESC
                LIMIT ? OFFSET ?
            """, (user_name, limit, offset))

        rows = cursor.fetchall()
        return [dict(row) for row in rows]


def update_song_like(song_id: str, is_liked: bool) -> bool:
    """Toggle like status for a song."""
    with get_db() as conn:
        cursor = conn.cursor()

        if USE_POSTGRES:
            cursor.execute("""
                UPDATE songs
                SET is_liked = %s
                WHERE id = %s
            """, (is_liked, song_id))
        else:
            cursor.execute("""
                UPDATE songs
                SET is_liked = ?
                WHERE id = ?
            """, (is_liked, song_id))

        return cursor.rowcount > 0


def delete_song(song_id: str) -> bool:
    """Delete a song by ID."""
    with get_db() as conn:
        cursor = conn.cursor()

        if USE_POSTGRES:
            cursor.execute("DELETE FROM songs WHERE id = %s", (song_id,))
        else:
            cursor.execute("DELETE FROM songs WHERE id = ?", (song_id,))

        return cursor.rowcount > 0


def update_song_status(
    song_id: str,
    status: str,
    audio_url: Optional[str] = None,
    image_url: Optional[str] = None,
    duration: Optional[int] = None,
    lyrics: Optional[str] = None
) -> bool:
    """
    Update song generation status and audio data when SunoAPI completes.

    Args:
        song_id: Song ID
        status: New status (PENDING, GENERATING, SUCCESS, FAILED)
        audio_url: Audio URL from SunoAPI (if completed)
        image_url: Image URL from SunoAPI (if completed)
        duration: Actual duration from SunoAPI (if completed)
        lyrics: Generated lyrics from SunoAPI (if available)

    Returns:
        True if update succeeded
    """
    with get_db() as conn:
        cursor = conn.cursor()

        # Build dynamic update query
        fields = ["generation_status"]
        values = [status]

        if audio_url:
            fields.append("audio_path")
            values.append(audio_url)

        if image_url:
            fields.append("image_path")
            values.append(image_url)

        if duration is not None:
            fields.append("duration")
            values.append(duration)

        if lyrics:
            fields.append("lyrics")
            values.append(lyrics)

        # Add song_id to values
        values.append(song_id)

        if USE_POSTGRES:
            set_clause = ", ".join([f"{field} = %s" for field in fields])
            cursor.execute(f"UPDATE songs SET {set_clause} WHERE id = %s", tuple(values))
        else:
            set_clause = ", ".join([f"{field} = ?" for field in fields])
            cursor.execute(f"UPDATE songs SET {set_clause} WHERE id = ?", tuple(values))

        return cursor.rowcount > 0


def get_song_by_task_id(task_id: str) -> Optional[Dict[str, Any]]:
    """
    Get song by SunoAPI task ID.

    Args:
        task_id: SunoAPI task ID

    Returns:
        Song data or None
    """
    with get_db() as conn:
        cursor = conn.cursor()

        if USE_POSTGRES:
            cursor.execute("SELECT * FROM songs WHERE suno_task_id = %s", (task_id,))
        else:
            cursor.execute("SELECT * FROM songs WHERE suno_task_id = ?", (task_id,))

        row = cursor.fetchone()
        if row:
            return dict(row)
        return None


def search_songs(query: str, limit: int = 50) -> List[Dict[str, Any]]:
    """Search songs by name, caption, or tags."""
    with get_db() as conn:
        cursor = conn.cursor()
        search_pattern = f"%{query}%"

        if USE_POSTGRES:
            cursor.execute("""
                SELECT * FROM songs
                WHERE song_name ILIKE %s
                   OR caption ILIKE %s
                   OR tags ILIKE %s
                ORDER BY created_at DESC
                LIMIT %s
            """, (search_pattern, search_pattern, search_pattern, limit))
        else:
            cursor.execute("""
                SELECT * FROM songs
                WHERE song_name LIKE ?
                   OR caption LIKE ?
                   OR tags LIKE ?
                ORDER BY created_at DESC
                LIMIT ?
            """, (search_pattern, search_pattern, search_pattern, limit))

        rows = cursor.fetchall()
        return [dict(row) for row in rows]


# ---------- AUTH FUNCTIONS ----------

def hash_password(password: str) -> str:
    """Hash a password using bcrypt."""
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against a hash."""
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))


def create_user(email: str, password: str, name: str) -> Dict[str, Any]:
    """Create a new user. Returns user dict with id."""
    with get_db() as conn:
        cursor = conn.cursor()
        password_hash = hash_password(password)

        try:
            if USE_POSTGRES:
                cursor.execute("""
                    INSERT INTO users (email, password_hash, name)
                    VALUES (%s, %s, %s)
                    RETURNING id, email, name, created_at
                """, (email, password_hash, name))
                row = cursor.fetchone()
                return dict(row)
            else:
                cursor.execute("""
                    INSERT INTO users (email, password_hash, name)
                    VALUES (?, ?, ?)
                """, (email, password_hash, name))
                user_id = cursor.lastrowid
                cursor.execute("SELECT id, email, name, created_at FROM users WHERE id = ?", (user_id,))
                row = cursor.fetchone()
                return dict(row)
        except Exception as e:
            if "UNIQUE constraint failed" in str(e) or "duplicate key" in str(e):
                raise ValueError("Email already registered")
            raise


def get_user_by_email(email: str) -> Optional[Dict[str, Any]]:
    """Get user by email."""
    with get_db() as conn:
        cursor = conn.cursor()
        if USE_POSTGRES:
            cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
        else:
            cursor.execute("SELECT * FROM users WHERE email = ?", (email,))
        row = cursor.fetchone()
        return dict(row) if row else None


def get_user_by_id(user_id: int) -> Optional[Dict[str, Any]]:
    """Get user by ID."""
    with get_db() as conn:
        cursor = conn.cursor()
        if USE_POSTGRES:
            cursor.execute("SELECT id, email, name, created_at FROM users WHERE id = %s", (user_id,))
        else:
            cursor.execute("SELECT id, email, name, created_at FROM users WHERE id = ?", (user_id,))
        row = cursor.fetchone()
        return dict(row) if row else None


def search_users(query: str, limit: int = 50) -> List[Dict[str, Any]]:
    """Search users by name. Returns list of users (without password_hash)."""
    with get_db() as conn:
        cursor = conn.cursor()
        search_pattern = f"%{query}%"

        if USE_POSTGRES:
            cursor.execute("""
                SELECT id, email, name, created_at
                FROM users
                WHERE name ILIKE %s
                LIMIT %s
            """, (search_pattern, limit))
        else:
            cursor.execute("""
                SELECT id, email, name, created_at
                FROM users
                WHERE name LIKE ?
                LIMIT ?
            """, (search_pattern, limit))

        rows = cursor.fetchall()
        return [dict(row) for row in rows]


# ---------- FOLLOW FUNCTIONS ----------

def create_follow(follower_id: int, following_id: int) -> bool:
    """Create a follow relationship. Returns True if created."""
    if follower_id == following_id:
        raise ValueError("Cannot follow yourself")

    with get_db() as conn:
        cursor = conn.cursor()
        try:
            if USE_POSTGRES:
                cursor.execute("""
                    INSERT INTO follows (follower_id, following_id)
                    VALUES (%s, %s)
                """, (follower_id, following_id))
            else:
                cursor.execute("""
                    INSERT INTO follows (follower_id, following_id)
                    VALUES (?, ?)
                """, (follower_id, following_id))
            return True
        except Exception as e:
            if "UNIQUE constraint failed" in str(e) or "duplicate key" in str(e):
                return False  # Already following
            raise


def delete_follow(follower_id: int, following_id: int) -> bool:
    """Delete a follow relationship. Returns True if deleted."""
    with get_db() as conn:
        cursor = conn.cursor()
        if USE_POSTGRES:
            cursor.execute("""
                DELETE FROM follows
                WHERE follower_id = %s AND following_id = %s
            """, (follower_id, following_id))
        else:
            cursor.execute("""
                DELETE FROM follows
                WHERE follower_id = ? AND following_id = ?
            """, (follower_id, following_id))
        return cursor.rowcount > 0


def get_following(user_id: int) -> List[Dict[str, Any]]:
    """Get list of users that user_id is following."""
    with get_db() as conn:
        cursor = conn.cursor()
        if USE_POSTGRES:
            cursor.execute("""
                SELECT u.id, u.email, u.name, u.created_at
                FROM users u
                JOIN follows f ON u.id = f.following_id
                WHERE f.follower_id = %s
                ORDER BY f.created_at DESC
            """, (user_id,))
        else:
            cursor.execute("""
                SELECT u.id, u.email, u.name, u.created_at
                FROM users u
                JOIN follows f ON u.id = f.following_id
                WHERE f.follower_id = ?
                ORDER BY f.created_at DESC
            """, (user_id,))
        rows = cursor.fetchall()
        return [dict(row) for row in rows]


def get_followers(user_id: int) -> List[Dict[str, Any]]:
    """Get list of users following user_id."""
    with get_db() as conn:
        cursor = conn.cursor()
        if USE_POSTGRES:
            cursor.execute("""
                SELECT u.id, u.email, u.name, u.created_at
                FROM users u
                JOIN follows f ON u.id = f.follower_id
                WHERE f.following_id = %s
                ORDER BY f.created_at DESC
            """, (user_id,))
        else:
            cursor.execute("""
                SELECT u.id, u.email, u.name, u.created_at
                FROM users u
                JOIN follows f ON u.id = f.follower_id
                WHERE f.following_id = ?
                ORDER BY f.created_at DESC
            """, (user_id,))
        rows = cursor.fetchall()
        return [dict(row) for row in rows]


def get_friends_songs(user_id: int, limit: int = 100, offset: int = 0) -> List[Dict[str, Any]]:
    """Get songs from users that user_id is following."""
    with get_db() as conn:
        cursor = conn.cursor()
        if USE_POSTGRES:
            cursor.execute("""
                SELECT s.*
                FROM songs s
                JOIN follows f ON s.user_id = f.following_id
                WHERE f.follower_id = %s
                ORDER BY s.created_at DESC
                LIMIT %s OFFSET %s
            """, (user_id, limit, offset))
        else:
            cursor.execute("""
                SELECT s.*
                FROM songs s
                JOIN follows f ON s.user_id = f.following_id
                WHERE f.follower_id = ?
                ORDER BY s.created_at DESC
                LIMIT ? OFFSET ?
            """, (user_id, limit, offset))
        rows = cursor.fetchall()
        return [dict(row) for row in rows]


# Initialize database on module import
try:
    init_database()
except Exception as e:
    print(f"[Database] Error initializing database: {e}")
