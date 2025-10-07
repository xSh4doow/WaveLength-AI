import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Create } from '@/pages/Create';
import * as apiService from '@/services/api';

// Mock the API service
vi.mock('@/services/api', () => ({
  generateMusic: vi.fn(),
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock toast
vi.mock('@/hooks/use-toast', () => ({
  toast: vi.fn(),
  useToast: () => ({ toast: vi.fn() }),
}));

describe('Create Page', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  const renderCreate = () => {
    return render(
      <BrowserRouter>
        <Create />
      </BrowserRouter>
    );
  };

  it('should render create page', () => {
    renderCreate();
    expect(screen.getByText('Criar Música')).toBeInTheDocument();
  });

  it('should render upload section', () => {
    renderCreate();
    expect(screen.getByText('Envie sua Foto')).toBeInTheDocument();
    expect(screen.getByText('Clique para enviar')).toBeInTheDocument();
  });

  it('should render form fields', () => {
    renderCreate();
    expect(screen.getByLabelText('Nome da Música')).toBeInTheDocument();
    expect(screen.getByText('Gênero Musical')).toBeInTheDocument();
    expect(screen.getByText('Tags')).toBeInTheDocument();
  });

  it('should have generate button disabled initially', () => {
    renderCreate();
    const generateButton = screen.getByRole('button', { name: /gerar música/i });
    expect(generateButton).toBeDisabled();
  });

  it('should handle image upload', async () => {
    renderCreate();

    const file = new File(['test'], 'test.png', { type: 'image/png' });
    const input = screen.getByLabelText(/clique para enviar/i).querySelector('input');

    if (input) {
      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        const generateButton = screen.getByRole('button', { name: /gerar música/i });
        expect(generateButton).not.toBeDisabled();
      });
    }
  });

  it('should update song name field', () => {
    renderCreate();
    const input = screen.getByLabelText('Nome da Música') as HTMLInputElement;

    fireEvent.change(input, { target: { value: 'Minha Música' } });
    expect(input.value).toBe('Minha Música');
  });

  it('should show generation status when generating', async () => {
    vi.mocked(apiService.generateMusic).mockImplementation(
      () => new Promise(() => {}) // Never resolves to keep loading state
    );

    renderCreate();

    const file = new File(['test'], 'test.png', { type: 'image/png' });
    const input = screen.getByLabelText(/clique para enviar/i).querySelector('input');

    if (input) {
      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        const generateButton = screen.getByRole('button', { name: /gerar música/i });
        expect(generateButton).not.toBeDisabled();
      });

      const generateButton = screen.getByRole('button', { name: /gerar música/i });
      fireEvent.click(generateButton);

      await waitFor(() => {
        expect(screen.getByText('Gerando sua música...')).toBeInTheDocument();
      });
    }
  });

  it('should navigate to player on successful generation', async () => {
    const mockResult = {
      caption: 'a beautiful sunset',
      prompt: 'tropical house',
      duration: 15,
      audio_url: '/audio/test.wav',
      engine: 'blip' as const,
      metadata: {
        genre: 'tropical house',
        bpm: 85,
        mood: 'relaxing',
      },
    };

    vi.mocked(apiService.generateMusic).mockResolvedValueOnce(mockResult);

    renderCreate();

    const file = new File(['test'], 'test.png', { type: 'image/png' });
    const input = screen.getByLabelText(/clique para enviar/i).querySelector('input');

    if (input) {
      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        const generateButton = screen.getByRole('button', { name: /gerar música/i });
        expect(generateButton).not.toBeDisabled();
      });

      const generateButton = screen.getByRole('button', { name: /gerar música/i });
      fireEvent.click(generateButton);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/player/new', expect.any(Object));
      });
    }
  });
});
