import React from 'react';
import { CircularProgress, LinearProgress, Typography, Box, Stack, Alert } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import { ProgressUpdate } from '../types/progress';

interface AnalysisProgressProps {
  progress: ProgressUpdate;
}

const formatTime = (ms: number): string => {
  if (!ms) return '...';
  
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
};

const AnalysisProgress: React.FC<AnalysisProgressProps> = ({ progress }) => {
  return (
    <Box sx={{ bgcolor: 'background.paper', borderRadius: 2, boxShadow: 2, p: 3, mb: 2 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
        <Typography variant="h6" component="h2">
          {progress.stage}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {progress.progress}%
        </Typography>
      </Stack>

      <LinearProgress
        variant="determinate"
        value={progress.progress}
        sx={{ height: 8, borderRadius: 2 }}
        aria-label="Postęp analizy"
      />

      <Stack direction="row" justifyContent="space-between" alignItems="center" mt={2}>
        <Typography variant="body2">{progress.message}</Typography>
        {progress.estimatedTimeRemaining !== undefined && (
          <Typography variant="body2">
            Pozostało: {formatTime(progress.estimatedTimeRemaining)}
          </Typography>
        )}
      </Stack>

      {progress.stage === 'processing' && (
        <Stack direction="row" alignItems="center" justifyContent="center" py={2}>
          <CircularProgress size={24} sx={{ mr: 1 }} />
          <Typography variant="body2">Przetwarzanie...</Typography>
        </Stack>
      )}

      {progress.stage === 'complete' && (
        <Stack direction="row" alignItems="center" justifyContent="center" py={2} color="success.main">
          <CheckCircleIcon sx={{ mr: 1 }} />
          <Typography variant="body2">Analiza zakończona</Typography>
        </Stack>
      )}

      {progress.stage === 'error' && (
        <Alert severity="error" sx={{ mt: 2 }} icon={<ErrorIcon />}>
          Wystąpił błąd
        </Alert>
      )}
    </Box>
  );
};

export default AnalysisProgress; 