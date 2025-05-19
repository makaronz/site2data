import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import SceneBreakdown from '../views/SceneBreakdown';

// Mock the store
const mockSetSelectedScene = jest.fn();
jest.mock('../store/globalStore', () => ({
  __esModule: true,
  default: () => ({
    highContrast: true,
    setSelectedScene: mockSetSelectedScene
  }),
}));

describe('SceneBreakdown', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the scene breakdown view with mock data', () => {
    render(
      <BrowserRouter>
        <SceneBreakdown />
      </BrowserRouter>
    );
    
    // Check if the title is rendered
    expect(screen.getByText('Scene Breakdown')).toBeInTheDocument();
    
    // Check if scene data is rendered
    expect(screen.getByText('INT. APARTMENT - DAY')).toBeInTheDocument();
    expect(screen.getByText('EXT. STREET - NIGHT')).toBeInTheDocument();
    
    // Check if character data is rendered
    expect(screen.getByText('JOHN, MARY')).toBeInTheDocument();
    
    // Check if mood data is rendered with emoji
    expect(screen.getByText(/tense/)).toBeInTheDocument();
    expect(screen.getByText(/mysterious/)).toBeInTheDocument();
  });

  it('calls setSelectedScene when a scene is clicked', () => {
    render(
      <BrowserRouter>
        <SceneBreakdown />
      </BrowserRouter>
    );
    
    // Click on a scene
    fireEvent.click(screen.getByText('INT. APARTMENT - DAY'));
    
    // Check if setSelectedScene was called
    expect(mockSetSelectedScene).toHaveBeenCalled();
  });

  it('displays the mood line graph placeholder', () => {
    render(
      <BrowserRouter>
        <SceneBreakdown />
      </BrowserRouter>
    );
    
    // Check if the mood line graph placeholder is rendered
    expect(screen.getByText('Mood Line Graph will be implemented here using Recharts')).toBeInTheDocument();
  });
});
