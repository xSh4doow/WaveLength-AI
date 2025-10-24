import { Page } from '@playwright/test';

/**
 * Helper function to register and login a test user
 * Returns user credentials for use in tests
 */
export async function loginTestUser(page: Page, userName: string = 'Test User') {
  const email = `test${Date.now()}@test.com`;
  const password = 'TestPass123!';

  await page.goto('http://localhost:8080/auth');

  // Click on "Register" tab
  await page.click('text=Não tem conta? Registre-se');

  // Fill registration form
  await page.fill('input[type="text"]', userName);
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);

  // Submit registration
  await page.click('button:has-text("Criar Conta")');

  // Wait for redirect to dashboard
  await page.waitForURL('**/dashboard', { timeout: 15000 });

  return { email, password, userName };
}

/**
 * Login with existing credentials
 */
export async function loginExistingUser(page: Page, email: string, password: string) {
  await page.goto('http://localhost:8080/auth');

  // Fill login form
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);

  // Submit login
  await page.click('button:has-text("Entrar")');

  // Wait for redirect to dashboard
  await page.waitForURL('**/dashboard', { timeout: 15000 });
}

/**
 * Logout current user
 */
export async function logoutUser(page: Page) {
  // Look for logout button (may vary based on UI)
  const logoutButton = page.locator('button:has-text("Sair"), button[aria-label*="logout" i]');

  if (await logoutButton.count() > 0) {
    await logoutButton.first().click();
    await page.waitForURL('**/auth', { timeout: 10000 });
  }
}
