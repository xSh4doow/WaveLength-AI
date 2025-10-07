import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Index } from '@/pages/Index';

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('Index Page', () => {
  const renderIndex = () => {
    return render(
      <BrowserRouter>
        <Index />
      </BrowserRouter>
    );
  };

  it('should render index page', () => {
    renderIndex();
    expect(screen.getByText(/wavelength/i)).toBeInTheDocument();
  });

  it('should render hero section', () => {
    renderIndex();
    // Check for typical hero section elements
    const headings = screen.getAllByRole('heading');
    expect(headings.length).toBeGreaterThan(0);
  });

  it('should render footer', () => {
    renderIndex();
    // Footer should be present
    const footer = document.querySelector('footer');
    expect(footer).toBeInTheDocument();
  });
});
