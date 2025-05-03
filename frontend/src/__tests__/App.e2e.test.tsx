import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import App from '../App';
import { Cache } from '../utils/cache';

// Mock WebSocket
class MockWebSocket {
  onopen: (() => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;
  onerror: ((error: Error) => void) | null = null;
  onclose: (() => void) | null = null;
  readyState = WebSocket.OPEN;
  send = vi.fn();
  close = vi.fn();
}

// Mock Cache
vi.mock('../utils/cache', () => ({
  Cache: {
    getInstance: vi.fn(() => ({
      get: vi.fn(),
      set: vi.fn(),
    })),
  },
}));

describe('E2E: Upload i analiza scenariusza', () => {
  let mockWebSocket: MockWebSocket;
  let mockCache: any;

  beforeEach(() => {
    mockWebSocket = new MockWebSocket();
    mockCache = Cache.getInstance();
    vi.spyOn(window, 'WebSocket').mockImplementation(() => mockWebSocket as unknown as WebSocket);
    // Mock fetch dla uploadu pliku
    global.fetch = vi.fn().mockImplementation((url, opts) => {
      if (url === '/api/script/analyze') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            id: 'test-script-id',
            result: {
              metadata: { title: 'Testowy Scenariusz', author: 'Jan Nowak' },
              scenes: [{ id: 1, title: 'Scena 1', description: 'Opis sceny 1', characters: ['Anna', 'Jan'] }],
              characters: [{ id: 1, name: 'Anna', description: 'Główna bohaterka' }],
              relationships: [{ id: 1, source: 'Anna', target: 'Jan', type: 'przyjaciele' }],
              topics: [{ id: 1, label: 'Miłość', keywords: ['uczucie', 'związek'] }],
              productionResources: [{ id: 1, name: 'Samochód', type: 'rekwizyt', amount: 1 }],
              technicalStats: { scenes: 1, words: 1000 },
              budgetFlags: [{ id: 1, label: 'Dużo lokacji', description: 'Wysokie koszty produkcji' }],
              extra: { note: 'Dodatkowe info' }
            }
          }),
        });
      }
      return Promise.reject(new Error('Unknown endpoint'));
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('przechodzi pełny flow: upload → analiza → dashboard', async () => {
    render(<App />);

    // Wprowadź klucz API
    const apiKeyInput = screen.getByLabelText(/OpenAI API Key/i);
    fireEvent.change(apiKeyInput, { target: { value: 'sk-test' } });

    // Wybierz plik PDF
    const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
    const fileInput = screen.getByLabelText(/Wybierz plik PDF/i) || screen.getByTestId('file-input');
    fireEvent.change(fileInput, { target: { files: [file] } });

    // Kliknij przycisk uploadu
    const uploadBtn = screen.getByRole('button', { name: /Prześlij/i });
    fireEvent.click(uploadBtn);

    // Oczekuj na sukces uploadu i pojawienie się dashboardu z danymi
    await waitFor(() => {
      expect(screen.getByText('Plik przesłany! Analiza rozpoczęta.')).toBeInTheDocument();
      expect(screen.getByText('Testowy Scenariusz')).toBeInTheDocument();
      expect(screen.getByText('Scena 1')).toBeInTheDocument();
      expect(screen.getByText('Anna')).toBeInTheDocument();
      expect(screen.getByText('Miłość')).toBeInTheDocument();
      expect(screen.getByText('Samochód')).toBeInTheDocument();
      expect(screen.getByText('Dużo lokacji')).toBeInTheDocument();
    });
  });
}); 