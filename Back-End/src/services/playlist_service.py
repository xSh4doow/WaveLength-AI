"""
Playlist service for managing user playlists
"""
from typing import Dict, List, Any, Optional
from src.database import get_db, USE_POSTGRES


def create_playlist(user_id: int, name: str, description: Optional[str] = None, is_public: bool = True) -> int:
    """Create a new playlist"""
    with get_db() as conn:
        cursor = conn.cursor()

        if USE_POSTGRES:
            cursor.execute("""
                INSERT INTO playlists (user_id, name, description, is_public)
                VALUES (%s, %s, %s, %s)
                RETURNING id
            """, (user_id, name, description, is_public))
            playlist_id = cursor.fetchone()[0]
        else:
            cursor.execute("""
                INSERT INTO playlists (user_id, name, description, is_public)
                VALUES (?, ?, ?, ?)
            """, (user_id, name, description, 1 if is_public else 0))
            playlist_id = cursor.lastrowid

        conn.commit()
        return playlist_id


def get_user_playlists(user_id: int) -> List[Dict[str, Any]]:
    """Get all playlists for a user"""
    with get_db() as conn:
        cursor = conn.cursor()

        if USE_POSTGRES:
            cursor.execute("""
                SELECT
                    p.*,
                    COUNT(ps.song_id) as song_count
                FROM playlists p
                LEFT JOIN playlist_songs ps ON p.id = ps.playlist_id
                WHERE p.user_id = %s
                GROUP BY p.id
                ORDER BY p.updated_at DESC
            """, (user_id,))
        else:
            cursor.execute("""
                SELECT
                    p.*,
                    COUNT(ps.song_id) as song_count
                FROM playlists p
                LEFT JOIN playlist_songs ps ON p.id = ps.playlist_id
                WHERE p.user_id = ?
                GROUP BY p.id
                ORDER BY p.updated_at DESC
            """, (user_id,))

        columns = [desc[0] for desc in cursor.description]
        return [dict(zip(columns, row)) for row in cursor.fetchall()]


def get_public_playlists(limit: int = 50) -> List[Dict[str, Any]]:
    """Get all public playlists"""
    with get_db() as conn:
        cursor = conn.cursor()

        if USE_POSTGRES:
            cursor.execute("""
                SELECT
                    p.*,
                    u.name as user_name,
                    COUNT(ps.song_id) as song_count
                FROM playlists p
                JOIN users u ON p.user_id = u.id
                LEFT JOIN playlist_songs ps ON p.id = ps.playlist_id
                WHERE p.is_public = TRUE
                GROUP BY p.id, u.name
                ORDER BY p.updated_at DESC
                LIMIT %s
            """, (limit,))
        else:
            cursor.execute("""
                SELECT
                    p.*,
                    u.name as user_name,
                    COUNT(ps.song_id) as song_count
                FROM playlists p
                JOIN users u ON p.user_id = u.id
                LEFT JOIN playlist_songs ps ON p.id = ps.playlist_id
                WHERE p.is_public = 1
                GROUP BY p.id
                ORDER BY p.updated_at DESC
                LIMIT ?
            """, (limit,))

        columns = [desc[0] for desc in cursor.description]
        return [dict(zip(columns, row)) for row in cursor.fetchall()]


def get_playlist_by_id(playlist_id: int) -> Optional[Dict[str, Any]]:
    """Get a specific playlist"""
    with get_db() as conn:
        cursor = conn.cursor()

        if USE_POSTGRES:
            cursor.execute("""
                SELECT
                    p.*,
                    u.name as user_name,
                    COUNT(ps.song_id) as song_count
                FROM playlists p
                JOIN users u ON p.user_id = u.id
                LEFT JOIN playlist_songs ps ON p.id = ps.playlist_id
                WHERE p.id = %s
                GROUP BY p.id, u.name
            """, (playlist_id,))
        else:
            cursor.execute("""
                SELECT
                    p.*,
                    u.name as user_name,
                    COUNT(ps.song_id) as song_count
                FROM playlists p
                JOIN users u ON p.user_id = u.id
                LEFT JOIN playlist_songs ps ON p.id = ps.playlist_id
                WHERE p.id = ?
                GROUP BY p.id
            """, (playlist_id,))

        row = cursor.fetchone()
        if row:
            columns = [desc[0] for desc in cursor.description]
            return dict(zip(columns, row))
        return None


