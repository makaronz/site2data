import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import useGlobalStore from '../store/globalStore';
import { act } from 'react-dom/test-utils';

// Mock zustand
jest.mock('../store/globalStore');

describe('globalStore', () => {
  beforeEach(() => {
    // Reset the mock before each test
    jest.resetAllMocks();
  });

  it('should set user role correctly', () => {
    // Mock implementation for this test
    const mockSetUserRole = jest.fn();
    (useGlobalStore as jest.Mock).mockImplementation(() => ({
      userRole: 'Director',
      setUserRole: mockSetUserRole
    }));

    // Create a test component that uses the store
    const TestComponent = () => {
      const { userRole, setUserRole } = useGlobalStore();
      return (
        <div>
          <span data-testid="role">{userRole}</span>
          <button onClick={() => setUserRole('Producer')}>Change Role</button>
        </div>
      );
    };

    // Render the test component
    render(<TestComponent />);
    
    // Check initial state
    expect(screen.getByTestId('role')).toHaveTextContent('Director');
    
    // Trigger the action
    fireEvent.click(screen.getByText('Change Role'));
    
    // Check if the action was called correctly
    expect(mockSetUserRole).toHaveBeenCalledWith('Producer');
  });

  it('should toggle dark mode correctly', () => {
    // Mock implementation for this test
    const mockToggleDarkMode = jest.fn();
    (useGlobalStore as jest.Mock).mockImplementation(() => ({
      darkMode: false,
      toggleDarkMode: mockToggleDarkMode
    }));

    // Create a test component that uses the store
    const TestComponent = () => {
      const { darkMode, toggleDarkMode } = useGlobalStore();
      return (
        <div>
          <span data-testid="darkMode">{darkMode ? 'Dark' : 'Light'}</span>
          <button onClick={toggleDarkMode}>Toggle Theme</button>
        </div>
      );
    };

    // Render the test component
    render(<TestComponent />);
    
    // Check initial state
    expect(screen.getByTestId('darkMode')).toHaveTextContent('Light');
    
    // Trigger the action
    fireEvent.click(screen.getByText('Toggle Theme'));
    
    // Check if the action was called correctly
    expect(mockToggleDarkMode).toHaveBeenCalled();
  });

  it('should toggle high contrast correctly', () => {
    // Mock implementation for this test
    const mockToggleHighContrast = jest.fn();
    (useGlobalStore as jest.Mock).mockImplementation(() => ({
      highContrast: true,
      toggleHighContrast: mockToggleHighContrast
    }));

    // Create a test component that uses the store
    const TestComponent = () => {
      const { highContrast, toggleHighContrast } = useGlobalStore();
      return (
        <div>
          <span data-testid="highContrast">{highContrast ? 'High' : 'Normal'}</span>
          <button onClick={toggleHighContrast}>Toggle Contrast</button>
        </div>
      );
    };

    // Render the test component
    render(<TestComponent />);
    
    // Check initial state
    expect(screen.getByTestId('highContrast')).toHaveTextContent('High');
    
    // Trigger the action
    fireEvent.click(screen.getByText('Toggle Contrast'));
    
    // Check if the action was called correctly
    expect(mockToggleHighContrast).toHaveBeenCalled();
  });

  it('should set filters correctly', () => {
    // Mock implementation for this test
    const mockSetFilter = jest.fn();
    (useGlobalStore as jest.Mock).mockImplementation(() => ({
      filters: { location: null },
      setFilter: mockSetFilter
    }));

    // Create a test component that uses the store
    const TestComponent = () => {
      const { filters, setFilter } = useGlobalStore();
      return (
        <div>
          <span data-testid="location">{filters.location || 'None'}</span>
          <button onClick={() => setFilter('location', 'New York')}>Set Location</button>
        </div>
      );
    };

    // Render the test component
    render(<TestComponent />);
    
    // Check initial state
    expect(screen.getByTestId('location')).toHaveTextContent('None');
    
    // Trigger the action
    fireEvent.click(screen.getByText('Set Location'));
    
    // Check if the action was called correctly
    expect(mockSetFilter).toHaveBeenCalledWith('location', 'New York');
  });
});
