import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';

// Mock fetch globally
global.fetch = vi.fn();

// Mock toast
vi.mock('@/hooks/use-toast', () => ({
  toast: vi.fn(),
}));

describe('AuthContext', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    localStorage.clear();
  });

  describe('Initial State', () => {
    it('should load user from localStorage on mount', () => {
      localStorage.setItem('wavelength_user_id', '1');
      localStorage.setItem('wavelength_user_name', 'Test User');
      localStorage.setItem('wavelength_email', 'test@example.com');

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      expect(result.current.userId).toBe(1);
      expect(result.current.userName).toBe('Test User');
      expect(result.current.email).toBe('test@example.com');
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('should start with null user if not in localStorage', () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      expect(result.current.userId).toBe(null);
      expect(result.current.userName).toBe('');
      expect(result.current.email).toBe('');
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('register', () => {
    it('should successfully register a user', async () => {
      const mockResponse = {
        user_id: 1,
        name: 'New User',
        email: 'new@example.com',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await act(async () => {
        await result.current.register('new@example.com', 'password123', 'New User');
      });

      expect(result.current.userId).toBe(1);
      expect(result.current.userName).toBe('New User');
      expect(result.current.email).toBe('new@example.com');
      expect(result.current.isAuthenticated).toBe(true);

      // Check localStorage
      expect(localStorage.getItem('wavelength_user_id')).toBe('1');
      expect(localStorage.getItem('wavelength_user_name')).toBe('New User');
      expect(localStorage.getItem('wavelength_email')).toBe('new@example.com');
    });

    it('should throw error on failed registration', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ detail: 'Email already exists' }),
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await expect(
        act(async () => {
          await result.current.register('duplicate@example.com', 'password123', 'User');
        })
      ).rejects.toThrow('Email already exists');
    });
  });

  describe('login', () => {
    it('should successfully login a user', async () => {
      const mockResponse = {
        user_id: 2,
        name: 'Login User',
        email: 'login@example.com',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await act(async () => {
        await result.current.login('login@example.com', 'password123');
      });

      expect(result.current.userId).toBe(2);
      expect(result.current.userName).toBe('Login User');
      expect(result.current.email).toBe('login@example.com');
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('should throw error on failed login', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ detail: 'Invalid credentials' }),
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await expect(
        act(async () => {
          await result.current.login('wrong@example.com', 'wrongpassword');
        })
      ).rejects.toThrow('Invalid credentials');
    });
  });

  describe('logout', () => {
    it('should clear user state and localStorage', async () => {
      // Setup authenticated user
      localStorage.setItem('wavelength_user_id', '3');
      localStorage.setItem('wavelength_user_name', 'Logout User');
      localStorage.setItem('wavelength_email', 'logout@example.com');

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      // Wait for initial load
      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
      });

      act(() => {
        result.current.logout();
      });

      expect(result.current.userId).toBe(null);
      expect(result.current.userName).toBe('');
      expect(result.current.email).toBe('');
      expect(result.current.isAuthenticated).toBe(false);

      // Check localStorage is cleared
      expect(localStorage.getItem('wavelength_user_id')).toBe(null);
      expect(localStorage.getItem('wavelength_user_name')).toBe(null);
      expect(localStorage.getItem('wavelength_email')).toBe(null);
    });
  });

  describe('isAuthenticated', () => {
    it('should return true when userId exists', () => {
      localStorage.setItem('wavelength_user_id', '4');
      localStorage.setItem('wavelength_user_name', 'Test');
      localStorage.setItem('wavelength_email', 'test@test.com');

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      expect(result.current.isAuthenticated).toBe(true);
    });

    it('should return false when userId is null', () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      expect(result.current.isAuthenticated).toBe(false);
    });
  });
});
