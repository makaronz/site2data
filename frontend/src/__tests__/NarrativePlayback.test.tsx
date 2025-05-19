import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import NarrativePlayback from '../views/NarrativePlayback';

// Mock the store
jest.mock('../store/globalStore', () => ({
  __esModule: true,
  default: () => ({
    highContrast: true
  }),
}));

describe('NarrativePlayback', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders the narrative playback view with mock data', () => {
    render(
      <BrowserRouter>
        <NarrativePlayback />
      </BrowserRouter>
    );
    
    // Check if the title is rendered
    expect(screen.getByText('Narrative Playback Mode')).toBeInTheDocument();
    
    // Check if scene data is rendered
    expect(screen.getByText('INT. APARTMENT - DAY')).toBeInTheDocument();
    
    // Check if character data is rendered
    expect(screen.getByText('JOHN, MARY')).toBeInTheDocument();
    
    // Check if playback controls are rendered
    expect(screen.getByText('Play')).toBeInTheDocument();
    expect(screen.getByText('Keyboard shortcuts: Space (Play/Pause), ← (Previous), → (Next)')).toBeInTheDocument();
  });

  it('changes to the next scene when next button is clicked', () => {
    render(
      <BrowserRouter>
        <NarrativePlayback />
      </BrowserRouter>
    );
    
    // Initial scene should be Scene 1
    expect(screen.getByText('Scene 1')).toBeInTheDocument();
    expect(screen.getByText('INT. APARTMENT - DAY')).toBeInTheDocument();
    
    // Click next button
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    
    // Scene should change to Scene 2
    expect(screen.getByText('Scene 2')).toBeInTheDocument();
    expect(screen.getByText('EXT. STREET - NIGHT')).toBeInTheDocument();
  });

  it('changes to play mode when play button is clicked', () => {
    render(
      <BrowserRouter>
        <NarrativePlayback />
      </BrowserRouter>
    );
    
    // Initially in pause mode
    expect(screen.getByText('Play')).toBeInTheDocument();
    
    // Click play button
    fireEvent.click(screen.getByText('Play'));
    
    // Should change to pause mode
    expect(screen.getByText('Pause')).toBeInTheDocument();
  });

  it('automatically advances to the next scene when in play mode', () => {
    render(
      <BrowserRouter>
        <NarrativePlayback />
      </BrowserRouter>
    );
    
    // Initial scene should be Scene 1
    expect(screen.getByText('Scene 1')).toBeInTheDocument();
    
    // Click play button
    fireEvent.click(screen.getByText('Play'));
    
    // Advance timer by 3 seconds
    jest.advanceTimersByTime(3000);
    
    // Scene should change to Scene 2
    expect(screen.getByText('Scene 2')).toBeInTheDocument();
  });
});
