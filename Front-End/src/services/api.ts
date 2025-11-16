/**
 * API service for WaveLength backend integration
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Export API_URL for use in hooks
export const API_URL = API_BASE_URL;

// DIAGNOSTIC: Log API base URL on load
console.log('[API] Base URL configured:', API_BASE_URL);
console.log('[API] VITE_API_URL from env:', import.meta.env.VITE_API_URL);

export interface GenerateMusicResponse {
  song_id: string;
  task_id: string | null;
  status: "PENDING" | "SUCCESS";
  message: string;
  engine: 'suno' | 'mock';
  error?: string;
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
  image_paths?: string | null;  // JSON string array of all image paths
  image_captions?: string | null;  // JSON string array of captions for each image
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
 * Generate music from one or multiple images
 */
export async function generateMusic(
  imageFiles: File | File[],
  options: {
    userName: string;
    songName?: string;
    genre?: string;
    tags?: string;
    duration?: number;
    hasVocals?: boolean;
    hasLyrics?: boolean;
    includeTitleInLyrics?: boolean;
    language?: string;
    engine?: string;
  }
): Promise<GenerateMusicResponse> {
  const formData = new FormData();

  // Support both single file and array of files
  const files = Array.isArray(imageFiles) ? imageFiles : [imageFiles];
  files.forEach((file) => {
    formData.append('images', file);
  });

  formData.append('user_name', options.userName);
  if (options.songName) formData.append('song_name', options.songName);
  if (options.genre) formData.append('genre', options.genre);
  if (options.tags) formData.append('tags', options.tags);
  formData.append('duration', (options.duration || 15).toString());
  formData.append('has_vocals', (options.hasVocals || false).toString());
  formData.append('has_lyrics', (options.hasLyrics || false).toString());
  formData.append('include_title_in_lyrics', (options.includeTitleInLyrics !== undefined ? options.includeTitleInLyrics : true).toString());
  formData.append('language', options.language || 'en');  // Default to English
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
  // If it's already an absolute URL (from SunoAPI), return as-is
  if (audioPath.startsWith('http://') || audioPath.startsWith('https://')) {
    return audioPath;
  }

  // If audioPath starts with /, remove it to avoid double slash
  const cleanPath = audioPath.startsWith('/') ? audioPath.substring(1) : audioPath;
  return `${API_BASE_URL}/${cleanPath}`;
}

/**
 * Parse image_paths from JSON string to array
 * Falls back to single image_path if not available
 */
export interface ImageCaption {
  index: number;
  caption: string;
  moods?: string[];
}

export function parseImagePaths(song: Song): string[] {
  console.log('[parseImagePaths] Input song:', {
    id: song.id,
    song_name: song.song_name,
    image_path: song.image_path,
    image_paths: song.image_paths,
    image_paths_type: typeof song.image_paths,
  });

  try {
    // If image_paths exists, parse it
    if (song.image_paths) {
      const paths = JSON.parse(song.image_paths);
      console.log('[parseImagePaths] Parsed paths:', paths);
      if (Array.isArray(paths) && paths.length > 0) {
        console.log('[parseImagePaths] Returning parsed array:', paths);
        return paths;
      }
    }
  } catch (e) {
    console.warn('[parseImagePaths] Failed to parse image_paths:', e, 'Raw value:', song.image_paths);
  }

  // Fallback to single image_path
  if (song.image_path) {
    console.log('[parseImagePaths] Using fallback image_path:', song.image_path);
    return [song.image_path];
  }

  console.log('[parseImagePaths] No images found, returning empty array');
  return [];
}

export function parseImageCaptions(song: Song): ImageCaption[] {
  console.log('[parseImageCaptions] Input song:', {
    id: song.id,
    song_name: song.song_name,
    image_captions: song.image_captions,
    image_captions_type: typeof song.image_captions,
  });

  try {
    // If image_captions exists, parse it
    if (song.image_captions) {
      const captions = JSON.parse(song.image_captions);
      console.log('[parseImageCaptions] Parsed captions:', captions);
      if (Array.isArray(captions) && captions.length > 0) {
        console.log('[parseImageCaptions] Returning parsed array:', captions);
        return captions;
      }
    }
  } catch (e) {
    console.warn('[parseImageCaptions] Failed to parse image_captions:', e, 'Raw value:', song.image_captions);
  }

  console.log('[parseImageCaptions] No captions found, returning empty array');
  return [];
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

/**
 * Playlist types
 */
export interface Playlist {
  id: number;
  user_id: number;
  name: string;
  description?: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  song_count?: number;
  user_name?: string;
}

export interface CreatePlaylistRequest {
  user_id: number;
  name: string;
  description?: string;
  is_public: boolean;
}

export interface UpdatePlaylistRequest {
  name?: string;
  description?: string;
  is_public?: boolean;
}

/**
 * Create a new playlist
 */
export async function createPlaylist(data: CreatePlaylistRequest): Promise<{ playlist_id: number; success: boolean }> {
  const response = await fetch(`${API_BASE_URL}/playlists`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Get user's playlists
 */
export async function getUserPlaylists(userId: number): Promise<Playlist[]> {
  const response = await fetch(`${API_BASE_URL}/playlists/user/${userId}`);

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Get public playlists
 */
export async function getPublicPlaylists(limit: number = 50): Promise<Playlist[]> {
  const response = await fetch(`${API_BASE_URL}/playlists/public?limit=${limit}`);

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Get a specific playlist
 */
export async function getPlaylist(playlistId: number): Promise<Playlist> {
  const response = await fetch(`${API_BASE_URL}/playlists/${playlistId}`);

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Get songs in a playlist
 */
export async function getPlaylistSongs(playlistId: number): Promise<Song[]> {
  const response = await fetch(`${API_BASE_URL}/playlists/${playlistId}/songs`);

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Add song to playlist
 */
export async function addSongToPlaylist(playlistId: number, songId: string): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`${API_BASE_URL}/playlists/${playlistId}/songs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ song_id: songId }),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Remove song from playlist
 */
export async function removeSongFromPlaylist(playlistId: number, songId: string): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`${API_BASE_URL}/playlists/${playlistId}/songs/${songId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Update playlist
 */
export async function updatePlaylist(playlistId: number, data: UpdatePlaylistRequest): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`${API_BASE_URL}/playlists/${playlistId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Delete playlist
 */
export async function deletePlaylist(playlistId: number): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`${API_BASE_URL}/playlists/${playlistId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Task status response from SunoAPI polling
 */
export interface TaskStatusResponse {
  status: "PENDING" | "GENERATING" | "SUCCESS" | "FAILED";
  song_id: string;
  song?: Song;
  error?: string;
  message?: string;
}

/**
 * Check SunoAPI task status
 *
 * @param taskId - SunoAPI task ID
 * @returns Task status and song data when complete
 */
export async function checkTaskStatus(taskId: string): Promise<TaskStatusResponse> {
  const response = await fetch(`${API_BASE_URL}/generate/status/${taskId}`);

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return await response.json();
}
