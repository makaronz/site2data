// Projekt używa Material UI jako jedynego systemu stylowania
import React, { useState, useEffect } from 'react';
import { Box, Button, Container, Paper, Typography, CircularProgress, Snackbar, Alert, Stack, LinearProgress, Fade, Toolbar } from '@mui/material';
import { useDropzone } from 'react-dropzone';
import PDFUpload from './components/PDFUpload';
import UploadProgress from './components/UploadProgress';
import type { WebSocketMessage, AnalysisResult, AnalysisProgress, AnalysisSection } from './types';
import { Cache } from './utils/cache';
import { OfflineManager } from './utils/offline';
import { validateFile, formatFileSize } from './utils/fileValidation';
import AnalysisMenu from './components/AnalysisMenu';
import Graph from './components/Graph';
import Sidebar from './components/Sidebar';
import TopAppBar from './components/TopAppBar';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import GraphView, { type Scene, type SceneRelation } from './components/GraphView';
import ApiKeyInput from './components/ApiKeyInput';
import FileUploader from './components/FileUploader';
import DownloadResults from './components/DownloadResults';
import GraphVisualization from './components/GraphVisualization';
// @ts-ignore
import Papa from 'papaparse';

const MAX_SIZE_MB = 10;
const drawerWidth = 240;

// Przykładowe dane (docelowo z backendu)
const scenes: Scene[] = [
  { id: '1', title: 'Scena otwarcia', description: 'Bohater wchodzi do miasta.', characters: ['Anna', 'Jan'], x: 100, y: 100 },
  { id: '2', title: 'Konflikt', description: 'Dochodzi do kłótni.', characters: ['Jan', 'Marek'], x: 400, y: 100 },
  { id: '3', title: 'Finał', description: 'Wszyscy się godzą.', characters: ['Anna', 'Marek'], x: 250, y: 250 },
];
const relations: SceneRelation[] = [
  { id: 'e1-2', source: '1', target: '2' },
  { id: 'e2-3', source: '2', target: '3' },
];

// Funkcje do parsowania CSV na obiekty Scene i SceneRelation
function parseScenesCSV(csv: string): Scene[] {
  const { data } = Papa.parse(csv, { header: true, skipEmptyLines: true });
  return (data as any[]).map(row => ({
    id: String(row.id),
    title: row.title || '',
    description: row.description || '',
    characters: row.characters ? String(row.characters).split(',').map((c: string) => c.trim()) : [],
    x: row.x ? Number(row.x) : undefined,
    y: row.y ? Number(row.y) : undefined,
  }));
}

