/**
 * API service for WaveLength backend integration
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface GenerateMusicResponse {
  id: string;
  song_name: string;
  caption: string;
  prompt: string;
  duration: number;
  audio_url: string;
  image_url: string;
  engine: 'blip' | 'mock';
  has_vocals: boolean;
  has_lyrics: boolean;
  lyrics: string | null;
  metadata: {
    genre: string;
    bpm: number;
    mood: string;
  };
}

export interface HealthResponse {
  status: string;
  ai_ready: boolean;
  device: string;
  models_loaded: {
    blip: boolean;
    musicgen: boolean;
  };
}

export interface Song {
  id: string;
  song_name: string;
  user_name: string;
  image_path?: string | null;
  audio_path: string;
  caption?: string | null;
  genre?: string | null;
  tags?: string | null;
  duration: number;
  has_vocals: boolean;
  has_lyrics: boolean;
  lyrics?: string | null;
  is_liked: boolean;
  created_at: string;
}

/**
 * Generate music from an image
 */
export async function generateMusic(
  imageFile: File,
  duration: number = 15
): Promise<GenerateMusicResponse> {
  const formData = new FormData();
  formData.append('image', imageFile);
  formData.append('duration', duration.toString());

  const response = await fetch(`${API_BASE_URL}/generate`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(error.detail || `HTTP ${response.status}: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Check backend health and AI readiness
 */
export async function checkHealth(): Promise<HealthResponse> {
  const response = await fetch(`${API_BASE_URL}/health`);

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Get all songs with pagination
 */
export async function getSongs(limit: number = 100, offset: number = 0): Promise<Song[]> {
  const response = await fetch(`${API_BASE_URL}/songs?limit=${limit}&offset=${offset}`);

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Get songs by user
 */
export async function getSongsByUser(userName: string, limit: number = 100, offset: number = 0): Promise<Song[]> {
  const response = await fetch(`${API_BASE_URL}/songs/user/${encodeURIComponent(userName)}?limit=${limit}&offset=${offset}`);

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Get a specific song by ID
 */
export async function getSong(songId: string): Promise<Song> {
  const response = await fetch(`${API_BASE_URL}/songs/${songId}`);

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Toggle like on a song
 */
export async function toggleLike(songId: string, isLiked: boolean): Promise<{ success: boolean; is_liked: boolean }> {
  const response = await fetch(`${API_BASE_URL}/songs/${songId}/like?is_liked=${isLiked}`, {
    method: 'PUT',
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Delete a song
 */
export async function deleteSong(songId: string): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`${API_BASE_URL}/songs/${songId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Search songs
 */
export async function searchSongs(query: string, limit: number = 50): Promise<Song[]> {
  const response = await fetch(`${API_BASE_URL}/songs/search/query?q=${encodeURIComponent(query)}&limit=${limit}`);

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Get full audio URL
 */
export function getAudioUrl(audioPath: string): string {
  // If audioPath starts with /, remove it to avoid double slash
  const cleanPath = audioPath.startsWith('/') ? audioPath.substring(1) : audioPath;
  return `${API_BASE_URL}/${cleanPath}`;
}
