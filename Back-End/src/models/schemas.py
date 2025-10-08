"""
Pydantic schemas for request/response validation
"""

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class SongCreate(BaseModel):
    """Schema for creating a new song."""
    user_name: str = Field(..., min_length=1, max_length=100)
    song_name: str = Field(..., min_length=1, max_length=200)
    image_path: Optional[str] = None
    audio_path: str
    caption: Optional[str] = None
    genre: Optional[str] = None
    tags: Optional[str] = None
    duration: int = Field(..., ge=15, le=100)
    has_vocals: bool = False
    has_lyrics: bool = False
    lyrics: Optional[str] = None


class SongResponse(BaseModel):
    """Schema for song response."""
    id: str
    user_name: str
    song_name: str
    image_path: Optional[str] = None
    audio_path: str
    caption: Optional[str] = None
    genre: Optional[str] = None
    tags: Optional[str] = None
    duration: int
    has_vocals: bool
    has_lyrics: bool
    lyrics: Optional[str] = None
    is_liked: bool
    created_at: str

    class Config:
        from_attributes = True


class SongUpdate(BaseModel):
    """Schema for updating a song."""
    song_name: Optional[str] = Field(None, min_length=1, max_length=200)
    genre: Optional[str] = None
    tags: Optional[str] = None
    is_liked: Optional[bool] = None


class GenerateMusicRequest(BaseModel):
    """Schema for music generation request."""
    user_name: str = Field(..., min_length=1, max_length=100)
    song_name: Optional[str] = Field(None, max_length=200)
    genre: Optional[str] = None
    tags: Optional[str] = None
    duration: int = Field(default=30, ge=15, le=100)
    has_vocals: bool = False
    has_lyrics: bool = False
