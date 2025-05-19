import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import PropsMatrix from '../views/PropsMatrix';
import apiClient from '../api/apiClient';

// Mock the API client
jest.mock('../api/apiClient', () => ({
  getScenes: jest.fn(),
  getProps: jest.fn(),
}));

// Mock the store
jest.mock('../store/globalStore', () => ({
  __esModule: true,
  default: () => ({
    highContrast: true
  }),
}));

describe('PropsMatrix', () => {
  const mockScenesData = [
    { 
      id: 'scene1', 
      number: 1, 
      location: 'INT. APARTMENT - DAY', 
      characters: ['JOHN', 'MARY']
    },
    { 
      id: 'scene2', 
      number: 2, 
      location: 'EXT. STREET - NIGHT', 
      characters: ['JOHN']
    },
    { 
      id: 'scene3', 
      number: 3, 
      location: 'INT. OFFICE - DAY', 
      characters: ['MARY', 'BOSS']
    }
  ];

  const mockPropsData = [
    { id: 'prop1', name: 'Laptop', type: 'electronics', scenes: ['scene1', 'scene3'] },
    { id: 'prop2', name: 'Gun', type: 'weapon', scenes: ['scene2'] },
    { id: 'prop3', name: 'Coffee Cup', type: 'prop', scenes: ['scene1', 'scene3'] },
    { id: 'prop4', name: 'Car', type: 'vehicle', scenes: ['scene2'] }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    apiClient.getScenes.mockResolvedValue(mockScenesData);
    apiClient.getProps.mockResolvedValue(mockPropsData);
  });

  it('renders loading state initially', async () => {
    render(
      <BrowserRouter>
        <PropsMatrix />
      </BrowserRouter>
    );
    
    expect(screen.getByText('Loading data...')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders props matrix after loading', async () => {
    render(
      <BrowserRouter>
        <PropsMatrix />
      </BrowserRouter>
    );
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading data...')).not.toBeInTheDocument();
    });
    
    // Check if matrix headers are rendered
    expect(screen.getByText('Scene')).toBeInTheDocument();
    expect(screen.getByText('Location')).toBeInTheDocument();
    expect(screen.getByText('Props')).toBeInTheDocument();
    
    // Check if scenes are rendered
    expect(screen.getByText('INT. APARTMENT - DAY')).toBeInTheDocument();
    expect(screen.getByText('EXT. STREET - NIGHT')).toBeInTheDocument();
    expect(screen.getByText('INT. OFFICE - DAY')).toBeInTheDocument();
    
    // Check if props are rendered
    expect(screen.getByText('Laptop')).toBeInTheDocument();
    expect(screen.getByText('Gun')).toBeInTheDocument();
    expect(screen.getByText('Coffee Cup')).toBeInTheDocument();
    expect(screen.getByText('Car')).toBeInTheDocument();
  });

  it('renders props summary after loading', async () => {
    render(
      <BrowserRouter>
        <PropsMatrix />
      </BrowserRouter>
    );
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading data...')).not.toBeInTheDocument();
    });
    
    // Check if summary is rendered
    expect(screen.getByText('Props Summary')).toBeInTheDocument();
    
    // Check if summary table headers are rendered
    expect(screen.getByText('Prop')).toBeInTheDocument();
    expect(screen.getByText('Type')).toBeInTheDocument();
    expect(screen.getByText('Required')).toBeInTheDocument();
    expect(screen.getByText('Allocated')).toBeInTheDocument();
    expect(screen.getByText('Missing')).toBeInTheDocument();
  });

  it('handles prop type filter changes', async () => {
    render(
      <BrowserRouter>
        <PropsMatrix />
      </BrowserRouter>
    );
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading data...')).not.toBeInTheDocument();
    });
    
    // Test prop type filter
    const propTypeSelect = screen.getByLabelText('Prop Type');
    fireEvent.mouseDown(propTypeSelect);
    const weaponOption = screen.getByText(/weapon/i);
    fireEvent.click(weaponOption);
    
    // Only weapon props should be visible in the matrix
    expect(screen.getByText('Gun')).toBeInTheDocument();
    expect(screen.queryByText('Laptop')).not.toBeInTheDocument();
    expect(screen.queryByText('Coffee Cup')).not.toBeInTheDocument();
    expect(screen.queryByText('Car')).not.toBeInTheDocument();
  });

  it('handles "Show Missing Only" filter', async () => {
    render(
      <BrowserRouter>
        <PropsMatrix />
      </BrowserRouter>
    );
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading data...')).not.toBeInTheDocument();
    });
    
    // Check the "Show Missing Only" checkbox
    const missingCheckbox = screen.getByLabelText('Show Missing Only');
    fireEvent.click(missingCheckbox);
    
    // Initially all scenes should still be visible since no props are checked
    expect(screen.getByText('INT. APARTMENT - DAY')).toBeInTheDocument();
    expect(screen.getByText('EXT. STREET - NIGHT')).toBeInTheDocument();
    expect(screen.getByText('INT. OFFICE - DAY')).toBeInTheDocument();
    
    // Check some checkboxes to mark props as allocated
    const checkboxes = screen.getAllByRole('checkbox');
    // Check all checkboxes for scene1
    const scene1Checkboxes = checkboxes.filter(checkbox => 
      !checkbox.disabled && checkbox.closest('tr')?.textContent?.includes('INT. APARTMENT - DAY')
    );
    scene1Checkboxes.forEach(checkbox => {
      fireEvent.click(checkbox);
    });
    
    // Scene 1 should no longer be visible with "Show Missing Only" filter
    expect(screen.queryByText('INT. APARTMENT - DAY')).not.toBeInTheDocument();
    // Other scenes should still be visible
    expect(screen.getByText('EXT. STREET - NIGHT')).toBeInTheDocument();
    expect(screen.getByText('INT. OFFICE - DAY')).toBeInTheDocument();
  });

  it('handles sorting by scene number', async () => {
    render(
      <BrowserRouter>
        <PropsMatrix />
      </BrowserRouter>
    );
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading data...')).not.toBeInTheDocument();
    });
    
    // Get the Scene column header
    const sceneHeader = screen.getByText('Scene');
    
    // Click to sort in descending order
    fireEvent.click(sceneHeader);
    fireEvent.click(sceneHeader);
    
    // Check the order of scenes (should be 3, 2, 1)
    const rows = screen.getAllByRole('row');
    const sceneCells = rows.map(row => row.cells?.[0]?.textContent);
    
    // First row is header, then scenes 3, 2, 1
    expect(sceneCells[1]).toBe('3');
    expect(sceneCells[2]).toBe('2');
    expect(sceneCells[3]).toBe('1');
  });

  it('handles checkbox interactions', async () => {
    render(
      <BrowserRouter>
        <PropsMatrix />
      </BrowserRouter>
    );
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading data...')).not.toBeInTheDocument();
    });
    
    // Find a checkbox that should be enabled (Laptop in Scene 1)
    const checkboxes = screen.getAllByRole('checkbox');
    const enabledCheckbox = checkboxes.find(checkbox => 
      !checkbox.disabled && 
      checkbox.closest('tr')?.textContent?.includes('INT. APARTMENT - DAY') &&
      checkbox.closest('td')?.previousSibling?.textContent?.includes('Laptop')
    );
    
    // Click the checkbox
    if (enabledCheckbox) {
      fireEvent.click(enabledCheckbox);
      expect(enabledCheckbox).toBeChecked();
      
      // Click again to uncheck
      fireEvent.click(enabledCheckbox);
      expect(enabledCheckbox).not.toBeChecked();
    }
  });

  it('handles API error state', async () => {
    // Mock API error
    apiClient.getScenes.mockRejectedValue(new Error('Network error'));
    
    render(
      <BrowserRouter>
        <PropsMatrix />
      </BrowserRouter>
    );
    
    // Wait for error to be displayed
    await waitFor(() => {
      expect(screen.getByText('Error Loading Data')).toBeInTheDocument();
      expect(screen.getByText(/Failed to load/)).toBeInTheDocument();
    });
  });
});
