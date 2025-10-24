import { test, expect } from '@playwright/test';
import { loginTestUser } from './helpers/auth';

test.describe('Autenticação', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8080');
    await page.evaluate(() => localStorage.clear());
  });

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
    // First register a user
    const email = `test${Date.now()}@test.com`;
    const password = 'TestPass123!';
    const userName = 'Test User';

    await page.goto('/auth');
    await page.click('text=Não tem conta? Registre-se');
    await page.fill('input[type="text"]', userName);
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);
    await page.click('button:has-text("Criar Conta")');

    // Wait for redirect after registration
    await page.waitForURL(/\/(dashboard|create)/, { timeout: 10000 });

    // Now logout and login again to test login flow
    await page.evaluate(() => localStorage.clear());
    await page.goto('/auth');

    // Login with the same credentials
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);
    await page.locator('button[type="submit"]').first().click();

    // Verificar redirecionamento (Dashboard ou Home)
    await page.waitForURL(/\/(dashboard|create)/, { timeout: 10000 });
  });
});
