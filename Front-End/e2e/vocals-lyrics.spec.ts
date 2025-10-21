/**
 * E2E Tests for Vocals and Lyrics
 * Tests creating songs with vocals/lyrics and viewing them
 */

import { test, expect } from '@playwright/test';

test.describe('Vocals and Lyrics', () => {
  const testEmail = `vocals${Date.now()}@test.com`;
  const password = 'TestPass123!';

  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8080');
    await page.evaluate(() => localStorage.clear());

    // Register and login
    await page.goto('http://localhost:8080/auth');
    await page.click('text=Não tem conta? Registre-se');
    await page.fill('input[type="text"]', 'Vocals Test User');
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', password);
    await page.click('button:has-text("Criar Conta")');
    await page.waitForURL('**/dashboard', { timeout: 10000 });

    // Wait for dashboard to be fully loaded
    await page.waitForLoadState('networkidle');
  });

  test('should show radio buttons for music type', async ({ page }) => {
    await page.goto('http://localhost:8080/create');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Should show both options (text is inside <p> tags within buttons)
    await expect(page.locator('p.font-semibold:has-text("Instrumental")')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('p.font-semibold:has-text("Com Letra Gerada")')).toBeVisible({ timeout: 5000 });
  });

  test('should select instrumental type by default', async ({ page }) => {
    await page.goto('http://localhost:8080/create');
    await page.waitForLoadState('networkidle');

    // Instrumental should be selected by default (find button containing the <p> with text)
    const instrumentalButton = page.locator('button:has(p:has-text("Instrumental"))').first();
    await instrumentalButton.waitFor({ state: 'visible', timeout: 5000 });
    const classes = await instrumentalButton.getAttribute('class');
    expect(classes).toContain('border-primary'); // Active state
  });

  test('should switch between music types', async ({ page }) => {
    await page.goto('http://localhost:8080/create');
    await page.waitForLoadState('networkidle');

    // Click on "Com Letra Gerada" button
    const lyricsButton = page.locator('button:has(p:has-text("Com Letra Gerada"))').first();
    await lyricsButton.waitFor({ state: 'visible', timeout: 5000 });
    await lyricsButton.click();

    // Should be selected
    await page.waitForTimeout(500); // Wait for state update
    const classes = await lyricsButton.getAttribute('class');
    expect(classes).toContain('border-primary');

    // Click back to Instrumental
    const instrumentalButton = page.locator('button:has(p:has-text("Instrumental"))').first();
    await instrumentalButton.click();

    // Should be selected again
    await page.waitForTimeout(500); // Wait for state update
    const instrumentalClasses = await instrumentalButton.getAttribute('class');
    expect(instrumentalClasses).toContain('border-primary');
  });

  test('should display lyrics in Play page when song has lyrics', async ({ page }) => {
    // Mock a song with lyrics
    const mockSong = {
      id: 'song-with-lyrics-123',
      song_name: 'Song With Lyrics',
      user_name: 'Test User',
      audio_path: 'test.wav',
      image_path: 'test.jpg',
      duration: 30,
      has_vocals: true,
      has_lyrics: true,
      lyrics: 'Verse 1: This is a test song\nChorus: With amazing lyrics\nVerse 2: Created by AI',
      is_liked: false,
      created_at: new Date().toISOString()
    };

    await page.route('**/songs/song-with-lyrics-123', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockSong)
      });
    });

    await page.goto('http://localhost:8080/play/song-with-lyrics-123');

    // Should show lyrics section
    await expect(page.locator('text=Letra')).toBeVisible();
    await expect(page.locator('text=This is a test song')).toBeVisible();
    await expect(page.locator('text=With amazing lyrics')).toBeVisible();
  });

  test('should NOT display lyrics section for instrumental songs', async ({ page }) => {
    // Mock an instrumental song
    const mockSong = {
      id: 'instrumental-song-123',
      song_name: 'Instrumental Song',
      user_name: 'Test User',
      audio_path: 'test.wav',
      duration: 30,
      has_vocals: false,
      has_lyrics: false,
      lyrics: null,
      is_liked: false,
      created_at: new Date().toISOString()
    };

    await page.route('**/songs/instrumental-song-123', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockSong)
      });
    });

    await page.goto('http://localhost:8080/play/instrumental-song-123');

    // Should NOT show lyrics section
    const lyricsHeading = page.locator('h3:has-text("Letra")');
    await expect(lyricsHeading).not.toBeVisible();
  });

  test('should show 2-column layout when lyrics are present', async ({ page }) => {
    // Mock a song with lyrics
    const mockSong = {
      id: 'two-col-test-123',
      song_name: '2 Column Test',
      user_name: 'Test User',
      audio_path: 'test.wav',
      duration: 30,
      has_vocals: true,
      has_lyrics: true,
      lyrics: 'Test lyrics for layout',
      is_liked: false,
      created_at: new Date().toISOString()
    };

    await page.route('**/songs/two-col-test-123', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockSong)
      });
    });

    await page.goto('http://localhost:8080/play/two-col-test-123');

    // Check for grid layout
    const grid = page.locator('.grid.grid-cols-1.lg\\:grid-cols-2');
    await expect(grid).toBeVisible();

    // Both player and lyrics should be visible
    await expect(page.locator('text=2 Column Test')).toBeVisible();
    await expect(page.locator('text=Letra')).toBeVisible();
  });

  test('should show responsive layout on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    const mockSong = {
      id: 'mobile-test-123',
      song_name: 'Mobile Test',
      user_name: 'Test User',
      audio_path: 'test.wav',
      duration: 30,
      has_vocals: true,
      has_lyrics: true,
      lyrics: 'Mobile lyrics test',
      is_liked: false,
      created_at: new Date().toISOString()
    };

    await page.route('**/songs/mobile-test-123', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockSong)
      });
    });

    await page.goto('http://localhost:8080/play/mobile-test-123');

    // On mobile, should stack vertically
    const grid = page.locator('.grid.grid-cols-1.lg\\:grid-cols-2');
    await expect(grid).toBeVisible();

    // Both sections should still be visible
    await expect(page.locator('text=Mobile Test')).toBeVisible();
    await expect(page.locator('text=Letra')).toBeVisible();
  });
});