def get_playlist_songs(playlist_id: int) -> List[Dict[str, Any]]:
    """Get all songs in a playlist"""
    with get_db() as conn:
        cursor = conn.cursor()

        if USE_POSTGRES:
            cursor.execute("""
                SELECT s.*, ps.position, ps.added_at as added_to_playlist_at
                FROM songs s
                JOIN playlist_songs ps ON s.id = ps.song_id
                WHERE ps.playlist_id = %s
                ORDER BY ps.position
            """, (playlist_id,))
        else:
            cursor.execute("""
                SELECT s.*, ps.position, ps.added_at as added_to_playlist_at
                FROM songs s
                JOIN playlist_songs ps ON s.id = ps.song_id
                WHERE ps.playlist_id = ?
                ORDER BY ps.position
            """, (playlist_id,))

        columns = [desc[0] for desc in cursor.description]
        return [dict(zip(columns, row)) for row in cursor.fetchall()]


def add_song_to_playlist(playlist_id: int, song_id: str) -> bool:
    """Add a song to a playlist"""
    with get_db() as conn:
        cursor = conn.cursor()

        # Get the next position
        if USE_POSTGRES:
            cursor.execute("""
                SELECT COALESCE(MAX(position), 0) + 1
                FROM playlist_songs
                WHERE playlist_id = %s
            """, (playlist_id,))
        else:
            cursor.execute("""
                SELECT COALESCE(MAX(position), 0) + 1
                FROM playlist_songs
                WHERE playlist_id = ?
            """, (playlist_id,))

        position = cursor.fetchone()[0]

        # Add the song
        try:
            if USE_POSTGRES:
                cursor.execute("""
                    INSERT INTO playlist_songs (playlist_id, song_id, position)
                    VALUES (%s, %s, %s)
                """, (playlist_id, song_id, position))

                # Update playlist updated_at
                cursor.execute("""
                    UPDATE playlists SET updated_at = CURRENT_TIMESTAMP WHERE id = %s
                """, (playlist_id,))
            else:
                cursor.execute("""
                    INSERT INTO playlist_songs (playlist_id, song_id, position)
                    VALUES (?, ?, ?)
                """, (playlist_id, song_id, position))

                # Update playlist updated_at
                cursor.execute("""
                    UPDATE playlists SET updated_at = CURRENT_TIMESTAMP WHERE id = ?
                """, (playlist_id,))

            conn.commit()
            return True
        except Exception as e:
            print(f"[PlaylistService] Error adding song to playlist: {e}")
            return False


def remove_song_from_playlist(playlist_id: int, song_id: str) -> bool:
    """Remove a song from a playlist"""
    with get_db() as conn:
        cursor = conn.cursor()

        try:
            if USE_POSTGRES:
                cursor.execute("""
                    DELETE FROM playlist_songs
                    WHERE playlist_id = %s AND song_id = %s
                """, (playlist_id, song_id))

                # Update playlist updated_at
                cursor.execute("""
                    UPDATE playlists SET updated_at = CURRENT_TIMESTAMP WHERE id = %s
                """, (playlist_id,))
            else:
                cursor.execute("""
                    DELETE FROM playlist_songs
                    WHERE playlist_id = ? AND song_id = ?
                """, (playlist_id, song_id))

                # Update playlist updated_at
                cursor.execute("""
                    UPDATE playlists SET updated_at = CURRENT_TIMESTAMP WHERE id = ?
                """, (playlist_id,))

            conn.commit()
            return True
        except Exception as e:
            print(f"[PlaylistService] Error removing song from playlist: {e}")
            return False


def update_playlist(playlist_id: int, name: Optional[str] = None, description: Optional[str] = None, is_public: Optional[bool] = None) -> bool:
    """Update playlist details"""
    with get_db() as conn:
        cursor = conn.cursor()

        updates = []
        params = []

        if name is not None:
            updates.append("name = " + ("%s" if USE_POSTGRES else "?"))
            params.append(name)

        if description is not None:
            updates.append("description = " + ("%s" if USE_POSTGRES else "?"))
            params.append(description)

        if is_public is not None:
            updates.append("is_public = " + ("%s" if USE_POSTGRES else "?"))
            params.append(is_public if USE_POSTGRES else (1 if is_public else 0))

        if not updates:
            return False

        updates.append("updated_at = CURRENT_TIMESTAMP")
        params.append(playlist_id)

        query = f"""
            UPDATE playlists
            SET {', '.join(updates)}
            WHERE id = {'%s' if USE_POSTGRES else '?'}
        """

        cursor.execute(query, params)
        conn.commit()
        return True


def delete_playlist(playlist_id: int) -> bool:
    """Delete a playlist"""
    with get_db() as conn:
        cursor = conn.cursor()

        try:
            if USE_POSTGRES:
                cursor.execute("DELETE FROM playlists WHERE id = %s", (playlist_id,))
            else:
                cursor.execute("DELETE FROM playlists WHERE id = ?", (playlist_id,))

            conn.commit()
            return True
        except Exception as e:
            print(f"[PlaylistService] Error deleting playlist: {e}")
            return False
