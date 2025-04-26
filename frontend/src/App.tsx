// Projekt używa Material UI jako jedynego systemu stylowania
import React, { useState, useEffect } from 'react';
import { Box, Button, Container, Paper, Typography, CircularProgress, Snackbar, Alert, Stack } from '@mui/material';
import { useDropzone } from 'react-dropzone';
import PDFUpload from './components/PDFUpload';
import UploadProgress from './components/UploadProgress';
import type { WebSocketMessage, AnalysisResult, AnalysisProgress, AnalysisSection } from './types';
import { Cache } from './utils/cache';
import { OfflineManager } from './utils/offline';
import { validateFile, formatFileSize } from './utils/fileValidation';
import AnalysisMenu from './components/AnalysisMenu';
import Graph from './components/Graph';

function App() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [analysisProgress, setAnalysisProgress] = useState<AnalysisProgress | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [pdfText, setPdfText] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [activeSection, setActiveSection] = useState<AnalysisSection>('Metadane produkcji');
  const [snackbar, setSnackbar] = useState<{open: boolean, message: string, severity: 'success'|'error'|'info'|'warning'}>({open: false, message: '', severity: 'info'});

  const cache = Cache.getInstance();
  const offlineManager = OfflineManager.getInstance();

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//localhost:3001/ws/script-analysis`;
    const websocket = new WebSocket(wsUrl);
    websocket.onopen = () => setError(null);
    websocket.onmessage = (event) => {
      try {
        const data: WebSocketMessage = JSON.parse(event.data);
        if (data.type === 'ANALYSIS_RESULT') {
          if (data.result) {
            setAnalysisResult(data.result);
            setAnalysisProgress(null);
            if (selectedFile) cache.set(selectedFile.name, data.result);
          } else {
            setError('Błąd: Brak wyników analizy');
            setAnalysisResult(null);
            setAnalysisProgress(null);
          }
        } else if (data.type === 'PROGRESS') {
          if (data.message) {
            setAnalysisProgress({ stage: 'processing', progress: 0, message: data.message });
          }
        } else if (data.type === 'ERROR') {
          setError(data.message || 'Wystąpił nieznany błąd');
          setAnalysisResult(null);
          setAnalysisProgress(null);
        }
      } catch (error) {
        setError('Błąd przetwarzania odpowiedzi z serwera');
      }
    };
    websocket.onerror = () => setError('Błąd połączenia WebSocket. Sprawdź, czy backend jest uruchomiony i obsługuje WebSocket.');
    websocket.onclose = (event) => {
      if (event.code !== 1000) setError(`Połączenie WebSocket zostało zamknięte: ${event.reason || 'Nieznany powód'}`);
    };
    setWs(websocket);
    return () => {
      if (websocket.readyState === WebSocket.OPEN) websocket.close(1000, 'Komponent został odmontowany');
    };
  }, []);

  const onDrop = (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      const validationResult = validateFile(file);
      if (!validationResult.isValid) {
        setSnackbar({open: true, message: validationResult.error || 'Nieprawidłowy plik', severity: 'error'});
        return;
      }
      setSelectedFile(file);
      setUploadStatus('');
      setError(null);
      setAnalysisResult(null);
      setAnalysisProgress(null);
      setUploadProgress(0);
      const cachedResult = cache.get<AnalysisResult>(file.name);
      if (cachedResult) setAnalysisResult(cachedResult);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    multiple: false
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setSnackbar({open: true, message: 'Proszę wybrać plik PDF', severity: 'warning'});
      return;
    }
    setIsUploading(true);
    setUploadProgress(0);
    const formData = new FormData();
    formData.append('script', selectedFile);
    formData.append('type', 'pdf');
    try {
      if (!offlineManager.isOnline()) {
        offlineManager.addToQueue('/api/script/analyze', 'POST', formData);
        setSnackbar({open: true, message: 'Aplikacja jest offline. Żądanie zostanie wysłane po przywróceniu połączenia.', severity: 'info'});
        return;
      }
      const response = await fetch('/api/script/analyze', { method: 'POST', body: formData });
      const data = await response.json();
      if (response.ok) {
        setSnackbar({open: true, message: 'Plik został pomyślnie przesłany!', severity: 'success'});
        setSelectedFile(null);
      } else {
        setSnackbar({open: true, message: data.error || 'Wystąpił błąd podczas przesyłania pliku', severity: 'error'});
      }
    } catch (error) {
      setSnackbar({open: true, message: 'Wystąpił błąd podczas połączenia z serwerem', severity: 'error'});
    } finally {
      setIsUploading(false);
    }
  };

  const handleAnalyze = () => {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      setSnackbar({open: true, message: 'Błąd: Brak połączenia WebSocket', severity: 'error'});
      return;
    }
    if (!selectedFile) {
      setSnackbar({open: true, message: 'Proszę wybrać plik do analizy', severity: 'warning'});
      return;
    }
    const message: WebSocketMessage = { type: 'ANALYZE_SCRIPT', script: selectedFile };
    ws.send(JSON.stringify(message));
    setAnalysisProgress({ stage: 'uploading', progress: 0, message: 'Rozpoczynam analizę...' });
  };

  const handleUploadSuccess = (text: string) => {
    setPdfText(text);
    setError(null);
  };

  const handleUploadError = (errorMessage: string) => {
    setError(errorMessage);
    setPdfText('');
  };

  const handleSnackbarClose = () => setSnackbar(s => ({...s, open: false}));

  return (
    <Container maxWidth="lg" sx={{ minHeight: '100vh', bgcolor: 'background.default', py: 4 }}>
      <Paper elevation={3} sx={{ p: { xs: 2, md: 4 }, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Prześlij scenariusz
        </Typography>
        <Box
          {...getRootProps()}
          sx={{
            border: '2px dashed',
            borderColor: isDragActive ? 'primary.main' : 'grey.400',
            borderRadius: 2,
            p: 4,
            textAlign: 'center',
            cursor: 'pointer',
            bgcolor: isDragActive ? 'grey.100' : 'background.paper',
            transition: 'border-color 0.2s',
            outline: 'none',
            mb: 2
          }}
          aria-label="Strefa przesyłania pliku PDF"
          tabIndex={0}
        >
          <input {...getInputProps()} aria-label="Wybierz plik PDF" />
          <Typography color={isDragActive ? 'primary.main' : 'text.secondary'}>
            {isDragActive ? 'Upuść plik tutaj...' : 'Przeciągnij i upuść plik PDF tutaj, lub kliknij aby wybrać plik'}
          </Typography>
        </Box>
        {selectedFile && (
          <Box sx={{ mt: 2 }}>
            <Typography color="text.secondary">Wybrany plik: {selectedFile.name}</Typography>
            <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleSubmit}
                disabled={isUploading}
                aria-label="Prześlij plik"
              >
                {isUploading ? <CircularProgress size={24} color="inherit" /> : 'Prześlij'}
              </Button>
              <Button
                variant="outlined"
                color="secondary"
                onClick={() => setSelectedFile(null)}
                aria-label="Anuluj wybór pliku"
              >
                Anuluj
              </Button>
            </Stack>
          </Box>
        )}
        {analysisProgress && (
          <Box sx={{ mt: 2 }}>
            <CircularProgress size={24} color="primary" />
            <Typography sx={{ ml: 2 }} component="span">{analysisProgress.message}</Typography>
          </Box>
        )}
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>
        )}
        {uploadStatus && (
          <Alert severity="success" sx={{ mt: 2 }}>{uploadStatus}</Alert>
        )}
      </Paper>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={4}>
        <Box sx={{ width: { xs: '100%', md: '25%' } }}>
          <AnalysisMenu activeSection={activeSection} onSectionChange={setActiveSection} />
        </Box>
        <Box sx={{ width: { xs: '100%', md: '75%' } }}>
          {activeSection === 'Metadane produkcji' && (
            <Paper elevation={2} sx={{ p: 3, mb: 2 }}>
              <Typography variant="h5" gutterBottom>Metadane produkcji</Typography>
              <Typography color="text.secondary">(Tu pojawią się metadane produkcji po analizie PDF)</Typography>
            </Paper>
          )}
          {activeSection === 'Struktura scen' && (
            <Paper elevation={2} sx={{ p: 3, mb: 2 }}>
              <Typography variant="h5" gutterBottom>Struktura scen</Typography>
              <Typography color="text.secondary">(Tu pojawi się struktura scen)</Typography>
            </Paper>
          )}
          {activeSection === 'Postaci' && (
            <Paper elevation={2} sx={{ p: 3, mb: 2 }}>
              <Typography variant="h5" gutterBottom>Postaci</Typography>
              <Typography color="text.secondary">(Tu pojawi się lista postaci)</Typography>
            </Paper>
          )}
          {activeSection === 'Relacje' && (
            <Paper elevation={2} sx={{ p: 3, mb: 2 }}>
              <Typography variant="h5" gutterBottom>Relacje</Typography>
              <Typography color="text.secondary">(Tu pojawi się macierz relacji)</Typography>
            </Paper>
          )}
          {activeSection === 'Tematy i klastery' && (
            <Paper elevation={2} sx={{ p: 3, mb: 2 }}>
              <Typography variant="h5" gutterBottom>Tematy i klastery</Typography>
              <Typography color="text.secondary">(Tu pojawią się tematy i klastery)</Typography>
            </Paper>
          )}
          {activeSection === 'Zasoby produkcyjne' && (
            <Paper elevation={2} sx={{ p: 3, mb: 2 }}>
              <Typography variant="h5" gutterBottom>Zasoby produkcyjne</Typography>
              <Typography color="text.secondary">(Tu pojawią się zasoby produkcyjne)</Typography>
            </Paper>
          )}
          {activeSection === 'Pacing & statystyki techniczne' && (
            <Paper elevation={2} sx={{ p: 3, mb: 2 }}>
              <Typography variant="h5" gutterBottom>Pacing & statystyki techniczne</Typography>
              <Typography color="text.secondary">(Tu pojawią się statystyki techniczne)</Typography>
            </Paper>
          )}
          {activeSection === 'Budżetowe czerwone flagi' && (
            <Paper elevation={2} sx={{ p: 3, mb: 2 }}>
              <Typography variant="h5" gutterBottom>Budżetowe czerwone flagi</Typography>
              <Typography color="text.secondary">(Tu pojawią się flagi budżetowe)</Typography>
            </Paper>
          )}
          {activeSection === 'Ekstra' && (
            <Paper elevation={2} sx={{ p: 3, mb: 2 }}>
              <Typography variant="h5" gutterBottom>Ekstra</Typography>
              <Typography color="text.secondary">(Tu pojawią się dodatkowe insighty)</Typography>
            </Paper>
          )}
          {activeSection === 'Graf' && <Graph />}
        </Box>
      </Stack>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}

export default App; 