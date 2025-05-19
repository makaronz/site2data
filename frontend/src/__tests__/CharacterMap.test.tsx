import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import CharacterMap from '../views/CharacterMap';
import apiClient from '../api/apiClient';

// Mock the API client
jest.mock('../api/apiClient', () => ({
  getCharacterGraph: jest.fn(),
}));

// Mock the store
const mockSetSelectedCharacter = jest.fn();
jest.mock('../store/globalStore', () => ({
  __esModule: true,
  default: () => ({
    highContrast: true,
    setSelectedCharacter: mockSetSelectedCharacter
  }),
}));

// Mock SigmaContainer and related components
jest.mock('@react-sigma/core', () => ({
  SigmaContainer: ({ children, onSigmaReady }) => {
    // Simulate sigma being ready
    React.useEffect(() => {
      if (onSigmaReady) {
        const mockSigma = {
          getGraph: () => ({
            getNodeAttributes: () => ({}),
            source: () => '',
            target: () => '',
            nodeEntries: () => [],
            edgeEntries: () => [],
          }),
          on: jest.fn(),
        };
        onSigmaReady(mockSigma);
      }
    }, [onSigmaReady]);
    
    return <div data-testid="sigma-container">{children}</div>;
  },
  ControlsContainer: ({ children }) => <div data-testid="controls-container">{children}</div>,
  ZoomControl: () => <div data-testid="zoom-control">Zoom</div>,
  FullScreenControl: () => <div data-testid="fullscreen-control">Fullscreen</div>,
}));

describe('CharacterMap', () => {
  const mockGraphData = {
    nodes: [
      { id: 'char1', name: 'John', centrality: 0.8, scenes: ['scene1', 'scene2'], relationships: [] },
      { id: 'char2', name: 'Mary', centrality: 0.6, scenes: ['scene1'], relationships: [] }
    ],
    edges: [
      { source: 'char1', target: 'char2', sentiment: 0.5, weight: 2, scenes: ['scene1'] }
    ]
  };

  beforeEach(() => {
    jest.clearAllMocks();
    apiClient.getCharacterGraph.mockResolvedValue(mockGraphData);
  });

  it('renders loading state initially', async () => {
    render(
      <BrowserRouter>
        <CharacterMap />
      </BrowserRouter>
    );
    
    expect(screen.getByText('Loading data...')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders character graph after loading', async () => {
    render(
      <BrowserRouter>
        <CharacterMap />
      </BrowserRouter>
    );
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading data...')).not.toBeInTheDocument();
    });
    
    // Check if the graph container is rendered
    expect(screen.getByTestId('sigma-container')).toBeInTheDocument();
    expect(screen.getByTestId('zoom-control')).toBeInTheDocument();
    expect(screen.getByTestId('fullscreen-control')).toBeInTheDocument();
  });

  it('renders character list after loading', async () => {
    render(
      <BrowserRouter>
        <CharacterMap />
      </BrowserRouter>
    );
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading data...')).not.toBeInTheDocument();
    });
    
    // Check if character list is rendered
    expect(screen.getByText('John')).toBeInTheDocument();
    expect(screen.getByText('Mary')).toBeInTheDocument();
  });

  it('handles filter changes', async () => {
    render(
      <BrowserRouter>
        <CharacterMap />
      </BrowserRouter>
    );
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading data...')).not.toBeInTheDocument();
    });
    
    // Test character filter
    const characterSelect = screen.getByText('All Characters').closest('select');
    fireEvent.change(characterSelect, { target: { value: 'char1' } });
    
    // Test scene filter
    const sceneSelect = screen.getByText('All Scenes').closest('select');
    fireEvent.change(sceneSelect, { target: { value: 'scene1' } });
    
    // Test sentiment toggle
    const sentimentButton = screen.getByText('Sentiment On');
    fireEvent.click(sentimentButton);
    expect(screen.getByText('Sentiment Off')).toBeInTheDocument();
  });

  it('handles export buttons', async () => {
    // Mock canvas and link click
    const mockCanvas = document.createElement('canvas');
    mockCanvas.toDataURL = jest.fn().mockReturnValue('data:image/png');
    
    const mockLink = document.createElement('a');
    mockLink.click = jest.fn();
    
    jest.spyOn(document, 'querySelector').mockReturnValue(mockCanvas);
    jest.spyOn(document, 'createElement').mockReturnValue(mockLink);
    
    render(
      <BrowserRouter>
        <CharacterMap />
      </BrowserRouter>
    );
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading data...')).not.toBeInTheDocument();
    });
    
    // Test PNG export
    const pngButton = screen.getByText('Export PNG');
    fireEvent.click(pngButton);
    expect(mockLink.download).toBe('character-map.png');
    expect(mockLink.click).toHaveBeenCalled();
    
    // Test GEXF export
    const gexfButton = screen.getByText('Export GEXF');
    fireEvent.click(gexfButton);
    expect(mockLink.download).toBe('character-map.gexf');
    expect(mockLink.click).toHaveBeenCalledTimes(2);
  });

  it('handles API error state', async () => {
    // Mock API error
    apiClient.getCharacterGraph.mockRejectedValue(new Error('Network error'));
    
    render(
      <BrowserRouter>
        <CharacterMap />
      </BrowserRouter>
    );
    
    // Wait for error to be displayed
    await waitFor(() => {
      expect(screen.getByText('Error Loading Data')).toBeInTheDocument();
      expect(screen.getByText(/Failed to load character graph data/)).toBeInTheDocument();
    });
  });

  it('selects character when clicked', async () => {
    render(
      <BrowserRouter>
        <CharacterMap />
      </BrowserRouter>
    );
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading data...')).not.toBeInTheDocument();
    });
    
    // Click on a character card
    const johnCard = screen.getByText('John').closest('div[role="button"]') || 
                     screen.getByText('John').closest('button');
    fireEvent.click(johnCard);
    
    // Check if setSelectedCharacter was called
    expect(mockSetSelectedCharacter).toHaveBeenCalled();
  });
});
