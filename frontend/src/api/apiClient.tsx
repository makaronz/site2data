import React from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';
import axios from 'axios';
// Importy ze wspólnych schematów, kopie lokalne z pakietu
import { 
  PresignedUrlRequest, 
  PresignedUrlResponse, 
  NotifyUploadCompleteResponse,
  NotifyUploadCompleteRequest
} from '../schemas/job.schema';

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
  getScenes: async (jobId?: string) => {
    try {
      const path = jobId ? `${apiClient.baseURL}/jobs/${jobId}/analysis/scenes` : `${apiClient.baseURL}/scenes`;
      const response = await axios.get(path);
      return response.data.scenes || response.data || [];
    } catch (error) {
      console.error('Error fetching scenes:', error);
      throw error;
    }
  },
  
  /**
   * Get a specific scene by ID
   */
  getSceneById: async (id: string, jobId?: string) => {
    try {
      const path = jobId ? `${apiClient.baseURL}/jobs/${jobId}/analysis/scenes/${id}` : `${apiClient.baseURL}/scenes/${id}`;
      const response = await axios.get(path);
      return response.data;
    } catch (error) {
      console.error(`Error fetching scene ${id}:`, error);
      throw error;
    }
  },
  
  /**
   * Get character graph data
   */
  getCharacterGraph: async (jobId: string) => {
    try {
      const response = await axios.get(`${apiClient.baseURL}/jobs/${jobId}/analysis/graph-data`);
      return response.data;
    } catch (error) {
      console.error('Error fetching character graph:', error);
      throw error;
    }
  },
  
  /**
   * Get character graph data for a specific scene
   */
  getSceneCharacterGraph: async (jobId: string, sceneId: string) => {
    try {
      const response = await axios.get(`${apiClient.baseURL}/jobs/${jobId}/analysis/scenes/${sceneId}/graph`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching character graph for scene ${sceneId}:`, error);
      throw error;
    }
  },
  
  /**
   * Get all locations
   */
  getLocations: async (jobId: string) => {
    try {
      const response = await axios.get(`${apiClient.baseURL}/jobs/${jobId}/analysis/locations`);
      return response.data;
    } catch (error) {
      console.error('Error fetching locations:', error);
      throw error;
    }
  },
  
  /**
   * Get shooting schedule
   */
  getSchedule: async (jobId: string) => {
    try {
      const response = await axios.get(`${apiClient.baseURL}/jobs/${jobId}/analysis/schedule`);
      return response.data;
    } catch (error) {
      console.error('Error fetching schedule:', error);
      throw error;
    }
  },
  
  /**
   * Get all props
   */
  getProps: async (jobId: string) => {
    try {
      const response = await axios.get(`${apiClient.baseURL}/jobs/${jobId}/analysis/props`);
      return response.data;
    } catch (error) {
      console.error('Error fetching props:', error);
      throw error;
    }
  },
  
  /**
   * Get production risks
   */
  getRisks: async (jobId: string) => {
    try {
      const response = await axios.get(`${apiClient.baseURL}/jobs/${jobId}/analysis/risks`);
      return response.data;
    } catch (error) {
      console.error('Error fetching risks:', error);
      throw error;
    }
  },

  /**
   * Step 1: Request a presigned URL for file upload.
   * DEPRECATED: Current backend doesn't support presigned URLs, use uploadScriptAndStartAnalysis instead
   */
  /*
  async getPresignedUploadUrl(requestData: PresignedUrlRequest): Promise<PresignedUrlResponse> {
    try {
      const response = await axios.post<PresignedUrlResponse>(
        `${apiClient.baseURL}/jobs/presigned-url`,
        requestData
      );
      return response.data;
    } catch (error: any) {
      console.error('Error getting presigned upload URL:', error);
      
      // Sprawdź czy to błąd 501 (Not Implemented)
      if (error.response?.status === 501) {
        throw new Error('Upload functionality is not available in the current backend configuration. Please switch to the full API implementation.');
      }
      
      // Sprawdź czy to błąd sieci
      if (!error.response) {
        throw new Error('Unable to connect to the backend. Please ensure the server is running.');
      }
      
      throw new Error(error.response?.data?.message || 'Failed to get upload URL');
    }
  },
  */

  /**
   * Step 3: Notify backend that upload is complete to trigger analysis.
   * DEPRECATED: Current backend doesn't support this workflow, use uploadScriptAndStartAnalysis instead
   */
  /*
  async notifyUploadComplete(jobId: string, data: NotifyUploadCompleteRequest): Promise<NotifyUploadCompleteResponse> {
    try {
      const response = await axios.post<NotifyUploadCompleteResponse>(
        `${apiClient.baseURL}/jobs/${jobId}/notify-upload-complete`,
        data
      );
      return response.data;
    } catch (error: any) {
      console.error(`Error notifying upload complete for job ${jobId}:`, error);
      
      // Sprawdź czy to błąd 501 (Not Implemented)
      if (error.response?.status === 501) {
        throw new Error('Upload notification functionality is not available in the current backend configuration.');
      }
      
      // Sprawdź czy to błąd sieci
      if (!error.response) {
        throw new Error('Unable to connect to the backend. Please ensure the server is running.');
      }
      
      throw new Error(error.response?.data?.message || 'Failed to notify upload completion');
    }
  },
  */

  /**
   * Unified function to handle the entire upload and analysis initiation process.
   * Simplified version that uses direct upload to /api/script/analyze
   */
  async uploadScriptAndStartAnalysis(
    file: File, 
    onUploadProgress?: (progressEvent: any) => void
  ): Promise<{ jobId: string; message: string; result?: any }> {
    try {
      const formData = new FormData();
      formData.append('script', file);

      const response = await axios.post(`${apiClient.baseURL}/script/analyze`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: onUploadProgress,
      });

      if (!response.data.success) {
        throw new Error(response.data.message || 'Upload failed');
      }

      return {
        jobId: response.data.id || Date.now().toString(),
        message: response.data.message || 'Analysis completed successfully',
        result: response.data.result
      };
    } catch (error: any) {
      console.error('Error uploading script:', error);
      
      // Sprawdź czy to błąd sieci
      if (!error.response) {
        throw new Error('Unable to connect to the backend. Please ensure the server is running.');
      }
      
      // Sprawdź kod błędu
      if (error.response?.status === 413) {
        throw new Error('File is too large. Maximum size is 10MB.');
      }
      
      if (error.response?.status === 400) {
        throw new Error(error.response?.data?.message || 'Invalid file. Only PDF and TXT files are allowed.');
      }
      
      throw new Error(error.response?.data?.message || 'Failed to upload and analyze script');
    }
  },

  /**
   * Get analysis status for a job
   */
  async getAnalysisStatus(jobId: string) {
    try {
      const response = await axios.get(`${apiClient.baseURL}/jobs/${jobId}/status`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching status for job ${jobId}:`, error);
      throw error;
    }
  },
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
