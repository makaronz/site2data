import React from 'react';
import {
  Box,
  Typography,
  LinearProgress,
  Alert,
  Button,
} from '@mui/material';
import useJobStatus from '../hooks/useJobStatus'; // Założenie poprawnej ścieżki

interface JobStatusDisplayProps {
  jobId: string | null;
}

const JobStatusDisplay: React.FC<JobStatusDisplayProps> = ({ jobId }) => {
  const {
    jobId: currentJobDisplayId,
    status,
    progress,
    message,
    finalResultUrl,
    error,
    // isConnected, // Jeśli hook useJobStatus będzie to zwracał
  } = useJobStatus(jobId);

  if (!currentJobDisplayId) {
    return null; // Nie wyświetlaj nic, jeśli nie ma jobId
  }

  // Symulacja isConnected dla celów UI, dopóki hook tego nie obsłuży
  const isConnected = status !== 'PENDING' || progress > 0; 

  return (
    <Box sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h6" gutterBottom>
        Postęp przetwarzania zadania: {currentJobDisplayId}
      </Typography>

      {/* Pasek postępu widoczny, gdy jest połączenie i zadanie nie jest zakończone/nieudane */}
      {isConnected && status !== 'COMPLETED' && status !== 'FAILED' && (
        <LinearProgress variant="determinate" value={progress} sx={{ mb: 2 }} />
      )}

      {/* Komunikat o statusie i postępie */}
      {message && status !== 'COMPLETED' && status !== 'FAILED' &&  (
        <Typography variant="body1" sx={{ mb: 1 }}>
          Status: {status || 'Oczekiwanie...'} ({progress}%)
        </Typography>
      )}
      {message && status !== 'COMPLETED' && status !== 'FAILED' && (
        <Typography variant="body2" sx={{ mb: 2, fontStyle: 'italic' }}>
          Wiadomość: {message}
        </Typography>
      )}

      {/* Komunikat o łączeniu, jeśli nie ma połączenia, ale jest jobId i zadanie nie jest zakończone */}
      {!isConnected && currentJobDisplayId && status !== 'COMPLETED' && status !== 'FAILED' && !error && (
        <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
          Łączenie z serwerem w celu śledzenia postępu...
        </Typography>
      )}

      {/* Błąd przetwarzania */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
      )}

      {/* Sukces przetwarzania */}
      {status === 'COMPLETED' && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Przetwarzanie zakończone pomyślnie!
          {finalResultUrl && (
            <Button
              variant="contained"
              color="primary"
              href={finalResultUrl}
              target="_blank"
              rel="noopener noreferrer"
              sx={{ ml: 2 }}
            >
              Pobierz wyniki
            </Button>
          )}
          {!finalResultUrl && message && (
             <Typography variant="body2" sx={{ display: 'inline', ml: 1 }}>{message}</Typography>
          )}
        </Alert>
      )}

      {/* Niepowodzenie przetwarzania (jeśli nie ma już wyświetlonego `error`) */}
      {status === 'FAILED' && !error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Przetwarzanie nie powiodło się. {message || 'Nieznany błąd.'}
        </Alert>
      )}
    </Box>
  );
};

export default JobStatusDisplay; 