import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import apiClient, { LoadingIndicator, ErrorIndicator } from '../api/apiClient';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('apiClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch scenes successfully', async () => {
    const mockData = [{ id: 1, number: 1, location: 'INT. APARTMENT - DAY' }];
    mockedAxios.get.mockResolvedValueOnce({ data: mockData });

    const result = await apiClient.getScenes();
    
    expect(mockedAxios.get).toHaveBeenCalledWith('/api/scenes');
    expect(result).toEqual(mockData);
  });

  it('should handle errors when fetching scenes', async () => {
    const errorMessage = 'Network Error';
    mockedAxios.get.mockRejectedValueOnce(new Error(errorMessage));

    await expect(apiClient.getScenes()).rejects.toThrow();
    expect(mockedAxios.get).toHaveBeenCalledWith('/api/scenes');
  });

  it('should fetch a specific scene by ID', async () => {
    const mockData = { id: '123', number: 1, location: 'INT. APARTMENT - DAY' };
    mockedAxios.get.mockResolvedValueOnce({ data: mockData });

    const result = await apiClient.getSceneById('123');
    
    expect(mockedAxios.get).toHaveBeenCalledWith('/api/scenes/123');
    expect(result).toEqual(mockData);
  });

  it('should fetch character graph data', async () => {
    const mockData = { nodes: [], edges: [] };
    mockedAxios.get.mockResolvedValueOnce({ data: mockData });

    const result = await apiClient.getCharacterGraph();
    
    expect(mockedAxios.get).toHaveBeenCalledWith('/api/graph/characters');
    expect(result).toEqual(mockData);
  });

  it('should fetch locations', async () => {
    const mockData = [{ id: 1, name: 'APARTMENT' }];
    mockedAxios.get.mockResolvedValueOnce({ data: mockData });

    const result = await apiClient.getLocations();
    
    expect(mockedAxios.get).toHaveBeenCalledWith('/api/locations');
    expect(result).toEqual(mockData);
  });
});

describe('UI Components', () => {
  it('renders LoadingIndicator correctly', () => {
    render(<LoadingIndicator />);
    
    expect(screen.getByText('Loading data...')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders ErrorIndicator correctly', () => {
    const errorMessage = 'Failed to load data';
    render(<ErrorIndicator message={errorMessage} />);
    
    expect(screen.getByText('Error Loading Data')).toBeInTheDocument();
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });
});
