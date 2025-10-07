import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Geração de Música', () => {
  test('deve exibir página de criação', async ({ page }) => {
    await page.goto('/create');

    // Verificar elementos principais
    await expect(page.locator('h1, h2').filter({ hasText: /criar|gerar|nova música/i })).toBeVisible();
    await expect(page.locator('input[type="file"]')).toBeVisible();
  });

  test('deve validar upload de imagem obrigatório', async ({ page }) => {
    await page.goto('/create');

    // Tentar gerar sem imagem
    const generateButton = page.locator('button').filter({ hasText: /gerar|criar/i });
    await generateButton.click();

    // Verificar mensagem de erro
    await expect(page.locator('text=/selecione.*imagem|envie.*foto|upload.*obrigatório/i')).toBeVisible({ timeout: 3000 });
  });

  test('deve fazer upload de imagem', async ({ page }) => {
    await page.goto('/create');

    // Upload de imagem de teste
    const fileInput = page.locator('input[type="file"]');
    const testImagePath = path.join(__dirname, '../src/assets/demo-photo.jpg');

    await fileInput.setInputFiles(testImagePath);

    // Verificar preview da imagem
    await expect(page.locator('img[alt*="preview"], img[alt*="upload"]')).toBeVisible({ timeout: 3000 });
  });

  test('deve gerar música com sucesso (mock)', async ({ page }) => {
    await page.goto('/create');

    // Mock da API de geração
    await page.route('**/api/generate', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          audio_url: '/mock-audio.mp3',
          description: 'Uma praia ao pôr do sol',
          prompt: 'peaceful beach sunset ambient music'
        })
      });
    });

    await page.route('**/api/audio/**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'audio/mpeg',
        body: Buffer.from([]) // Mock audio vazio
      });
    });

    // Upload de imagem
    const fileInput = page.locator('input[type="file"]');
    const testImagePath = path.join(__dirname, '../src/assets/demo-photo.jpg');
    await fileInput.setInputFiles(testImagePath);

    // Preencher nome da música (se houver)
    const nameInput = page.locator('input[name="songName"], input[placeholder*="nome"]');
    if (await nameInput.count() > 0) {
      await nameInput.fill('Música Teste E2E');
    }

    // Clicar em gerar
    const generateButton = page.locator('button').filter({ hasText: /gerar|criar/i });
    await generateButton.click();

    // Verificar loading
    await expect(page.locator('text=/gerando|processando|aguarde/i, [role="status"]')).toBeVisible({ timeout: 2000 });

    // Verificar redirecionamento para player
    await page.waitForURL(/\/player/, { timeout: 10000 });

    // Verificar elemento de áudio
    await expect(page.locator('audio, video')).toBeVisible({ timeout: 3000 });
  });

  test('deve exibir erro em caso de falha', async ({ page }) => {
    await page.goto('/create');

    // Mock de erro na API
    await page.route('**/api/generate', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Erro ao gerar música' })
      });
    });

    // Upload e tentativa de geração
    const fileInput = page.locator('input[type="file"]');
    const testImagePath = path.join(__dirname, '../src/assets/demo-photo.jpg');
    await fileInput.setInputFiles(testImagePath);

    const generateButton = page.locator('button').filter({ hasText: /gerar|criar/i });
    await generateButton.click();

    // Verificar mensagem de erro
    await expect(page.locator('text=/erro|falha|tente novamente/i')).toBeVisible({ timeout: 5000 });
  });
});
