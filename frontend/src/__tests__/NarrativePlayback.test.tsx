import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import NarrativePlayback from '../views/NarrativePlayback';
import apiClient from '../api/apiClient';

// Mock the API client
jest.mock('../api/apiClient', () => ({
  getScenes: jest.fn(),
  getSceneCharacterGraph: jest.fn(),
}));

// Mock the store
jest.mock('../store/globalStore', () => ({
  __esModule: true,
  default: () => ({
    highContrast: true
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
}));

describe('NarrativePlayback', () => {
  const mockScenesData = [
    { 
      id: 'scene1', 
      number: 1, 
      location: 'INT. APARTMENT - DAY', 
      characters: ['JOHN', 'MARY'], 
      mood: 'tense',
      summary: 'John and Mary argue about their relationship.'
    },
    { 
      id: 'scene2', 
      number: 2, 
      location: 'EXT. STREET - NIGHT', 
      characters: ['JOHN'], 
      mood: 'mysterious',
      summary: 'John walks alone, contemplating his next move.'
    },
    { 
      id: 'scene3', 
      number: 3, 
      location: 'INT. OFFICE - DAY', 
      characters: ['MARY', 'BOSS'], 
      mood: 'professional',
      summary: 'Mary discusses her career with her boss.'
    }
  ];

  const mockGraphData = {
    nodes: [
      { id: 'char1', name: 'JOHN', importance: 0.8, lines: 10 },
      { id: 'char2', name: 'MARY', importance: 0.6, lines: 8 }
    ],
    edges: [
      { source: 'char1', target: 'char2', sentiment: 0.5, weight: 2, interactions: 3 }
    ]
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    apiClient.getScenes.mockResolvedValue(mockScenesData);
    apiClient.getSceneCharacterGraph.mockResolvedValue(mockGraphData);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders loading state initially', async () => {
    render(
      <BrowserRouter>
        <NarrativePlayback />
      </BrowserRouter>
    );
    
    expect(screen.getByText('Loading data...')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders playback interface after loading', async () => {
    render(
      <BrowserRouter>
        <NarrativePlayback />
      </BrowserRouter>
    );
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading data...')).not.toBeInTheDocument();
    });
    
    // Check if timeline is rendered
    expect(screen.getByText('Scene Timeline')).toBeInTheDocument();
    
    // Check if scene details are rendered
    expect(screen.getByText('Scene 1')).toBeInTheDocument();
    expect(screen.getByText('INT. APARTMENT - DAY')).toBeInTheDocument();
    expect(screen.getByText('JOHN, MARY')).toBeInTheDocument();
    
    // Check if playback controls are rendered
    expect(screen.getByText('Play')).toBeInTheDocument();
    expect(screen.getByText('Keyboard shortcuts: Space (Play/Pause), ← (Previous), → (Next)')).toBeInTheDocument();
  });

  it('renders character graph after loading', async () => {
    render(
      <BrowserRouter>
        <NarrativePlayback />
      </BrowserRouter>
    );
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading data...')).not.toBeInTheDocument();
    });
    
    // Check if character graph is rendered
    expect(screen.getByText('Character Relationships - Scene 1')).toBeInTheDocument();
    
    // Wait for graph to load
    await waitFor(() => {
      expect(screen.queryByText('Loading data...')).not.toBeInTheDocument();
    });
    
    expect(screen.getByTestId('sigma-container')).toBeInTheDocument();
  });

  it('changes to play mode when play button is clicked', async () => {
    render(
      <BrowserRouter>
        <NarrativePlayback />
      </BrowserRouter>
    );
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading data...')).not.toBeInTheDocument();
    });
    
    // Initially in pause mode
    expect(screen.getByText('Play')).toBeInTheDocument();
    
    // Click play button
    fireEvent.click(screen.getByText('Play'));
    
    // Should change to pause mode
    expect(screen.getByText('Pause')).toBeInTheDocument();
  });

  it('changes to the next scene when next button is clicked', async () => {
    render(
      <BrowserRouter>
        <NarrativePlayback />
      </BrowserRouter>
    );
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading data...')).not.toBeInTheDocument();
    });
    
    // Initial scene should be Scene 1
    expect(screen.getByText('Scene 1')).toBeInTheDocument();
    expect(screen.getByText('INT. APARTMENT - DAY')).toBeInTheDocument();
    
    // Click next button
    const nextButton = screen.getByRole('button', { name: /next/i });
    fireEvent.click(nextButton);
    
    // Scene should change to Scene 2
    expect(screen.getByText('Scene 2')).toBeInTheDocument();
    expect(screen.getByText('EXT. STREET - NIGHT')).toBeInTheDocument();
  });

  it('changes to the previous scene when previous button is clicked', async () => {
    render(
      <BrowserRouter>
        <NarrativePlayback />
      </BrowserRouter>
    );
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading data...')).not.toBeInTheDocument();
    });
    
    // Move to scene 2 first
    const nextButton = screen.getByRole('button', { name: /next/i });
    fireEvent.click(nextButton);
    
    // Now go back to scene 1
    const prevButton = screen.getByRole('button', { name: /previous/i });
    fireEvent.click(prevButton);
    
    // Scene should change back to Scene 1
    expect(screen.getByText('Scene 1')).toBeInTheDocument();
    expect(screen.getByText('INT. APARTMENT - DAY')).toBeInTheDocument();
  });

  it('automatically advances to the next scene when in play mode', async () => {
    render(
      <BrowserRouter>
        <NarrativePlayback />
      </BrowserRouter>
    );
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading data...')).not.toBeInTheDocument();
    });
    
    // Initial scene should be Scene 1
    expect(screen.getByText('Scene 1')).toBeInTheDocument();
    
    // Click play button
    fireEvent.click(screen.getByText('Play'));
    
    // Advance timer by 3 seconds
    act(() => {
      jest.advanceTimersByTime(3000);
    });
    
    // Scene should change to Scene 2
    expect(screen.getByText('Scene 2')).toBeInTheDocument();
    
    // Advance timer by another 3 seconds
    act(() => {
      jest.advanceTimersByTime(3000);
    });
    
    // Scene should change to Scene 3
    expect(screen.getByText('Scene 3')).toBeInTheDocument();
  });

  it('responds to keyboard shortcuts', async () => {
    render(
      <BrowserRouter>
        <NarrativePlayback />
      </BrowserRouter>
    );
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading data...')).not.toBeInTheDocument();
    });
    
    // Test space key for play/pause
    fireEvent.keyDown(window, { code: 'Space' });
    expect(screen.getByText('Pause')).toBeInTheDocument();
    
    // Test right arrow for next scene
    fireEvent.keyDown(window, { code: 'ArrowRight' });
    expect(screen.getByText('Scene 2')).toBeInTheDocument();
    
    // Test left arrow for previous scene
    fireEvent.keyDown(window, { code: 'ArrowLeft' });
    expect(screen.getByText('Scene 1')).toBeInTheDocument();
  });

  it('handles API error state for scenes', async () => {
    // Mock API error
    apiClient.getScenes.mockRejectedValue(new Error('Network error'));
    
    render(
      <BrowserRouter>
        <NarrativePlayback />
      </BrowserRouter>
    );
    
    // Wait for error to be displayed
    await waitFor(() => {
      expect(screen.getByText('Error Loading Data')).toBeInTheDocument();
      expect(screen.getByText(/Failed to load scenes data/)).toBeInTheDocument();
    });
  });

  it('handles API error state for scene graph', async () => {
    // Mock scene API success but graph API error
    apiClient.getScenes.mockResolvedValue(mockScenesData);
    apiClient.getSceneCharacterGraph.mockRejectedValue(new Error('Graph error'));
    
    render(
      <BrowserRouter>
        <NarrativePlayback />
      </BrowserRouter>
    );
    
    // Wait for scenes to load
    await waitFor(() => {
      expect(screen.queryByText('Loading data...')).not.toBeInTheDocument();
    });
    
    // Wait for graph error to be displayed
    await waitFor(() => {
      expect(screen.getByText(/Failed to load character graph for this scene/)).toBeInTheDocument();
    });
  });
});
