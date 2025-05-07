import React, { useRef, useState } from 'react';
import { Box, Button, Paper, Typography, Snackbar, Alert, LinearProgress, Stack } from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';

interface FileUploaderProps {
  onUploadSuccess?: (file: File, response: any) => void;
  onUploadError?: (error: string) => void;
  accept?: string;
  label?: string;
  endpoint?: string;
  fieldName?: string;
  apiKey?: string;
  model?: string;
  requireApiKey?: boolean;
  beforeUploadButtonContent?: React.ReactNode;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const FileUploader: React.FC<FileUploaderProps> = ({
  onUploadSuccess,
  onUploadError,
  accept = '.pdf,.txt,application/pdf,text/plain',
  label = 'Wybierz plik PDF lub TXT',
  endpoint = '/api/script/analyze',
  fieldName = 'script',
  apiKey,
  model = 'gpt-4-turbo-2024-04-09',
  requireApiKey = false,
  beforeUploadButtonContent,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });
  const [progress, setProgress] = useState<number>(0);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    if (!file) return;
    if (!['application/pdf', 'text/plain'].includes(file.type)) {
      setSnackbar({ open: true, message: 'Dozwolone tylko pliki PDF lub TXT.', severity: 'error' });
      if (onUploadError) onUploadError('Dozwolone tylko pliki PDF lub TXT.');
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setSnackbar({ open: true, message: 'Plik jest za duży (max 10MB).', severity: 'error' });
      if (onUploadError) onUploadError('Plik jest za duży (max 10MB).');
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
      if (onUploadError) onUploadError('Wybierz plik do analizy.');
      return;
    }
    if (requireApiKey && !apiKey) {
      setSnackbar({ open: true, message: 'Podaj klucz API przed wysłaniem pliku.', severity: 'error' });
      return;
    }
    setIsUploading(true);
    setProgress(0);
    try {
      const formData = new FormData();
      formData.append(fieldName, selectedFile);
      formData.append('type', selectedFile.type === 'application/pdf' ? 'pdf' : 'txt');
      if (model) formData.append('model', model);
      const headers: Record<string, string> = {};
      if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;
      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
        headers,
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'Błąd podczas wysyłania pliku.');
      }
      setSnackbar({ open: true, message: 'Plik przesłany! Analiza rozpoczęta.', severity: 'success' });
      setSelectedFile(null);
      if (onUploadSuccess) onUploadSuccess(selectedFile, data);
    } catch (err: any) {
      setSnackbar({ open: true, message: err.message || 'Błąd sieci.', severity: 'error' });
      if (onUploadError) onUploadError(err.message || 'Błąd sieci.');
    } finally {
      setIsUploading(false);
      setProgress(0);
    }
  };

  const handleSnackbarClose = () => setSnackbar(s => ({ ...s, open: false }));

  return (
    <Paper elevation={3} sx={{ p: 4, mb: 3 }}>
      <form onSubmit={handleSubmit} aria-label="Formularz uploadu pliku">
        <Stack spacing={3}>
          <Typography variant="h6" fontWeight={700}>{label}</Typography>
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            style={{ display: 'none' }}
            onChange={handleFileChange}
            aria-label={label}
            tabIndex={0}
          />
          <Stack direction="row" spacing={2} alignItems="center">
            {beforeUploadButtonContent}
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
          </Stack>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={isUploading || !selectedFile || (requireApiKey && !apiKey)}
            aria-label="Wyślij plik do analizy"
          >
            {isUploading ? 'Wysyłanie...' : 'Analizuj'}
          </Button>
          {requireApiKey && !apiKey && (
            <Alert severity="warning" sx={{ mt: 1 }}>
              Podaj klucz API, aby przesłać plik do analizy.
            </Alert>
          )}
          {isUploading && <LinearProgress aria-label="Wysyłanie pliku" />}
          <Alert severity="info">
            Dozwolone pliki: <b>PDF</b> lub <b>TXT</b>, maksymalnie 10MB.
          </Alert>
        </Stack>
      </form>
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
    </Paper>
  );
};

export default FileUploader; 