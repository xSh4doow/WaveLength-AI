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
  options: {
    userName: string;
    songName?: string;
    genre?: string;
    tags?: string;
    duration?: number;
    hasVocals?: boolean;
    hasLyrics?: boolean;
    engine?: string;
  }
): Promise<GenerateMusicResponse> {
  const formData = new FormData();
  formData.append('image', imageFile);
  formData.append('user_name', options.userName);
  if (options.songName) formData.append('song_name', options.songName);
  if (options.genre) formData.append('genre', options.genre);
  if (options.tags) formData.append('tags', options.tags);
  formData.append('duration', (options.duration || 15).toString());
  formData.append('has_vocals', (options.hasVocals || false).toString());
  formData.append('has_lyrics', (options.hasLyrics || false).toString());
  if (options.engine) formData.append('engine', options.engine);

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

/**
 * User types and authentication
 */
export interface User {
  id: number;
  name: string;
  email: string;
  created_at: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user_id: number;
  name: string;
  email: string;
}

/**
 * Register a new user
 */
export async function register(data: RegisterRequest): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }

  return await response.json();
}

/**
 * Login user
 */
export async function login(data: LoginRequest): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }

  return await response.json();
}

/**
 * Get user by ID
 */
export async function getUser(userId: number): Promise<User> {
  const response = await fetch(`${API_BASE_URL}/auth/user/${userId}`);

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Search users by name
 */
export async function searchUsers(query: string, limit: number = 20): Promise<User[]> {
  const response = await fetch(`${API_BASE_URL}/users/search?q=${encodeURIComponent(query)}&limit=${limit}`);

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Follow a user
 */
export async function followUser(userId: number, followerId: number): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`${API_BASE_URL}/users/${userId}/follow`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ follower_id: followerId }),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Unfollow a user
 */
export async function unfollowUser(userId: number, followerId: number): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`${API_BASE_URL}/users/${userId}/unfollow?follower_id=${followerId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Get list of users the current user is following
 */
export async function getFollowing(userId: number): Promise<User[]> {
  const response = await fetch(`${API_BASE_URL}/users/${userId}/following`);

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Get list of followers for a user
 */
export async function getFollowers(userId: number): Promise<User[]> {
  const response = await fetch(`${API_BASE_URL}/users/${userId}/followers`);

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Get songs from friends (users you follow)
 */
export async function getFriendsSongs(userId: number, limit: number = 100, offset: number = 0): Promise<Song[]> {
  const response = await fetch(`${API_BASE_URL}/songs/friends/${userId}?limit=${limit}&offset=${offset}`);

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return await response.json();
}
