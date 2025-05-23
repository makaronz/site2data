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
  fileName?: string;
}

const exportOptionsDefinition = (
  fileNameToUse?: string
): { label: string; format: string; filename: string }[] => {
  const baseName = fileNameToUse
    ? fileNameToUse.substring(0, fileNameToUse.lastIndexOf('.')) || fileNameToUse
    : 'analysis';
  return [
    { label: 'Pobierz JSON', format: 'json', filename: `${baseName}_analysis.json` },
  ];
};

export const DownloadResults: React.FC<DownloadResultsProps> = ({ jobId, disabled, fileName }) => {
  console.log('[DownloadResults] Props:', { jobId, fileName, disabled });
  const [loading, setLoading] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const handleDownload = async (format: string, filenameToDownload: string) => {
    console.log('[DownloadResults] handleDownload:', { format, filenameToDownload, jobId });
    setLoading(format);
    try {
      const res = await fetch(`/api/script/${jobId}/export?format=${format}`);
      if (!res.ok) throw new Error('Błąd pobierania pliku.');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filenameToDownload;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      setSnackbar({ open: true, message: `Pobrano ${filenameToDownload}.`, severity: 'success' });
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
        {exportOptionsDefinition(fileName).map(opt => (
          <Button
            key={opt.format}
            variant="contained"
            color="primary"
            startIcon={loading === opt.format ? <CircularProgress size={20} /> : <DownloadIcon />}
            onClick={() => handleDownload(opt.format, opt.filename)}
            disabled={!!loading || disabled}
            aria-label={opt.label}
          >
            {opt.label}
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