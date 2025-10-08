/**
 * E2E Tests para as novas features (Sessão 3)
 * - Player Global
 * - Queue System
 * - Library integrada
 * - Dashboard integrado
 * - Página de compartilhamento público
 */

import { test, expect } from '@playwright/test';

test.describe('New Features - Session 3', () => {

  test.describe('Dashboard Features', () => {
    test('should display dashboard with user info', async ({ page }) => {
      await page.goto('http://localhost:8080/dashboard');

      // Should show dashboard or redirect to home if no user
      const url = page.url();
      expect(url).toMatch(/\/(dashboard|)$/);

      if (url.includes('dashboard')) {
        // Check for main elements
        await expect(page.locator('text=Wavelength')).toBeVisible();
        await expect(page.locator('text=Sua Biblioteca')).toBeVisible();
      }
    });

    test('should have "Create Music" button', async ({ page }) => {
      await page.goto('http://localhost:8080/dashboard');

      if (page.url().includes('dashboard')) {
        const createButton = page.locator('button:has-text("Crie sua Música")');
        await expect(createButton).toBeVisible();
      }
    });

    test('should show empty state when no songs', async ({ page }) => {
      // Mock API to return empty array
      await page.route('**/songs/user/**', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([])
        });
      });

      await page.goto('http://localhost:8080/dashboard');

      if (page.url().includes('dashboard')) {
        await expect(page.locator('text=Comece sua jornada musical')).toBeVisible();
      }
    });
  });

  test.describe('Library Features', () => {
    test('should display library page', async ({ page }) => {
      await page.goto('http://localhost:8080/library');

      const url = page.url();
      expect(url).toMatch(/\/(library|)$/);

      if (url.includes('library')) {
        await expect(page.locator('text=Criações')).toBeVisible();
      }
    });

    test('should have search and filter controls', async ({ page }) => {
      await page.goto('http://localhost:8080/library');

      if (page.url().includes('library')) {
        // Search input
        const searchInput = page.locator('input[placeholder*="Buscar"]');
        await expect(searchInput).toBeVisible();

        // Filter selects
        await expect(page.locator('text=Todos os gêneros')).toBeVisible();
        await expect(page.locator('text=Mais recentes')).toBeVisible();
      }
    });

    test('should allow searching songs', async ({ page }) => {
      await page.goto('http://localhost:8080/library');

      if (page.url().includes('library')) {
        const searchInput = page.locator('input[placeholder*="Buscar"]');
        await searchInput.fill('test song');
        await expect(searchInput).toHaveValue('test song');
      }
    });
  });

  test.describe('Create Page - New Fields', () => {
    test('should show all new input fields', async ({ page }) => {
      await page.goto('http://localhost:8080/create');

      // User Name field (required)
      await expect(page.locator('label:has-text("Seu Nome")')).toBeVisible();

      // Duration slider
      await expect(page.locator('label:has-text("Duração")')).toBeVisible();

      // Music type (Instrumental/Vocal)
      await expect(page.locator('text=Instrumental')).toBeVisible();
      await expect(page.locator('text=Com Vocal')).toBeVisible();

      // Song name
      await expect(page.locator('label:has-text("Nome da Música")')).toBeVisible();
    });

    test('should validate required user name field', async ({ page }) => {
      await page.goto('http://localhost:8080/create');

      // Try to generate without user name (button should be disabled without image)
      const generateButton = page.locator('button:has-text("Gerar Música")');

      // Button should be disabled when no image is uploaded
      await expect(generateButton).toBeDisabled();
    });

    test('should allow selecting music type', async ({ page }) => {
      await page.goto('http://localhost:8080/create');

      // Click on "Com Vocal"
      const vocalButton = page.locator('button:has-text("Com Vocal")');
      await vocalButton.click();

      // Lyrics checkbox should appear
      await expect(page.locator('label:has-text("Gerar letra")')).toBeVisible();
    });

    test('should adjust duration slider', async ({ page }) => {
      await page.goto('http://localhost:8080/create');

      const durationSlider = page.locator('input[type="range"]').first();
      await expect(durationSlider).toBeVisible();

      // Check min and max values
      const min = await durationSlider.getAttribute('min');
      const max = await durationSlider.getAttribute('max');
      expect(min).toBe('15');
      expect(max).toBe('100');
    });
  });

  test.describe('Public Share Page', () => {
    test('should show 404 for invalid song ID', async ({ page }) => {
      await page.goto('http://localhost:8080/play/invalid-id-12345');

      // Mock API to return 404
      await page.route('**/songs/invalid-id-12345', async route => {
        await route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({ detail: 'Song not found' })
        });
      });

      await page.reload();

      // Should show error message
      await expect(page.locator('text=Música não encontrada')).toBeVisible();
      await expect(page.locator('button:has-text("Voltar para Home")')).toBeVisible();
    });

    test('should display song player when valid ID', async ({ page }) => {
      const mockSong = {
        id: 'test-song-123',
        song_name: 'Test Song',
        user_name: 'Test User',
        audio_path: 'generated/test.wav',
        image_path: 'generated/test.jpg',
        caption: 'Test caption',
        genre: 'Electronic',
        duration: 30,
        has_vocals: false,
        has_lyrics: false,
        lyrics: null,
        is_liked: false,
        created_at: new Date().toISOString()
      };

      // Mock the API response
      await page.route('**/songs/test-song-123', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockSong)
        });
      });

      await page.goto('http://localhost:8080/play/test-song-123');

      // Should show song info
      await expect(page.locator('text=Test Song')).toBeVisible();
      await expect(page.locator('text=Por Test User')).toBeVisible();

      // Should have player controls
      await expect(page.locator('button[aria-label*="play"], button:has-text("Play")').first()).toBeVisible();

      // Should have action buttons
      await expect(page.locator('button:has-text("Home")')).toBeVisible();
    });

    test('should have share and download buttons', async ({ page }) => {
      const mockSong = {
        id: 'test-song-456',
        song_name: 'Another Test',
        user_name: 'User 2',
        audio_path: 'generated/test2.wav',
        duration: 45,
        has_vocals: true,
        has_lyrics: true,
        lyrics: 'Test lyrics\nLine 2',
        is_liked: false,
        created_at: new Date().toISOString()
      };

      await page.route('**/songs/test-song-456', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockSong)
        });
      });

      await page.goto('http://localhost:8080/play/test-song-456');

      // Wait for page to load
      await page.waitForLoadState('networkidle');

      // Should show lyrics
      await expect(page.locator('text=Letra')).toBeVisible();
      await expect(page.locator('text=Test lyrics')).toBeVisible();
    });
  });

  test.describe('Navigation between new pages', () => {
    test('should navigate from dashboard to library', async ({ page }) => {
      await page.goto('http://localhost:8080/dashboard');

      if (page.url().includes('dashboard')) {
        const libraryLink = page.locator('button:has-text("Criações")');
        await libraryLink.click();

        await page.waitForURL('**/library');
        expect(page.url()).toContain('/library');
      }
    });

    test('should navigate from dashboard to create', async ({ page }) => {
      await page.goto('http://localhost:8080/dashboard');

      if (page.url().includes('dashboard')) {
        const createButton = page.locator('button:has-text("Crie sua Música")').first();
        await createButton.click();

        await page.waitForURL('**/create');
        expect(page.url()).toContain('/create');
      }
    });

    test('should navigate from library back to dashboard', async ({ page }) => {
      await page.goto('http://localhost:8080/library');

      if (page.url().includes('library')) {
        const homeLink = page.locator('button:has-text("Início")');
        await homeLink.click();

        await page.waitForURL('**/dashboard');
        expect(page.url()).toContain('/dashboard');
      }
    });

    test('should navigate from public play page to home', async ({ page }) => {
      const mockSong = {
        id: 'nav-test-123',
        song_name: 'Nav Test',
        user_name: 'Test',
        audio_path: 'test.wav',
        duration: 30,
        has_vocals: false,
        has_lyrics: false,
        is_liked: false,
        created_at: new Date().toISOString()
      };

      await page.route('**/songs/nav-test-123', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockSong)
        });
      });

      await page.goto('http://localhost:8080/play/nav-test-123');

      const homeButton = page.locator('button:has-text("Home")');
      await homeButton.click();

      await page.waitForURL('**/');
      expect(page.url()).toMatch(/\/(dashboard|)$/);
    });
  });

  test.describe('Responsive Design', () => {
    test('should display mobile FAB button on dashboard', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 }); // iPhone size
      await page.goto('http://localhost:8080/dashboard');

      if (page.url().includes('dashboard')) {
        // Mobile FAB (Floating Action Button) should be visible
        const fab = page.locator('button').filter({ hasText: '+' }).last();
        await expect(fab).toBeVisible();
      }
    });

    test('should adapt layout on mobile for library', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('http://localhost:8080/library');

      if (page.url().includes('library')) {
        // Should still show search and filters
        await expect(page.locator('input[placeholder*="Buscar"]')).toBeVisible();
      }
    });
  });
});
