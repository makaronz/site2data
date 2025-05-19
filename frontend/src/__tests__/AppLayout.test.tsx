import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import AppLayout from '../layouts/AppLayout';

// Mock the store
jest.mock('../store/globalStore', () => ({
  __esModule: true,
  default: () => ({
    darkMode: false,
    highContrast: true,
    userRole: 'Director',
    setUserRole: jest.fn(),
    setSelectedScene: jest.fn(),
    setSelectedCharacter: jest.fn(),
    setSelectedLocation: jest.fn(),
  }),
}));

// Mock the components
jest.mock('../components/Sidebar', () => {
  return {
    __esModule: true,
    default: () => <div data-testid="sidebar">Sidebar</div>,
  };
});

jest.mock('../components/ContextPanel', () => {
  return {
    __esModule: true,
    default: () => <div data-testid="context-panel">Context Panel</div>,
  };
});

describe('AppLayout', () => {
  it('renders the layout with children', () => {
    render(
      <BrowserRouter>
        <AppLayout>
          <div data-testid="test-content">Test Content</div>
        </AppLayout>
      </BrowserRouter>
    );
    
    // Check if all components are rendered
    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    expect(screen.getByTestId('context-panel')).toBeInTheDocument();
    expect(screen.getByTestId('test-content')).toBeInTheDocument();
  });
});
