"""
Database module for WaveLength backend
Supports both SQLite (local) and PostgreSQL (production)
Automatically detects based on DATABASE_URL environment variable
"""

import os
import sqlite3
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
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS songs (
                    id TEXT PRIMARY KEY,
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
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
        else:
            # SQLite syntax
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS songs (
                    id TEXT PRIMARY KEY,
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
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)

        conn.commit()
        print(f"[Database] Tables initialized successfully ({'PostgreSQL' if USE_POSTGRES else 'SQLite'})")


def create_song(song_data: Dict[str, Any]) -> str:
    """Create a new song in the database with all metadata."""
    with get_db() as conn:
        cursor = conn.cursor()

        if USE_POSTGRES:
            cursor.execute("""
                INSERT INTO songs (
                    id, user_name, song_name, image_path, audio_path,
                    caption, genre, tags, duration, has_vocals, has_lyrics,
                    lyrics, is_liked, created_at
                ) VALUES (
                    %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
                )
            """, (
                song_data["id"],
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
                song_data.get("created_at", datetime.now())
            ))
        else:
            cursor.execute("""
                INSERT INTO songs (
                    id, user_name, song_name, image_path, audio_path,
                    caption, genre, tags, duration, has_vocals, has_lyrics,
                    lyrics, is_liked, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                song_data["id"],
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


# Initialize database on module import
try:
    init_database()
except Exception as e:
    print(f"[Database] Error initializing database: {e}")
