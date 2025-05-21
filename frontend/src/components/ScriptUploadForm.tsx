import React, { useRef, useState } from 'react';
import {
  Box,
  Button,
  Container,
  Paper,
  Stack,
  Typography,
  Snackbar,
  Alert,
  LinearProgress,
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import apiClient from '../../api/apiClient';

interface ScriptUploadFormProps {
  onJobCreated?: (jobId: string, fileName: string) => void;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const ScriptUploadForm: React.FC<ScriptUploadFormProps> = ({ onJobCreated }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    if (!file) return;
    if (!['application/pdf', 'text/plain'].includes(file.type)) {
      setSnackbar({ open: true, message: 'Dozwolone tylko pliki PDF lub TXT.', severity: 'error' });
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setSnackbar({ open: true, message: 'Plik jest za duży (max 10MB).', severity: 'error' });
      return;
    }
    setSelectedFile(file);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedFile) {
      setSnackbar({ open: true, message: 'Wybierz plik do analizy.', severity: 'error' });
      return;
    }
    setIsUploading(true);
    setUploadProgress(0);

    const handleUploadProgress = (progressEvent: any) => {
      const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
      setUploadProgress(percentCompleted);
    };

    try {
      const analysisResponse = await apiClient.uploadScriptAndStartAnalysis(
        selectedFile,
        handleUploadProgress
      );

      setSnackbar({ 
        open: true, 
        message: `Rozpoczęto analizę (Job ID: ${analysisResponse.jobId}). Możesz śledzić postęp.`, 
        severity: 'success' 
      });

      const originalFileName = selectedFile.name;
      setSelectedFile(null);
      if (onJobCreated && analysisResponse.jobId) {
        onJobCreated(analysisResponse.jobId, originalFileName);
      }
    } catch (err: any) {
      setUploadProgress(0);
      setSnackbar({ open: true, message: err.message || 'Błąd podczas wysyłania lub rozpoczynania analizy.', severity: 'error' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSnackbarClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbar(s => ({ ...s, open: false }));
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 6 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <form onSubmit={handleSubmit} aria-label="Formularz uploadu scenariusza">
          <Stack spacing={3}>
            <Typography variant="h5" component="h1" fontWeight={700}>
              Prześlij scenariusz do analizy
            </Typography>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.txt,application/pdf,text/plain"
              style={{ display: 'none' }}
              onChange={handleFileChange}
              aria-label="Wybierz plik PDF lub TXT"
              tabIndex={0}
            />
            <Box>
              <Button
                variant="contained"
                startIcon={<UploadFileIcon />}
                onClick={handleUploadClick}
                aria-label="Wybierz plik"
                disabled={isUploading}
              >
                {selectedFile ? 'Zmień plik' : 'Wybierz plik'}
              </Button>
              {selectedFile && (
                <Typography variant="body2" sx={{ ml: 2, display: 'inline' }}>
                  {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                </Typography>
              )}
            </Box>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={isUploading || !selectedFile}
              aria-label="Wyślij plik do analizy"
            >
              {isUploading ? 'Trwa wysyłanie scenariusza...' : 'Prześlij i analizuj scenariusz'}
            </Button>
            {isUploading && (
              <Box sx={{ width: '100%', textAlign: 'center', mt: 1 }}>
                <LinearProgress variant="determinate" value={uploadProgress} aria-label="Postęp wysyłania" />
                <Typography variant="body2" sx={{ mt: 1 }}>
                  {uploadProgress < 100 ? `Wysyłanie: ${uploadProgress}%` : 'Plik wysłany, rozpoczynanie analizy...'}
                </Typography>
              </Box>
            )}
            <Alert severity="info">
              Dozwolone pliki: <b>PDF</b> lub <b>TXT</b>, maksymalnie 10MB.
            </Alert>
          </Stack>
        </form>
      </Paper>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
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
    </Container>
  );
};

export default ScriptUploadForm; 