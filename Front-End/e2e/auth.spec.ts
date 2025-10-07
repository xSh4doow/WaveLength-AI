import { test, expect } from '@playwright/test';

test.describe('Autenticação', () => {
  test('deve exibir página de login/registro', async ({ page }) => {
    await page.goto('/auth');

    // Verificar elementos da página
    await expect(page.locator('body')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('deve alternar entre login e registro', async ({ page }) => {
    await page.goto('/auth');

    // Procurar botão de alternar
    const toggleButton = page.locator('button, a').filter({ hasText: /criar conta|registrar|sign up/i });

    if (await toggleButton.count() > 0) {
      await toggleButton.first().click();
      await expect(page.locator('input[name="name"], input[name="username"]')).toBeVisible();
    }
  });

  test('deve validar campos obrigatórios', async ({ page }) => {
    await page.goto('/auth');

    // Tentar submeter sem preencher
    const submitButton = page.locator('button[type="submit"]').first();
    await submitButton.click();

    // Verificar mensagens de validação (HTML5 ou custom)
    const emailInput = page.locator('input[type="email"]');
    const isInvalid = await emailInput.evaluate((el: HTMLInputElement) => !el.validity.valid);

    expect(isInvalid).toBe(true);
  });

  test('deve redirecionar após login bem-sucedido', async ({ page }) => {
    await page.goto('/auth');

    // Preencher formulário (mock)
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');

    // Mock da resposta da API
    await page.route('**/api/auth/**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ token: 'mock-token', user: { email: 'test@example.com' } })
      });
    });

    await page.locator('button[type="submit"]').first().click();

    // Verificar redirecionamento (Dashboard ou Home)
    await page.waitForURL(/\/(dashboard|create|$)/, { timeout: 5000 });
  });
});
