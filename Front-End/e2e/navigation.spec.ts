import { test, expect } from '@playwright/test';
import { loginTestUser } from './helpers/auth';

test.describe('Navegação', () => {
  // Clear localStorage before each test to ensure clean state
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8080');
    await page.evaluate(() => localStorage.clear());
  });

  test('deve carregar página inicial', async ({ page }) => {
    await page.goto('/');

    // Verificar elementos da home
    await expect(page.locator('h1').first()).toBeVisible();
    await expect(page.locator('text=/wavelength|música|imagem/i').first()).toBeVisible();
  });

  test('deve navegar para página de criação', async ({ page }) => {
    await page.goto('/');

    // Procurar link/botão para criar
    const createLink = page.locator('a, button').filter({ hasText: /criar|começar|gerar/i }).first();
    await createLink.click();

    // Pode redirecionar para /create ou /auth (se requer autenticação)
    await page.waitForTimeout(1000);

    // Verificar que navegou para algum lugar
    const url = page.url();
    expect(url).toMatch(/\/(create|auth)/);
  });

  test('deve navegar para dashboard', async ({ page }) => {
    // Login first since dashboard is a protected route
    await loginTestUser(page);

    // Should already be on dashboard after login
    await expect(page).toHaveURL(/\/dashboard/);

    // Verify dashboard elements
    await expect(page.locator('text=Wavelength')).toBeVisible();
  });

  test('deve navegar para biblioteca', async ({ page }) => {
    // Login first since library is a protected route
    await loginTestUser(page);

    // Navigate to library from dashboard
    const libraryLink = page.locator('button:has-text("Criações")').first();
    await libraryLink.click();

    // Verify navigation
    await expect(page).toHaveURL(/\/library/);
    // Verify library page loaded - check for search input which is unique to library
    await expect(page.locator('input[placeholder*="Buscar"]')).toBeVisible();
  });

  test('deve exibir 404 para rotas inexistentes', async ({ page }) => {
    await page.goto('/rota-que-nao-existe-12345');

    // Verificar página 404 (pegar o primeiro elemento que corresponde)
    await expect(page.locator('text=/404|não encontrada|not found/i').first()).toBeVisible();
  });

  test('deve ter navegação responsiva (mobile)', async ({ page }) => {
    // Configurar viewport mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Verificar menu hamburger em mobile
    const menuButton = page.locator('button[aria-label*="menu"], button[aria-expanded]');

    if (await menuButton.count() > 0) {
      await menuButton.first().click();

      // Verificar menu aberto
      await expect(page.locator('nav, [role="navigation"]')).toBeVisible();
    }
  });

  test('deve manter navegação consistente entre páginas', async ({ page }) => {
    // Login first
    await loginTestUser(page);

    // Verificar presença de header/nav no dashboard
    const nav = page.locator('header, nav').first();
    await expect(nav).toBeVisible();

    // Navegar para outra página protegida
    await page.click('button:has-text("Criações")');
    await page.waitForURL('**/library');

    // Header deve continuar presente
    await expect(nav).toBeVisible();
  });
});
