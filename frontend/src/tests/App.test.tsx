import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../App';
import { Cache } from '../utils/cache';

jest.mock('../utils/cache');

describe('App', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<App />);
    expect(screen.getByText('Analiza dokumentów PDF')).toBeInTheDocument();
  });

  it('handles file upload', async () => {
    render(<App />);
    
    const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
    const input = screen.getByTestId('file-input');
    
    fireEvent.change(input, { target: { files: [file] } });
    
    await waitFor(() => {
      expect(screen.getByText('test.pdf')).toBeInTheDocument();
    });
  });

  it('handles file upload error', async () => {
    render(<App />);
    
    const file = new File(['test content'], 'test.txt', { type: 'text/plain' });
    const input = screen.getByTestId('file-input');
    
    fireEvent.change(input, { target: { files: [file] } });
    
    await waitFor(() => {
      expect(screen.getByText('Nieprawidłowy format pliku')).toBeInTheDocument();
    });
  });

  it('uses cache for analysis results', async () => {
    const mockCache = {
      get: jest.fn().mockReturnValue({
        analysis: {
          metadata: {
            title: 'Test Document',
            authors: ['Test Author'],
            detected_language: 'pl',
            scene_count: 1,
            token_count: 100,
            analysis_timestamp: '2024-04-26T12:00:00Z'
          },
          overall_summary: 'Test summary'
        }
      }),
      set: jest.fn()
    };

    (Cache.getInstance as jest.Mock).mockReturnValue(mockCache);

    render(<App />);
    
    const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
    const input = screen.getByTestId('file-input');
    
    fireEvent.change(input, { target: { files: [file] } });
    
    await waitFor(() => {
      expect(mockCache.get).toHaveBeenCalled();
      expect(screen.getByText('Test Document')).toBeInTheDocument();
    });
  });
}); 