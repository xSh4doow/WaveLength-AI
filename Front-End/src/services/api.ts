/**
 * API service for WaveLength backend integration
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface GenerateMusicResponse {
  caption: string;
  prompt: string;
  duration: number;
  audio_url: string;
  engine: 'blip' | 'mock';
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
 * Get full audio URL
 */
export function getAudioUrl(audioPath: string): string {
  // If audioPath starts with /, remove it to avoid double slash
  const cleanPath = audioPath.startsWith('/') ? audioPath.substring(1) : audioPath;
  return `${API_BASE_URL}/${cleanPath}`;
}
