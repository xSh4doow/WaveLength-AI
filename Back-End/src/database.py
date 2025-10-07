"""
Database module for WaveLength backend
SQLite database for storing songs and user data
"""

import sqlite3
import os
from typing import Optional, List, Dict, Any
from datetime import datetime
from contextlib import contextmanager


# Database path
DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "wavelength.db")


@contextmanager
def get_db():
    """Context manager for database connections."""
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

        # Songs table
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

        print("[database] Database initialized successfully")


# ---------- CRUD OPERATIONS ----------

def create_song(song_data: Dict[str, Any]) -> str:
    """
    Create a new song in the database.

    Args:
        song_data: Dictionary with song data
            - id: str (required)
            - user_name: str (required)
            - song_name: str (required)
            - audio_path: str (required)
            - image_path: str (optional)
            - caption: str (optional)
            - genre: str (optional)
            - tags: str (optional)
            - duration: int (required)
            - has_vocals: bool (optional)
            - has_lyrics: bool (optional)
            - lyrics: str (optional)

    Returns:
        Song ID
    """
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO songs (
                id, user_name, song_name, image_path, audio_path,
                caption, genre, tags, duration, has_vocals, has_lyrics, lyrics
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
        ))

        return song_data["id"]


def get_song(song_id: str) -> Optional[Dict[str, Any]]:
    """Get a song by ID."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM songs WHERE id = ?", (song_id,))
        row = cursor.fetchone()

        if row:
            return dict(row)
        return None


def get_all_songs(limit: int = 100, offset: int = 0) -> List[Dict[str, Any]]:
    """Get all songs with pagination."""
    with get_db() as conn:
        cursor = conn.cursor()
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
        cursor.execute("""
            UPDATE songs
            SET is_liked = ?
            WHERE id = ?
        """, (is_liked, song_id))

        return cursor.rowcount > 0


def delete_song(song_id: str) -> bool:
    """Delete a song from database."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM songs WHERE id = ?", (song_id,))
        return cursor.rowcount > 0


def search_songs(query: str, limit: int = 50) -> List[Dict[str, Any]]:
    """Search songs by name, user, or tags."""
    with get_db() as conn:
        cursor = conn.cursor()
        search_pattern = f"%{query}%"
        cursor.execute("""
            SELECT * FROM songs
            WHERE song_name LIKE ?
               OR user_name LIKE ?
               OR tags LIKE ?
               OR caption LIKE ?
            ORDER BY created_at DESC
            LIMIT ?
        """, (search_pattern, search_pattern, search_pattern, search_pattern, limit))

        rows = cursor.fetchall()
        return [dict(row) for row in rows]


# Initialize database on module import
init_database()
