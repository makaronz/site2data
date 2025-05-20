import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import LandingPage from '../views/LandingPage';
import * as reactRouterDom from 'react-router-dom';

// Mock the API service
vi.mock('../api/landingPageApi', () => ({
  validateOpenAIKey: vi.fn(),
  uploadScript: vi.fn(),
}));

// Mock the navigate function
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('LandingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  test('renders the landing page with API key input step', () => {
    render(
      <reactRouterDom.MemoryRouter>
        <LandingPage />
      </reactRouterDom.MemoryRouter>
    );

    // Check for header and step indicator
    expect(screen.getByText('ai_CineHub')).toBeInTheDocument();
    expect(screen.getByText('Enter OpenAI API Key')).toBeInTheDocument();
    
    // Check for API key input field
    expect(screen.getByLabelText('OpenAI API Key')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /continue/i })).toBeInTheDocument();
  });
});
