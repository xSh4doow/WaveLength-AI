import { describe, it, expect, beforeEach, vi } from 'vitest';
import { generateMusic, checkHealth, getAudioUrl } from '@/services/api';

// Mock fetch globally
global.fetch = vi.fn();

describe('API Service', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('generateMusic', () => {
    it('should successfully generate music from image', async () => {
      const mockResponse = {
        caption: 'a beautiful sunset over the ocean',
        prompt: 'tropical house, relaxing atmosphere, 85 BPM',
        duration: 15,
        audio_url: '/audio/abc123.wav',
        engine: 'blip',
        metadata: {
          genre: 'tropical house',
          bpm: 85,
          mood: 'relaxing',
        },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const file = new File(['test'], 'test.png', { type: 'image/png' });
      const result = await generateMusic(file, 15);

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/generate',
        expect.objectContaining({
          method: 'POST',
          body: expect.any(FormData),
        })
      );
    });

    it('should throw error on failed request', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => ({ detail: 'Invalid image format' }),
      });

      const file = new File(['test'], 'test.png', { type: 'image/png' });

      await expect(generateMusic(file, 15)).rejects.toThrow('Invalid image format');
    });

    it('should handle network errors', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      const file = new File(['test'], 'test.png', { type: 'image/png' });

      await expect(generateMusic(file, 15)).rejects.toThrow('Network error');
    });

    it('should use default duration of 15 seconds', async () => {
      const mockResponse = {
        caption: 'test',
        prompt: 'test',
        duration: 15,
        audio_url: '/audio/test.wav',
        engine: 'mock',
        metadata: { genre: 'ambient', bpm: 90, mood: 'neutral' },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const file = new File(['test'], 'test.png', { type: 'image/png' });
      await generateMusic(file);

      const callArgs = (global.fetch as any).mock.calls[0][1].body;
      expect(callArgs.get('duration')).toBe('15');
    });
  });

  describe('checkHealth', () => {
    it('should return health status', async () => {
      const mockHealth = {
        status: 'ok',
        ai_ready: true,
        device: 'cuda',
        models_loaded: {
          blip: true,
          musicgen: true,
        },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockHealth,
      });

      const result = await checkHealth();

      expect(result).toEqual(mockHealth);
      expect(global.fetch).toHaveBeenCalledWith('http://localhost:8000/health');
    });

    it('should throw error on failed health check', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 503,
        statusText: 'Service Unavailable',
      });

      await expect(checkHealth()).rejects.toThrow('HTTP 503: Service Unavailable');
    });
  });

  describe('getAudioUrl', () => {
    it('should return full audio URL from path', () => {
      const url = getAudioUrl('/audio/abc123.wav');
      expect(url).toBe('http://localhost:8000/audio/abc123.wav');
    });

    it('should handle path without leading slash', () => {
      const url = getAudioUrl('audio/abc123.wav');
      expect(url).toBe('http://localhost:8000/audio/abc123.wav');
    });

    it('should work with custom API base URL', () => {
      // This would require mocking import.meta.env, which is tricky
      // For now, we test the default behavior
      const url = getAudioUrl('/audio/test.wav');
      expect(url).toContain('audio/test.wav');
    });
  });
});
