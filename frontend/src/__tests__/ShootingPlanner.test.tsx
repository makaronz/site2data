import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ShootingPlanner from '../views/ShootingPlanner';
import apiClient from '../api/apiClient';

// Mock the API client
jest.mock('../api/apiClient', () => ({
  getSchedule: jest.fn(),
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

// Mock react-big-calendar
jest.mock('react-big-calendar', () => {
  const Calendar = ({ events, components, eventPropGetter, onSelectEvent }) => {
    // Simulate calendar rendering with events
    return (
      <div data-testid="calendar">
        {events.map((event) => (
          <div 
            key={event.id} 
            data-testid={`event-${event.id}`}
            onClick={() => onSelectEvent && onSelectEvent(event)}
          >
            {event.title}
            {components.event && <components.event event={event} />}
            {components.eventWrapper && (
              <components.eventWrapper event={event}>
                <div>Event Wrapper</div>
              </components.eventWrapper>
            )}
          </div>
        ))}
      </div>
    );
  };
  
  return {
    Calendar,
    momentLocalizer: () => ({}),
  };
});

describe('ShootingPlanner', () => {
  const mockScheduleData = [
    {
      date: '2025-05-20',
      startTime: { hour: 8, minute: 0 },
      endTime: { hour: 18, minute: 0 },
      scenes: [
        {
          id: 'scene1',
          number: 1,
          location: 'INT. APARTMENT - DAY',
          characters: ['JOHN', 'MARY'],
          pageCount: 2,
          props: ['LAPTOP', 'COFFEE CUP']
        },
        {
          id: 'scene2',
          number: 2,
          location: 'EXT. STREET - NIGHT',
          characters: ['JOHN'],
          pageCount: 1.5,
          props: ['GUN']
        }
      ]
    },
    {
      date: '2025-05-21',
      startTime: { hour: 9, minute: 0 },
      endTime: { hour: 17, minute: 0 },
      scenes: [
        {
          id: 'scene3',
          number: 3,
          location: 'INT. OFFICE - DAY',
          characters: ['MARY', 'BOSS'],
          pageCount: 3,
          props: ['BRIEFCASE', 'COFFEE CUP']
        }
      ]
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    apiClient.getSchedule.mockResolvedValue(mockScheduleData);
    
    // Mock document.createElement for CSV export
    const mockLink = document.createElement('a');
    mockLink.click = jest.fn();
    jest.spyOn(document, 'createElement').mockReturnValue(mockLink);
    jest.spyOn(URL, 'createObjectURL').mockReturnValue('mock-url');
    jest.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
  });

  it('renders loading state initially', async () => {
    render(
      <BrowserRouter>
        <ShootingPlanner />
      </BrowserRouter>
    );
    
    expect(screen.getByText('Loading data...')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders calendar after loading', async () => {
    render(
      <BrowserRouter>
        <ShootingPlanner />
      </BrowserRouter>
    );
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading data...')).not.toBeInTheDocument();
    });
    
    // Check if calendar is rendered
    expect(screen.getByTestId('calendar')).toBeInTheDocument();
    
    // Check if events are rendered
    expect(screen.getByTestId('event-scene1')).toBeInTheDocument();
    expect(screen.getByTestId('event-scene2')).toBeInTheDocument();
    expect(screen.getByTestId('event-scene3')).toBeInTheDocument();
  });

  it('renders legend correctly', async () => {
    render(
      <BrowserRouter>
        <ShootingPlanner />
      </BrowserRouter>
    );
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading data...')).not.toBeInTheDocument();
    });
    
    // Check if legend is rendered
    expect(screen.getByText('Legend:')).toBeInTheDocument();
    expect(screen.getByText('Exterior Scenes')).toBeInTheDocument();
    expect(screen.getByText('Interior Scenes')).toBeInTheDocument();
  });

  it('exports schedule as CSV when button is clicked', async () => {
    render(
      <BrowserRouter>
        <ShootingPlanner />
      </BrowserRouter>
    );
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading data...')).not.toBeInTheDocument();
    });
    
    // Click export button
    const exportButton = screen.getByText('Export as CSV');
    fireEvent.click(exportButton);
    
    // Check if link was created and clicked
    const mockLink = document.createElement('a');
    expect(mockLink.download).toBe('shooting-schedule.csv');
    expect(mockLink.click).toHaveBeenCalled();
    expect(URL.createObjectURL).toHaveBeenCalled();
    expect(URL.revokeObjectURL).toHaveBeenCalled();
  });

  it('selects scene when event is clicked', async () => {
    render(
      <BrowserRouter>
        <ShootingPlanner />
      </BrowserRouter>
    );
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading data...')).not.toBeInTheDocument();
    });
    
    // Click on an event
    const event = screen.getByTestId('event-scene1');
    fireEvent.click(event);
    
    // Check if setSelectedScene was called
    expect(mockSetSelectedScene).toHaveBeenCalled();
  });

  it('handles API error state', async () => {
    // Mock API error
    apiClient.getSchedule.mockRejectedValue(new Error('Network error'));
    
    render(
      <BrowserRouter>
        <ShootingPlanner />
      </BrowserRouter>
    );
    
    // Wait for error to be displayed
    await waitFor(() => {
      expect(screen.getByText('Error Loading Data')).toBeInTheDocument();
      expect(screen.getByText(/Failed to load shooting schedule/)).toBeInTheDocument();
    });
    
    // Export button should be disabled
    const exportButton = screen.getByText('Export as CSV');
    expect(exportButton).toBeDisabled();
  });

  it('displays empty state when no schedule is available', async () => {
    // Mock empty schedule
    apiClient.getSchedule.mockResolvedValue([]);
    
    render(
      <BrowserRouter>
        <ShootingPlanner />
      </BrowserRouter>
    );
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading data...')).not.toBeInTheDocument();
    });
    
    // Check if empty state is displayed
    expect(screen.getByText('No shooting schedule available')).toBeInTheDocument();
    
    // Export button should be disabled
    const exportButton = screen.getByText('Export as CSV');
    expect(exportButton).toBeDisabled();
  });
});
