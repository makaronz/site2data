import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Sidebar from '../components/Sidebar';

// Mock the store
const mockSetUserRole = jest.fn();
jest.mock('../store/globalStore', () => ({
  __esModule: true,
  default: () => ({
    userRole: 'Director',
    setUserRole: mockSetUserRole,
    highContrast: true,
    darkMode: false
  }),
}));

describe('Sidebar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the sidebar with correct role options', () => {
    render(
      <BrowserRouter>
        <Sidebar />
      </BrowserRouter>
    );
    
    // Check if the app name is rendered
    expect(screen.getByText('ai_CineHub')).toBeInTheDocument();
    
    // Check if the role selector is rendered
    expect(screen.getByText('Current Role')).toBeInTheDocument();
    
    // Check if the correct role is selected
    const roleSelect = screen.getByRole('combobox');
    expect(roleSelect).toHaveValue('Director');
  });

  it('changes the role when a new option is selected', () => {
    render(
      <BrowserRouter>
        <Sidebar />
      </BrowserRouter>
    );
    
    // Select a new role
    const roleSelect = screen.getByRole('combobox');
    fireEvent.change(roleSelect, { target: { value: 'Producer' } });
    
    // Check if the setUserRole function was called with the correct value
    expect(mockSetUserRole).toHaveBeenCalledWith('Producer');
  });

  it('displays navigation items based on the current role', () => {
    render(
      <BrowserRouter>
        <Sidebar />
      </BrowserRouter>
    );
    
    // For Director role, these items should be visible
    expect(screen.getByText('Scene Breakdown')).toBeInTheDocument();
    expect(screen.getByText('Character Map')).toBeInTheDocument();
    expect(screen.getByText('Narrative Playback')).toBeInTheDocument();
    
    // These items should not be visible for Director role
    expect(screen.queryByText('Production Risks')).not.toBeInTheDocument();
  });
});
