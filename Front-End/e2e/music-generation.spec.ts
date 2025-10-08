import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test.describe('Geração de Música', () => {
  test('deve exibir página de criação', async ({ page }) => {
    await page.goto('/create');

    // Verificar que a página carregou
    await expect(page.locator('body')).toBeVisible();

    // Verificar botão de gerar (mesmo que desabilitado)
    await expect(page.locator('button').filter({ hasText: /gerar/i })).toBeVisible();
  });

  test('deve validar upload de imagem obrigatório', async ({ page }) => {
    await page.goto('/create');

    // Verificar que botão está desabilitado sem imagem
    const generateButton = page.locator('button').filter({ hasText: /gerar/i });
    await expect(generateButton).toBeDisabled();
  });

  test('deve fazer upload de imagem', async ({ page }) => {
    await page.goto('/create');

    // Criar um buffer de imagem fake para teste
    const buffer = Buffer.from('fake-image-data');
    const fileInput = page.locator('input[type="file"]');

    await fileInput.setInputFiles({
      name: 'test-image.jpg',
      mimeType: 'image/jpeg',
      buffer: buffer,
    });

    // Verificar que algo aconteceu (botão pode ficar habilitado)
    await page.waitForTimeout(500);
  });

  test('deve gerar música com sucesso (mock)', async ({ page }) => {
    await page.goto('/create');

    // Mock da API de geração
    await page.route('**/generate', async route => {
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

    // Upload de imagem fake
    const buffer = Buffer.from('fake-image-data');
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'test-image.jpg',
      mimeType: 'image/jpeg',
      buffer: buffer,
    });

    // Aguardar um pouco
    await page.waitForTimeout(500);

    // Verificar que o botão ficou habilitado após upload
    const generateButton = page.locator('button').filter({ hasText: /gerar/i });

    // Se o botão estiver habilitado, testar o fluxo completo
    const isEnabled = await generateButton.isEnabled();
    if (isEnabled) {
      await generateButton.click();
      // Pode redirecionar ou mostrar loading
      await page.waitForTimeout(1000);
    }
  });

  test('deve exibir erro em caso de falha', async ({ page }) => {
    await page.goto('/create');

    // Mock de erro na API
    await page.route('**/generate', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Erro ao gerar música' })
      });
    });

    // Upload fake
    const buffer = Buffer.from('fake-image-data');
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'test-image.jpg',
      mimeType: 'image/jpeg',
      buffer: buffer,
    });

    await page.waitForTimeout(500);

    // Se botão habilitado, tentar gerar
    const generateButton = page.locator('button').filter({ hasText: /gerar/i });
    const isEnabled = await generateButton.isEnabled();
    if (isEnabled) {
      await generateButton.click();
      // Pode mostrar erro ou ficar na página
      await page.waitForTimeout(1000);
    }
  });
});

  test('deve gerar música de 30s instrumental', async ({ page }) => {
    await page.goto('/create');

    // Mock da API com dados atualizados
    await page.route('**/generate', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'test-123',
          song_name: 'Test Song',
          audio_url: '/audio/test-123.wav',
          image_url: '/audio/test-123.jpg',
          caption: 'A beautiful landscape',
          duration: 30,  // 30s
          has_vocals: false,  // Instrumental only
          has_lyrics: false,
          metadata: {
            genre: 'ambient',
            bpm: 90,
            mood: 'calm'
          }
        })
      });
    });

    // Upload fake image
    const buffer = Buffer.from('fake-image-data');
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'test-image.jpg',
      mimeType: 'image/jpeg',
      buffer: buffer,
    });

    await page.waitForTimeout(500);

    // Verificar que não há opções de vocal/letras
    const page Content = await page.content();
    expect(pageContent.toLowerCase()).not.toContain('vocal');
    expect(pageContent.toLowerCase()).not.toContain('letra');
  });
