import React from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';
import axios from 'axios';

/**
 * API client for ai_CineHub backend
 * 
 * Provides methods for interacting with the backend API endpoints
 */
const apiClient = {
  /**
   * Base URL for API requests
   */
  baseURL: '/api',
  
  /**
   * Get all scenes
   */
  getScenes: async () => {
    try {
      const response = await axios.get(`${apiClient.baseURL}/scenes`);
      return response.data.scenes || [];
    } catch (error) {
      console.error('Error fetching scenes:', error);
      throw error;
    }
  },
  
  /**
   * Get a specific scene by ID
   */
  getSceneById: async (id: string) => {
    try {
      const response = await axios.get(`${apiClient.baseURL}/scenes/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching scene ${id}:`, error);
      throw error;
    }
  },
  
  /**
   * Get character graph data
   */
  getCharacterGraph: async () => {
    try {
      const response = await axios.get(`${apiClient.baseURL}/graph/characters`);
      return response.data;
    } catch (error) {
      console.error('Error fetching character graph:', error);
      throw error;
    }
  },
  
  /**
   * Get character graph data for a specific scene
   */
  getSceneCharacterGraph: async (sceneId: string) => {
    try {
      const response = await axios.get(`${apiClient.baseURL}/graph/scene/${sceneId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching character graph for scene ${sceneId}:`, error);
      throw error;
    }
  },
  
  /**
   * Get all locations
   */
  getLocations: async () => {
    try {
      const response = await axios.get(`${apiClient.baseURL}/locations`);
      return response.data;
    } catch (error) {
      console.error('Error fetching locations:', error);
      throw error;
    }
  },
  
  /**
   * Get shooting schedule
   */
  getSchedule: async () => {
    try {
      const response = await axios.get(`${apiClient.baseURL}/schedule`);
      return response.data;
    } catch (error) {
      console.error('Error fetching schedule:', error);
      throw error;
    }
  },
  
  /**
   * Get all props
   */
  getProps: async () => {
    try {
      const response = await axios.get(`${apiClient.baseURL}/props`);
      return response.data;
    } catch (error) {
      console.error('Error fetching props:', error);
      throw error;
    }
  },
  
  /**
   * Get production risks
   */
  getRisks: async () => {
    try {
      const response = await axios.get(`${apiClient.baseURL}/scenes/risks`);
      return response.data;
    } catch (error) {
      console.error('Error fetching risks:', error);
      throw error;
    }
  }
};

/**
 * Loading component for data fetching
 */
export const LoadingIndicator: React.FC = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
    <CircularProgress />
    <Typography variant="body1" sx={{ ml: 2 }}>
      Loading data...
    </Typography>
  </Box>
);

/**
 * Error component for data fetching errors
 */
export const ErrorIndicator: React.FC<{ message: string }> = ({ message }) => (
  <Box sx={{ 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    height: '200px',
    color: 'error.main',
    flexDirection: 'column'
  }}>
    <Typography variant="h6" gutterBottom>
      Error Loading Data
    </Typography>
    <Typography variant="body1">
      {message}
    </Typography>
  </Box>
);

export default apiClient;
