/**
 * E2E Tests for Authentication Flow
 * Tests register, login, logout, and protected routes
 */

import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  const testEmail = `test${Date.now()}@example.com`;
  const testPassword = 'TestPassword123!';
  const testName = 'Test User';

  test.beforeEach(async ({ page }) => {
    // Clear local storage before each test
    await page.goto('http://localhost:8080');
    await page.evaluate(() => localStorage.clear());
  });

  test('should register a new user successfully', async ({ page }) => {
    await page.goto('http://localhost:8080/auth');

    // Click on register toggle
    await page.click('text=Não tem conta? Registre-se');

    // Fill registration form
    await page.fill('input[type="text"]', testName);
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);

    // Submit form
    await page.click('button:has-text("Criar Conta")');

    // Should redirect to dashboard
    await page.waitForURL('**/dashboard');
    expect(page.url()).toContain('/dashboard');

    // Should show user name in dashboard
    await expect(page.locator(`text=${testName}`)).toBeVisible();
  });

  test('should login with existing credentials', async ({ page }) => {
    // First, register a user
    await page.goto('http://localhost:8080/auth');
    await page.click('text=Não tem conta? Registre-se');
    await page.fill('input[type="text"]', testName);
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.click('button:has-text("Criar Conta")');
    await page.waitForURL('**/dashboard');

    // Logout
    await page.click('text=Sair');
    await page.waitForURL('**/auth');

    // Now login
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.click('button:has-text("Entrar")');

    // Should redirect to dashboard
    await page.waitForURL('**/dashboard');
    expect(page.url()).toContain('/dashboard');
  });

  test('should show error on invalid login', async ({ page }) => {
    await page.goto('http://localhost:8080/auth');

    // Try to login with non-existent credentials
    await page.fill('input[type="email"]', 'nonexistent@example.com');
    await page.fill('input[type="password"]', 'WrongPassword123!');
    await page.click('button:has-text("Entrar")');

    // Should show error toast
    await expect(page.locator('text=Erro ao fazer login')).toBeVisible({ timeout: 3000 });
  });

  test('should protect routes when not authenticated', async ({ page }) => {
    // Try to access protected route directly
    await page.goto('http://localhost:8080/dashboard');

    // Should redirect to /auth
    await page.waitForURL('**/auth');
    expect(page.url()).toContain('/auth');
  });

  test('should persist authentication after page reload', async ({ page }) => {
    // Register and login
    await page.goto('http://localhost:8080/auth');
    await page.click('text=Não tem conta? Registre-se');
    await page.fill('input[type="text"]', testName);
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.click('button:has-text("Criar Conta")');
    await page.waitForURL('**/dashboard');

    // Reload page
    await page.reload();

    // Should still be on dashboard (authenticated)
    expect(page.url()).toContain('/dashboard');
    await expect(page.locator(`text=${testName}`)).toBeVisible();
  });

  test('should logout and redirect to auth', async ({ page }) => {
    // Register and login first
    await page.goto('http://localhost:8080/auth');
    await page.click('text=Não tem conta? Registre-se');
    await page.fill('input[type="text"]', testName);
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.click('button:has-text("Criar Conta")');
    await page.waitForURL('**/dashboard');

    // Click logout
    await page.click('text=Sair');

    // Should redirect to /auth
    await page.waitForURL('**/auth');
    expect(page.url()).toContain('/auth');

    // Try to access dashboard again
    await page.goto('http://localhost:8080/dashboard');

    // Should be redirected back to auth
    await page.waitForURL('**/auth');
  });

  test('should allow access to public play page without auth', async ({ page }) => {
    // Mock song API
    await page.route('**/songs/*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'test-123',
          song_name: 'Public Song',
          user_name: 'Test',
          audio_path: 'test.wav',
          duration: 30,
          has_vocals: false,
          has_lyrics: false,
          is_liked: false,
          created_at: new Date().toISOString()
        })
      });
    });

    // Access public play page without authentication
    await page.goto('http://localhost:8080/play/test-123');

    // Should NOT redirect to auth
    expect(page.url()).toContain('/play/test-123');
    await expect(page.locator('text=Public Song')).toBeVisible();
  });
});
