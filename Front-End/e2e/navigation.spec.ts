import { test, expect } from '@playwright/test';

test.describe('Navegação', () => {
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
    await page.goto('/');

    const dashboardLink = page.locator('a').filter({ hasText: /dashboard|painel/i });

    if (await dashboardLink.count() > 0) {
      await dashboardLink.first().click();
      await expect(page).toHaveURL(/\/dashboard/);
    } else {
      // Acesso direto se não houver link
      await page.goto('/dashboard');
      await expect(page).toHaveURL(/\/dashboard/);
    }
  });

  test('deve navegar para biblioteca', async ({ page }) => {
    await page.goto('/');

    const libraryLink = page.locator('a').filter({ hasText: /biblioteca|library|músicas/i });

    if (await libraryLink.count() > 0) {
      await libraryLink.first().click();
      await expect(page).toHaveURL(/\/library/);
    } else {
      await page.goto('/library');
      await expect(page).toHaveURL(/\/library/);
    }
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
    await page.goto('/');

    // Verificar presença de header/nav
    const nav = page.locator('header, nav').first();
    await expect(nav).toBeVisible();

    // Navegar para outra página
    await page.goto('/create');

    // Header deve continuar presente
    await expect(nav).toBeVisible();
  });
});
