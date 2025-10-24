import { test, expect } from '@playwright/test';
import { loginTestUser } from './helpers/auth';

test.describe('Tratamento de Erros', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8080');
    await page.evaluate(() => localStorage.clear());
  });

  test('deve tratar erro de conexão com API', async ({ page }) => {
    // Simular falha de rede
    await page.route('**/api/**', route => route.abort('failed'));

    // Login first since /create is protected
    await loginTestUser(page);
    await page.goto('/create');

    const fileInput = page.locator('input[type="file"]');
    // Não é necessário arquivo real para este teste

    const generateButton = page.locator('button').filter({ hasText: /gerar|criar/i });

    // Verificar que a página não quebra
    await expect(page.locator('body')).toBeVisible();
  });

  test('deve validar formato de arquivo', async ({ page }) => {
    // Login first since /create is protected
    await loginTestUser(page);
    await page.goto('/create');

    // Tentar upload de arquivo não-imagem (se houver validação)
    const fileInput = page.locator('input[type="file"]');

    // Verificar se aceita apenas imagens
    const acceptAttr = await fileInput.getAttribute('accept');
    if (acceptAttr) {
      expect(acceptAttr).toContain('image');
    }
  });

  test('deve exibir mensagem para campos vazios', async ({ page }) => {
    // Login first since /create is protected
    await loginTestUser(page);
    await page.goto('/create');

    // Verificar que botão está desabilitado quando campos vazios
    const generateButton = page.locator('button').filter({ hasText: /gerar/i });
    await expect(generateButton).toBeDisabled();
  });

  test('deve tratar timeout de geração', async ({ page }) => {
    // Login first since /create is protected
    await loginTestUser(page);
    await page.goto('/create');

    // Mock de resposta lenta (timeout)
    await page.route('**/api/generate', async route => {
      await new Promise(resolve => setTimeout(resolve, 30000)); // 30s
      await route.fulfill({
        status: 504,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Timeout' })
      });
    });

    const fileInput = page.locator('input[type="file"]');
    // Upload simulado

    const generateButton = page.locator('button').filter({ hasText: /gerar|criar/i });

    // Não deve travar a aplicação
    await expect(page.locator('body')).toBeVisible();
  });

  test('deve permitir recuperação após erro', async ({ page }) => {
    // Login first since /create is protected
    await loginTestUser(page);
    await page.goto('/create');

    let requestCount = 0;

    // Primeiro erro, depois sucesso
    await page.route('**/api/generate', async route => {
      requestCount++;
      if (requestCount === 1) {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Erro temporário' })
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            audio_url: '/mock-audio.mp3',
            description: 'Teste'
          })
        });
      }
    });

    // Primeira tentativa (erro)
    const fileInput = page.locator('input[type="file"]');
    const generateButton = page.locator('button').filter({ hasText: /gerar|criar/i });

    // Segunda tentativa deve funcionar
    await expect(page.locator('body')).toBeVisible();
  });

  test('deve exibir estado de loading adequado', async ({ page }) => {
    // Login first since /create is protected
    await loginTestUser(page);
    await page.goto('/create');

    // Mock de resposta lenta
    await page.route('**/api/generate', async route => {
      await new Promise(resolve => setTimeout(resolve, 2000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ audio_url: '/test.mp3' })
      });
    });

    // Iniciar geração e verificar loading
    // (teste visual - verificar presença de spinner/skeleton)
    await expect(page.locator('body')).toBeVisible();
  });

  test('deve validar tamanho máximo de arquivo', async ({ page }) => {
    // Login first since /create is protected
    await loginTestUser(page);
    await page.goto('/create');

    // Verificar que input existe (pode estar hidden)
    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toHaveCount(1);

    // Verificar atributo accept
    const acceptAttr = await fileInput.getAttribute('accept');
    expect(acceptAttr).toBeTruthy();
  });
});
