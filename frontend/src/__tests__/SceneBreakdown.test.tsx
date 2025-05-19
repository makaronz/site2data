import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import SceneBreakdown from '../views/SceneBreakdown';
import apiClient from '../api/apiClient';

// Mock the API client
jest.mock('../api/apiClient', () => ({
  getScenes: jest.fn(),
}));

// Mock the store
const mockSetSelectedScene = jest.fn();
jest.mock('../store/globalStore', () => ({
  __esModule: true,
  default: () => ({
    highContrast: true,
    setSelectedScene: mockSetSelectedScene
  }),
}));

// Mock Recharts components
jest.mock('recharts', () => ({
  LineChart: ({ children }) => <div data-testid="line-chart">{children}</div>,
  Line: () => <div data-testid="line">Line</div>,
  XAxis: () => <div data-testid="x-axis">XAxis</div>,
  YAxis: () => <div data-testid="y-axis">YAxis</div>,
  CartesianGrid: () => <div data-testid="cartesian-grid">CartesianGrid</div>,
  Tooltip: () => <div data-testid="tooltip">Tooltip</div>,
  Legend: () => <div data-testid="legend">Legend</div>,
  ResponsiveContainer: ({ children }) => <div data-testid="responsive-container">{children}</div>
}));

describe('SceneBreakdown', () => {
  const mockScenesData = [
    { 
      id: 'scene1', 
      number: 1, 
      location: 'INT. APARTMENT - DAY', 
      characters: ['JOHN', 'MARY'], 
      mood: 'tense',
      risk: 'low',
      summary: 'John and Mary argue about their relationship.'
    },
    { 
      id: 'scene2', 
      number: 2, 
      location: 'EXT. STREET - NIGHT', 
      characters: ['JOHN'], 
      mood: 'mysterious',
      risk: 'medium',
      summary: 'John walks alone, contemplating his next move.'
    },
    { 
      id: 'scene3', 
      number: 3, 
      location: 'INT. OFFICE - DAY', 
      characters: ['MARY', 'BOSS'], 
      mood: 'professional',
      risk: 'low',
      summary: 'Mary discusses her career with her boss.'
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    apiClient.getScenes.mockResolvedValue(mockScenesData);
  });

  it('renders loading state initially', async () => {
    render(
      <BrowserRouter>
        <SceneBreakdown />
      </BrowserRouter>
    );
    
    expect(screen.getByText('Loading data...')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders scene list after loading', async () => {
    render(
      <BrowserRouter>
        <SceneBreakdown />
      </BrowserRouter>
    );
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading data...')).not.toBeInTheDocument();
    });
    
    // Check if scene list is rendered
    expect(screen.getByText('INT. APARTMENT - DAY')).toBeInTheDocument();
    expect(screen.getByText('EXT. STREET - NIGHT')).toBeInTheDocument();
    expect(screen.getByText('INT. OFFICE - DAY')).toBeInTheDocument();
    
    // Check if character data is rendered
    expect(screen.getByText('JOHN, MARY')).toBeInTheDocument();
    
    // Check if mood data is rendered
    expect(screen.getByText(/tense/)).toBeInTheDocument();
    expect(screen.getByText(/mysterious/)).toBeInTheDocument();
  });

  it('renders mood graph after loading', async () => {
    render(
      <BrowserRouter>
        <SceneBreakdown />
      </BrowserRouter>
    );
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading data...')).not.toBeInTheDocument();
    });
    
    // Check if mood graph is rendered
    expect(screen.getByText('Mood Progression')).toBeInTheDocument();
    expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
  });

  it('handles filter changes', async () => {
    render(
      <BrowserRouter>
        <SceneBreakdown />
      </BrowserRouter>
    );
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading data...')).not.toBeInTheDocument();
    });
    
    // Test character filter
    const characterSelect = screen.getByLabelText('Character');
    fireEvent.mouseDown(characterSelect);
    const johnOption = screen.getByText('JOHN');
    fireEvent.click(johnOption);
    
    // Test location filter
    const locationSelect = screen.getByLabelText('Location');
    fireEvent.mouseDown(locationSelect);
    const officeOption = screen.getByText('INT. OFFICE - DAY');
    fireEvent.click(officeOption);
    
    // Test mood filter
    const moodSelect = screen.getByLabelText('Mood');
    fireEvent.mouseDown(moodSelect);
    const tenseOption = screen.getByText(/tense/);
    fireEvent.click(tenseOption);
  });

  it('selects scene when clicked', async () => {
    render(
      <BrowserRouter>
        <SceneBreakdown />
      </BrowserRouter>
    );
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading data...')).not.toBeInTheDocument();
    });
    
    // Click on a scene
    const sceneElement = screen.getByText('INT. APARTMENT - DAY').closest('div[role="button"]') || 
                         screen.getByText('INT. APARTMENT - DAY').closest('button');
    fireEvent.click(sceneElement);
    
    // Check if setSelectedScene was called
    expect(mockSetSelectedScene).toHaveBeenCalledWith(mockScenesData[0]);
  });

  it('handles API error state', async () => {
    // Mock API error
    apiClient.getScenes.mockRejectedValue(new Error('Network error'));
    
    render(
      <BrowserRouter>
        <SceneBreakdown />
      </BrowserRouter>
    );
    
    // Wait for error to be displayed
    await waitFor(() => {
      expect(screen.getByText('Error Loading Data')).toBeInTheDocument();
      expect(screen.getByText(/Failed to load scenes data/)).toBeInTheDocument();
    });
  });

  it('displays correct number of filtered scenes', async () => {
    render(
      <BrowserRouter>
        <SceneBreakdown />
      </BrowserRouter>
    );
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading data...')).not.toBeInTheDocument();
    });
    
    // Check initial count
    expect(screen.getByText('Scenes (3)')).toBeInTheDocument();
    
    // Apply filter
    const characterSelect = screen.getByLabelText('Character');
    fireEvent.mouseDown(characterSelect);
    const johnOption = screen.getByText('JOHN');
    fireEvent.click(johnOption);
    
    // Check updated count (John appears in 2 scenes)
    expect(screen.getByText('Scenes (2)')).toBeInTheDocument();
  });
});
