import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import App from '../App';
import { WebSocketMessage, AnalysisResult } from '../types/websocket';
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

describe('App', () => {
  let mockWebSocket: MockWebSocket;
  let mockCache: Cache;

  beforeEach(() => {
    mockWebSocket = new MockWebSocket();
    mockCache = Cache.getInstance();
    vi.spyOn(window, 'WebSocket').mockImplementation(() => mockWebSocket as unknown as WebSocket);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('powinien wyświetlać formularz uploadu', () => {
    render(<App />);
    expect(screen.getByText(/Przeciągnij i upuść plik/i)).toBeInTheDocument();
  });

  it('powinien obsługiwać poprawnie wiadomość ANALYSIS_RESULT', async () => {
    const mockResult: AnalysisResult = {
      analysis: {
        metadata: {
          title: 'Test Title',
          authors: ['Author 1'],
          detected_language: 'pl',
          scene_count: 1,
          token_count: 100,
          analysis_timestamp: '2024-01-01T00:00:00Z',
        },
        overall_summary: 'Test summary',
      },
    };

    render(<App />);
    
    // Symuluj wiadomość WebSocket
    const message: WebSocketMessage = {
      type: 'ANALYSIS_RESULT',
      result: mockResult,
    };

    mockWebSocket.onmessage?.({ data: JSON.stringify(message) });

    await waitFor(() => {
      expect(screen.getByText('Test Title')).toBeInTheDocument();
    });
  });

  it('powinien obsługiwać brak result w wiadomości ANALYSIS_RESULT', async () => {
    render(<App />);
    
    const message: WebSocketMessage = {
      type: 'ANALYSIS_RESULT',
    };

    mockWebSocket.onmessage?.({ data: JSON.stringify(message) });

    await waitFor(() => {
      expect(screen.getByText('Błąd: Brak wyników analizy')).toBeInTheDocument();
    });
  });

  it('powinien obsługiwać wiadomość PROGRESS', async () => {
    render(<App />);
    
    const message: WebSocketMessage = {
      type: 'PROGRESS',
      message: 'Test progress message',
    };

    mockWebSocket.onmessage?.({ data: JSON.stringify(message) });

    await waitFor(() => {
      expect(screen.getByText('Test progress message')).toBeInTheDocument();
    });
  });

  it('powinien obsługiwać wiadomość ERROR', async () => {
    render(<App />);
    
    const message: WebSocketMessage = {
      type: 'ERROR',
      message: 'Test error message',
    };

    mockWebSocket.onmessage?.({ data: JSON.stringify(message) });

    await waitFor(() => {
      expect(screen.getByText('Test error message')).toBeInTheDocument();
    });
  });

  it('powinien sprawdzać cache przy uploadzie pliku', async () => {
    const mockResult: AnalysisResult = {
      analysis: {
        metadata: {
          title: 'Cached Title',
          authors: ['Author 1'],
          detected_language: 'pl',
          scene_count: 1,
          token_count: 100,
          analysis_timestamp: '2024-01-01T00:00:00Z',
        },
        overall_summary: 'Cached summary',
      },
    };

    (mockCache.get as vi.Mock).mockReturnValue(mockResult);

    render(<App />);
    
    // Symuluj upload pliku
    const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
    const input = screen.getByTestId('file-input');
    
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText('Cached Title')).toBeInTheDocument();
    });
  });
}); 