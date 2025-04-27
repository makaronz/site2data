import React, { useState } from 'react';
import {
  Box,
  Button,
  Stack,
  Snackbar,
  Alert,
  CircularProgress,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';

interface DownloadResultsProps {
  jobId: string;
  disabled?: boolean;
}

const files = [
  { label: 'analysis.json', endpoint: 'analysis.json' },
  { label: 'chunks.ndjson', endpoint: 'chunks.ndjson' },
  { label: 'results.zip', endpoint: 'results.zip' },
];

export const DownloadResults: React.FC<DownloadResultsProps> = ({ jobId, disabled }) => {
  const [loading, setLoading] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const handleDownload = async (endpoint: string, label: string) => {
    setLoading(label);
    try {
      const res = await fetch(`/api/job/${jobId}/${endpoint}`);
      if (!res.ok) throw new Error('Błąd pobierania pliku.');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = label;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      setSnackbar({ open: true, message: `Pobrano ${label}.`, severity: 'success' });
    } catch (err: any) {
      setSnackbar({ open: true, message: err.message || 'Błąd pobierania.', severity: 'error' });
    } finally {
      setLoading(null);
    }
  };

  const handleSnackbarClose = () => setSnackbar(s => ({ ...s, open: false }));

  return (
    <Box sx={{ mt: 2 }}>
      <Stack direction="row" spacing={2}>
        {files.map(file => (
          <Button
            key={file.label}
            variant="contained"
            color="primary"
            startIcon={loading === file.label ? <CircularProgress size={20} /> : <DownloadIcon />}
            onClick={() => handleDownload(file.endpoint, file.label)}
            disabled={!!loading || disabled}
            aria-label={`Pobierz ${file.label}`}
          >
            {file.label}
          </Button>
        ))}
      </Stack>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default DownloadResults; 