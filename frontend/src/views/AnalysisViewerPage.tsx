import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Typography, CircularProgress, Alert, Paper, Button } from '@mui/material';
import apiClient from '../api/apiClient';

// Typ dla statusu analizy
interface AnalysisStatus {
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  progress?: number;
  message?: string;
  results?: {
    scenes?: any[];
    characters?: any[];
    locations?: any[];
    // Inne potencjalne wyniki analizy
  };
}

const AnalysisViewerPage: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const [status, setStatus] = useState<AnalysisStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Funkcja pobierająca status analizy
  const fetchStatus = async () => {
    if (!jobId) return;
    
    try {
      setLoading(true);
      const response = await apiClient.getAnalysisStatus(jobId);
      setStatus(response);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching analysis status:', err);
      setError(err.message || 'Nie udało się pobrać statusu analizy.');
    } finally {
      setLoading(false);
    }
  };

  // Pobierz status przy pierwszym renderowaniu i ustaw interwał
  useEffect(() => {
    fetchStatus();
    
    // Utwórz interwał tylko jeśli status nie jest COMPLETED lub FAILED
    const intervalId = setInterval(() => {
      if (status?.status !== 'COMPLETED' && status?.status !== 'FAILED') {
        fetchStatus();
      }
    }, 10000); // Co 10 sekund, można dostosować

    return () => clearInterval(intervalId);
  }, [jobId, status?.status]); // Zależności: jobId i status.status

  // Obsługa ponownego załadowania
  const handleRefresh = () => {
    fetchStatus();
  };

  // Obsługa błędu
  if (error) {
    return (
      <Box sx={{ m: 2 }}>
        <Alert 
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={handleRefresh}>
              Spróbuj ponownie
            </Button>
          }
        >
          {error}
        </Alert>
      </Box>
    );
  }

  // Obsługa ładowania początkowego
  if (loading && !status) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>Ładowanie statusu analizy...</Typography>
      </Box>
    );
  }

  return (
    <Paper elevation={3} sx={{ m: 2, p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h4" gutterBottom>Status Analizy</Typography>
        <Button 
          variant="outlined" 
          onClick={handleRefresh}
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : 'Odśwież'}
        </Button>
      </Box>
      
      <Typography variant="body2" color="text.secondary" gutterBottom>
        ID zadania: {jobId}
      </Typography>
      
      {status && (
        <>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            mt: 2,
            p: 2,
            bgcolor: 'background.default',
            borderRadius: 1
          }}>
            <Typography variant="h6" sx={{ mr: 2 }}>Status:</Typography>
            <Typography 
              variant="h6" 
              sx={{ 
                color: status.status === 'COMPLETED' 
                  ? 'success.main' 
                  : status.status === 'FAILED' 
                    ? 'error.main' 
                    : 'info.main'
              }}
            >
              {status.status}
            </Typography>
          </Box>
          
          {status.message && (
            <Typography variant="body1" sx={{ mt: 2 }}>
              {status.message}
            </Typography>
          )}
          
          {/* Pasek postępu dla statusu PROCESSING */}
          {status.status === 'PROCESSING' && status.progress !== undefined && (
            <Box sx={{ mt: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2">Postęp analizy:</Typography>
                <Typography variant="body2">{status.progress}%</Typography>
              </Box>
              <CircularProgress 
                variant="determinate" 
                value={status.progress} 
                sx={{ mt: 1, display: 'block', mx: 'auto' }} 
              />
            </Box>
          )}
          
          {/* Wyniki dla statusu COMPLETED */}
          {status.status === 'COMPLETED' && (
            <Box sx={{ mt: 3 }}>
              <Alert severity="success" sx={{ mb: 2 }}>
                Analiza zakończona! Wyniki są gotowe do przeglądania.
              </Alert>
              
              <Typography variant="h5" sx={{ mt: 3 }}>Dostępne analizy:</Typography>
              
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 2 }}>
                <Button 
                  variant="contained" 
                  color="primary"
                  href={`/scene-breakdown?jobId=${jobId}`}
                >
                  Sceny
                </Button>
                <Button 
                  variant="contained" 
                  color="primary"
                  href={`/character-map?jobId=${jobId}`}
                >
                  Postacie
                </Button>
                <Button 
                  variant="contained" 
                  color="primary"
                  href={`/location-planner?jobId=${jobId}`}
                >
                  Lokalizacje
                </Button>
                <Button 
                  variant="contained" 
                  color="primary"
                  href={`/props-matrix?jobId=${jobId}`}
                >
                  Rekwizyty
                </Button>
              </Box>
            </Box>
          )}
          
          {/* Obsługa błędu analizy */}
          {status.status === 'FAILED' && (
            <Alert severity="error" sx={{ mt: 2 }}>
              Analiza nie powiodła się. {status.message || 'Spróbuj ponownie później.'}
            </Alert>
          )}
        </>
      )}
    </Paper>
  );
};

export default AnalysisViewerPage; 