function parseRelationsCSV(csv: string): SceneRelation[] {
  const { data } = Papa.parse(csv, { header: true, skipEmptyLines: true });
  return (data as any[]).map(row => ({
    id: String(row.id),
    source: String(row.source),
    target: String(row.target),
    type: row.type || undefined,
  }));
}

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
  const [activeSection, setActiveSection] = useState<AnalysisSection>('METADANE PRODUKCJI');
  const [snackbar, setSnackbar] = useState<{open: boolean, message: string, severity: 'success'|'error'|'info'|'warning'}>({open: false, message: '', severity: 'info'});
  const [openaiApiKey, setOpenaiApiKey] = useState<string>('');
  const [currentSnippet, setCurrentSnippet] = useState<string>('');
  const [showSnippet, setShowSnippet] = useState<boolean>(false);
  const [selectedSection, setSelectedSection] = useState<string>('Dashboard');
  const [darkMode, setDarkMode] = useState<boolean>(true);
  const [graphData, setGraphData] = useState<{ scenes: Scene[]; relations: SceneRelation[] } | null>(null);
  const [graphLoading, setGraphLoading] = useState(false);
  const [scriptId, setScriptId] = useState<string | null>(null);

  const cache = Cache.getInstance();
  const offlineManager = OfflineManager.getInstance();

  const theme = createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
      primary: { main: '#FFB300' },
      secondary: { main: '#FF6F00' },
      background: {
        default: darkMode ? '#181A20' : '#fff',
        paper: darkMode ? '#23263A' : '#f5f5f5',
      },
    },
    shape: { borderRadius: 16 },
    typography: { fontFamily: 'Montserrat, Inter, Arial, sans-serif' },
  });

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

  useEffect(() => {
    if (analysisResult) {
      console.log('Otrzymano wyniki analizy:', analysisResult);
    }
  }, [analysisResult]);

  useEffect(() => {
    if (selectedSection === 'Graf' && scriptId) {
      setGraphLoading(true);
      Promise.all([
        fetch(`/api/script/${scriptId}/graph/nodes`).then(res => res.ok ? res.text() : null),
        fetch(`/api/script/${scriptId}/graph/edges`).then(res => res.ok ? res.text() : null)
      ])
        .then(([nodesCsv, edgesCsv]) => {
          const scenes = nodesCsv ? parseScenesCSV(nodesCsv) : [];
          const relations = edgesCsv ? parseRelationsCSV(edgesCsv) : [];
          setGraphData({ scenes, relations });
        })
        .catch(() => setGraphData(null))
        .finally(() => setGraphLoading(false));
    }
  }, [selectedSection, scriptId]);

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
    if (!openaiApiKey || !openaiApiKey.startsWith('sk-')) {
      setSnackbar({open: true, message: 'Wprowadź poprawny klucz OpenAI API (np. zaczynający się od sk-)', severity: 'warning'});
      return;
    }
    setIsUploading(true);
    setUploadProgress(0);
    const formData = new FormData();
    formData.append('script', selectedFile);
    formData.append('type', 'pdf');
    formData.append('model', 'gpt-4-turbo-2024-04-09');
    try {
      if (!offlineManager.isOnline()) {
        offlineManager.addToQueue('/api/script/analyze', 'POST', formData);
        setSnackbar({open: true, message: 'Aplikacja jest offline. Żądanie zostanie wysłane po przywróceniu połączenia.', severity: 'info'});
        return;
      }
      const response = await fetch('/api/script/analyze', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`
        }
      });
      const data = await response.json();
      if (response.ok) {
        setSnackbar({open: true, message: 'Plik został pomyślnie przesłany!', severity: 'success'});
        setSelectedFile(null);
        if (data.id) setScriptId(data.id);
        if (data.result) {
          setAnalysisResult(data.result);
          if (selectedFile) cache.set(selectedFile.name, data.result);
        }
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
    
    // Zamiast wysyłać plik przez WebSocket, używamy RESTowego endpointu
    const formData = new FormData();
    formData.append('script', selectedFile);
    formData.append('type', 'pdf');
    formData.append('model', 'gpt-4-turbo-2024-04-09');
    
    setIsUploading(true);
    fetch('/api/script/analyze', { method: 'POST', body: formData })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          setSnackbar({open: true, message: 'Plik został pomyślnie przesłany!', severity: 'success'});
          if (data.result) {
            setAnalysisResult(data.result);
            if (selectedFile) cache.set(selectedFile.name, data.result);
          }
        } else {
          setSnackbar({open: true, message: data.message || 'Wystąpił błąd podczas przesyłania pliku', severity: 'error'});
        }
        setIsUploading(false);
      })
      .catch(error => {
        setSnackbar({open: true, message: 'Wystąpił błąd podczas połączenia z serwerem', severity: 'error'});
        setIsUploading(false);
      });
    
    // Informujemy użytkownika
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

  const sectionComponents: Record<string, React.ReactNode> = {
    'Dashboard': <Box p={4}><Typography variant="h4">Dashboard</Typography></Box>,
    'Analiza scenariusza': (
      <Box p={4}>
        <Typography variant="h4" gutterBottom>Analiza scenariusza</Typography>
        {analysisResult ? (
          <Box sx={{ display: 'flex', gap: 4 }}>
            <Box>
              <AnalysisMenu activeSection={activeSection} onSectionChange={setActiveSection} />
              {scriptId && <Box mt={2}><DownloadResults jobId={scriptId} /></Box>}
            </Box>
            <Box sx={{ flex: 1 }}>
              {activeSection === 'METADANE PRODUKCJI' && analysisResult.metadata && (
                <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse', mb: 2 }}>
                  <tbody>
                    {Object.entries(analysisResult.metadata).map(([key, value]) => (
                      <tr key={key}>
                        <td style={{ fontWeight: 700, padding: 4, borderBottom: '1px solid #333' }}>{key}</td>
                        <td style={{ padding: 4, borderBottom: '1px solid #333' }}>{String(value)}</td>
                      </tr>
                    ))}
                  </tbody>
                </Box>
              )}
              {activeSection === 'STRUKTURA SCEN' && Array.isArray(analysisResult.scenes) && (
                <Box>
                  {analysisResult.scenes.map((scene: any, idx: number) => (
                    <Box key={scene.id || idx} mb={2} p={2} borderRadius={2} boxShadow={1} bgcolor="#23263A">
                      <Typography variant="subtitle1" fontWeight={700}>{scene.title}</Typography>
                      <Typography variant="body2" color="text.secondary">{scene.description}</Typography>
                      {scene.characters && (
                        <Typography variant="body2" mt={1}>Postacie: {scene.characters.join(', ')}</Typography>
                      )}
                    </Box>
                  ))}
                </Box>
              )}
              {activeSection === 'POSTACI' && Array.isArray(analysisResult.characters) && (
                <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse', mb: 2 }}>
                  <thead>
                    <tr>
                      <th>Imię</th>
                      <th>Opis</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analysisResult.characters.map((char: any, idx: number) => (
                      <tr key={char.id || idx}>
                        <td style={{ fontWeight: 700, padding: 4, borderBottom: '1px solid #333' }}>{char.name}</td>
                        <td style={{ padding: 4, borderBottom: '1px solid #333' }}>{char.description || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </Box>
              )}
              {activeSection === 'RELACJE' && Array.isArray(analysisResult.relationships) && (
                <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse', mb: 2 }}>
                  <thead>
                    <tr>
                      <th>Źródło</th>
                      <th>Cel</th>
                      <th>Typ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analysisResult.relationships.map((rel: any, idx: number) => (
                      <tr key={rel.id || idx}>
                        <td style={{ padding: 4, borderBottom: '1px solid #333' }}>{rel.source}</td>
                        <td style={{ padding: 4, borderBottom: '1px solid #333' }}>{rel.target}</td>
                        <td style={{ padding: 4, borderBottom: '1px solid #333' }}>{rel.type || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </Box>
              )}
              {activeSection === 'TEMATY I KLASTERY' && Array.isArray(analysisResult.topics) && (
                <Box>
                  {analysisResult.topics.map((topic: any, idx: number) => (
                    <Box key={topic.id || idx} mb={2} p={2} borderRadius={2} boxShadow={1} bgcolor="#23263A">
                      <Typography variant="subtitle1" fontWeight={700}>{topic.label || topic.name}</Typography>
                      {topic.keywords && (
                        <Typography variant="body2" color="text.secondary">Słowa kluczowe: {topic.keywords.join(', ')}</Typography>
                      )}
                    </Box>
                  ))}
                </Box>
              )}
              {activeSection === 'ZASOBY PRODUKCYJNE' && Array.isArray(analysisResult.productionResources) && (
                <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse', mb: 2 }}>
                  <thead>
                    <tr>
                      <th>Nazwa</th>
                      <th>Typ</th>
                      <th>Ilość</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analysisResult.productionResources.map((res: any, idx: number) => (
                      <tr key={res.id || idx}>
                        <td style={{ padding: 4, borderBottom: '1px solid #333' }}>{res.name}</td>
                        <td style={{ padding: 4, borderBottom: '1px solid #333' }}>{res.type}</td>
                        <td style={{ padding: 4, borderBottom: '1px solid #333' }}>{res.amount ?? '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </Box>
              )}
              {(activeSection === 'PACING & STATYSTYKI' || activeSection === 'TECHNICZNE') && analysisResult.technicalStats && (
                <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse', mb: 2 }}>
                  <tbody>
                    {Object.entries(analysisResult.technicalStats).map(([key, value]) => (
                      <tr key={key}>
                        <td style={{ fontWeight: 700, padding: 4, borderBottom: '1px solid #333' }}>{key}</td>
                        <td style={{ padding: 4, borderBottom: '1px solid #333' }}>{String(value)}</td>
                      </tr>
                    ))}
                  </tbody>
                </Box>
              )}
              {activeSection === 'BUDŻETOWE CZERWONE FLAGI' && Array.isArray(analysisResult.budgetFlags) && (
                <Box>
                  {analysisResult.budgetFlags.map((flag: any, idx: number) => (
                    <Box key={flag.id || idx} mb={2} p={2} borderRadius={2} boxShadow={1} bgcolor="#d32f2f22">
                      <Typography variant="subtitle1" fontWeight={700} color="#d32f2f">{flag.label || flag.name}</Typography>
                      <Typography variant="body2" color="text.secondary">{flag.description}</Typography>
                    </Box>
                  ))}
                </Box>
              )}
              {activeSection === 'EKSTRA' && (
                <pre>{JSON.stringify(analysisResult.extra, null, 2)}</pre>
              )}
              {activeSection === 'GRAF RELACJI' && scriptId && (
                <GraphVisualization scriptId={scriptId} />
              )}
            </Box>
          </Box>
        ) : (
          <Typography variant="body1">Prześlij plik PDF i poczekaj na wyniki analizy.</Typography>
        )}
      </Box>
    ),
    'Graf': graphLoading
      ? <Box p={4} display="flex" justifyContent="center"><CircularProgress /></Box>
      : <GraphView scenes={graphData?.scenes} relations={graphData?.relations} />,
    'Wyszukiwarka': <Box p={4}><Typography variant="h4">Wyszukiwarka</Typography></Box>,
    'Czat z AI': <Box p={4}><Typography variant="h4">Czat z AI Agentem</Typography></Box>,
    'Ustawienia': <Box p={4}><Typography variant="h4">Ustawienia</Typography></Box>,
    'Pomoc': <Box p={4}><Typography variant="h4">Pomoc / Onboarding</Typography></Box>,
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex' }}>
        <Sidebar selected={selectedSection} onSelect={setSelectedSection} />
        <Box sx={{ flexGrow: 1, ml: `${drawerWidth}px` }}>
          <TopAppBar darkMode={darkMode} onToggleTheme={() => setDarkMode((d) => !d)} />
          <Toolbar />
          <Box sx={{ px: 4, pt: 2, pb: 2, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3, alignItems: 'flex-start' }}>
            <Box sx={{ flex: 1, minWidth: 260 }}>
              <ApiKeyInput
                label="OpenAI API Key"
                initialValue={openaiApiKey}
                onSave={setOpenaiApiKey}
              />
            </Box>
            <Box sx={{ flex: 2, minWidth: 320 }}>
              <FileUploader
                apiKey={openaiApiKey}
                model="gpt-4-turbo-2024-04-09"
                endpoint="/api/script/analyze"
                fieldName="script"
                requireApiKey={true}
                onUploadSuccess={(file, response) => {
                  setSnackbar({ open: true, message: 'Plik przesłany! Analiza rozpoczęta.', severity: 'success' });
                  // Możesz tu dodać dalszą obsługę, np. odświeżenie wyników
                }}
                onUploadError={(error) => setSnackbar({ open: true, message: error, severity: 'error' })}
              />
            </Box>
          </Box>
          {sectionComponents[selectedSection]}
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App; 