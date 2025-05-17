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
import MetadataDisplay from './components/analysis_displays/MetadataDisplay';
import RolesDisplay from './components/analysis_displays/RolesDisplay';
import LocationsDisplay from './components/analysis_displays/LocationsDisplay';
import PropsDisplay from './components/analysis_displays/PropsDisplay';
import VehiclesDisplay from './components/analysis_displays/VehiclesDisplay';
import WeaponsDisplay from './components/analysis_displays/WeaponsDisplay';
import LightingSchemesDisplay from './components/analysis_displays/LightingSchemesDisplay';
import DifficultScenesDisplay from './components/analysis_displays/DifficultScenesDisplay';
import PermitsDisplay from './components/analysis_displays/PermitsDisplay';
import SpecialGearDisplay from './components/analysis_displays/SpecialGearDisplay';
import ProductionRisksDisplay from './components/analysis_displays/ProductionRisksDisplay';

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

// Definicja allPossibleSectionsAnalysis - powinna być tutaj lub zaimportowana
const allPossibleSectionsAnalysis: { key: AnalysisSection; label: string; dataKey?: keyof AnalysisResult }[] = [
  { key: 'METADANE PRODUKCJI', label: 'Metadane Produkcji', dataKey: 'analysis' },
  { key: 'STRUKTURA SCEN', label: 'Struktura Scen', dataKey: 'analysis' }, 
  { key: 'POSTACI', label: 'Postaci', dataKey: 'roles' },
  { key: 'LOKACJE', label: 'Lokacje', dataKey: 'locations' },
  { key: 'REKWIZYTY', label: 'Rekwizyty', dataKey: 'props' },
  { key: 'POJAZDY', label: 'Pojazdy', dataKey: 'vehicles' },
  { key: 'BROŃ', label: 'Broń', dataKey: 'weapons' },
  { key: 'OŚWIETLENIE', label: 'Schematy Oświetlenia', dataKey: 'lighting_schemes' },
  { key: 'TRUDNE SCENY', label: 'Trudne Sceny', dataKey: 'difficult_scenes' },
  { key: 'POZWOLENIA', label: 'Potrzebne Pozwolenia', dataKey: 'permits' },
  { key: 'SPRZĘT SPECJALNY', label: 'Sprzęt Specjalny', dataKey: 'special_gear' },
  { key: 'RYZYKA PRODUKCYJNE', label: 'Ryzyka Produkcyjne', dataKey: 'production_risks' },
];

// ZAKTUALIZOWANA FUNKCJA renderAnalysisContent
const renderAnalysisContent = (section: AnalysisSection, result: AnalysisResult | null) => {
  if (!result) {
    return <Typography>Brak wyników analizy do wyświetlenia. Prześlij plik i uruchom analizę.</Typography>;
  }

  if (Object.keys(result).length === 0) {
    return <Typography>Otrzymano pusty obiekt wyników analizy. Sprawdź odpowiedź z API.</Typography>;
  }

  switch (section) {
    case 'METADANE PRODUKCJI':
      if (result.analysis && Object.keys(result.analysis).length > 0) {
        return <MetadataDisplay metadata={result.analysis} />;
      } else {
        return <Typography>Brak danych o metadanych produkcji.</Typography>;
      }
    case 'STRUKTURA SCEN':
        if (result.analysis && result.analysis.critical_scenes && result.analysis.critical_scenes.length > 0) {
            return (
              <Paper elevation={3} sx={{ p: 2 }}>
                <Typography variant="h5" sx={{ mb: 2 }}>Kluczowe Sceny (Struktura)</Typography>
                <pre>{JSON.stringify(result.analysis.critical_scenes, null, 2)}</pre>
              </Paper>
            );
        } else if (result.analysis) {
            return (
                <Paper elevation={3} sx={{ p: 2 }}>
                  <Typography variant="h5" sx={{ mb: 2 }}>Ogólne Informacje o Strukturze</Typography>
                  <Typography>Liczba scen: {result.analysis.number_of_scenes || 'Nie podano'}</Typography>
                  <Typography>Liczba postaci: {result.analysis.number_of_characters || 'Nie podano'}</Typography>
                </Paper>
              );
        }
        else {
            return <Typography>Brak danych o strukturze scen.</Typography>;
        }
    case 'POSTACI':
      if (result.roles && result.roles.roles && result.roles.roles.length > 0) {
        return <RolesDisplay rolesData={result.roles} />;
      } else {
        return <Typography>Brak danych o postaciach.</Typography>;
      }
    case 'LOKACJE':
      if (result.locations && result.locations.locations && result.locations.locations.length > 0) {
        return <LocationsDisplay locationsData={result.locations} />;
      } else {
        return <Typography>Brak danych o lokacjach.</Typography>;
      }
    case 'REKWIZYTY':
      if (result.props && ((result.props.global_props && result.props.global_props.length > 0) || Object.keys(result.props.scene_props || {}).length > 0)) {
        return <PropsDisplay propsData={result.props} />;
      } else {
        return <Typography>Brak danych o rekwizytach.</Typography>;
      }
    case 'POJAZDY':
      if (result.vehicles && result.vehicles.global_vehicles && result.vehicles.global_vehicles.length > 0) {
        return <VehiclesDisplay vehiclesData={result.vehicles} />;
      } else {
        return <Typography>Brak danych o pojazdach.</Typography>;
      }
    case 'BROŃ':
       if (result.weapons && ((result.weapons.global_weapons && result.weapons.global_weapons.length > 0) || Object.keys(result.weapons.scene_weapons || {}).length > 0)) {
        return <WeaponsDisplay weaponsData={result.weapons} />;
      } else {
        return <Typography>Brak danych o broni.</Typography>;
      }
    case 'OŚWIETLENIE':
      if (result.lighting_schemes && result.lighting_schemes.lighting && result.lighting_schemes.lighting.length > 0) {
        return <LightingSchemesDisplay lightingSchemesData={result.lighting_schemes} />;
      } else {
        return <Typography>Brak danych o schematach oświetlenia.</Typography>;
      }
    case 'TRUDNE SCENY':
      if (result.difficult_scenes && result.difficult_scenes.difficult_scenes && result.difficult_scenes.difficult_scenes.length > 0) {
        return <DifficultScenesDisplay difficultScenesData={result.difficult_scenes} />;
      } else {
        return <Typography>Brak danych o trudnych scenach.</Typography>;
      }
    case 'POZWOLENIA':
      if (result.permits && result.permits.permits_needed && result.permits.permits_needed.length > 0) {
        return <PermitsDisplay permitsData={result.permits} />;
      } else {
        return <Typography>Brak danych o potrzebnych pozwoleniach.</Typography>;
      }
    case 'SPRZĘT SPECJALNY':
      if (result.special_gear && result.special_gear.camera_gear && result.special_gear.camera_gear.length > 0) {
        return <SpecialGearDisplay specialGearData={result.special_gear} />;
      } else {
        return <Typography>Brak danych o sprzęcie specjalnym.</Typography>;
      }
    case 'RYZYKA PRODUKCYJNE':
      if (result.production_risks && result.production_risks.risks && result.production_risks.risks.length > 0) {
        return <ProductionRisksDisplay risksData={result.production_risks} />;
      } else {
        return <Typography>Brak danych o ryzykach produkcyjnych.</Typography>;
      }
    default:
      const genericData = (result as any)[section.toLowerCase().replace(/\s+/g, '_')]; 
      if (genericData && typeof genericData === 'object' && Object.keys(genericData).length > 0) {
        // Próba wyświetlenia generycznych danych, jeśli istnieją i nie są puste
        // Można to rozbudować o lepsze formatowanie lub usunąć, jeśli nie jest potrzebne
        try {
          const jsonData = JSON.stringify(genericData, null, 2);
          if (jsonData === '{}' || jsonData === '[]') { 
            // Jeśli po serializacji jest to pusty obiekt lub tablica
            return <Typography>Brak konkretnych danych dla sekcji "{section}".</Typography>;
          }
          return (
            <Paper elevation={3} sx={{ p: 2 }}>
              <Typography variant="h5" sx={{ mb: 2 }}>{section}</Typography>
              <pre>{jsonData}</pre>
            </Paper>
          );
        } catch (e) {
          return <Typography>Błąd podczas wyświetlania danych dla sekcji "{section}".</Typography>;
        }
      } else if (genericData) {
        // Jeśli genericData istnieje, ale nie jest obiektem lub jest pustym stringiem/liczbą itp.
         return (
            <Paper elevation={3} sx={{ p: 2 }}>
              <Typography variant="h5" sx={{ mb: 2 }}>{section}</Typography>
              <Typography>{String(genericData)}</Typography>
            </Paper>
          );
      }
      return <Typography>Sekcja "{section}" nie ma dedykowanego komponentu lub brak danych.</Typography>;
  }
};

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
  const [openaiApiKey, setOpenaiApiKey] = useState<string>(localStorage.getItem('openaiApiKey') || '');
  const [currentSnippet, setCurrentSnippet] = useState<string>('');
  const [showSnippet, setShowSnippet] = useState<boolean>(false);
  const [selectedSection, setSelectedSection] = useState<string>('Dashboard');
  const [darkMode, setDarkMode] = useState<boolean>(true);
  const [graphData, setGraphData] = useState<{ scenes: Scene[]; relations: SceneRelation[] } | null>(null);
  const [graphLoading, setGraphLoading] = useState(false);
  const [scriptId, setScriptId] = useState<string | null>(null);
  const [processedFileName, setProcessedFileName] = useState<string | null>(null);

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
    import('./config').then(({ default: config }) => {
      const websocket = new WebSocket(config.wsUrl);
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
    });
    
    return () => {
      if (ws && ws.readyState === WebSocket.OPEN) ws.close(1000, 'Komponent został odmontowany');
    };
  }, []);

  useEffect(() => {
    if (analysisResult) {
      console.log('Otrzymano wyniki analizy w App.tsx:', analysisResult);
      const firstAvailableSection = allPossibleSectionsAnalysis.find(s => {
        if (!s.dataKey || !analysisResult) return true;
        const data = analysisResult[s.dataKey];
        if (!data) return false;
        if (s.dataKey === 'roles') return (data as any).roles && (data as any).roles.length > 0;
        if (s.dataKey === 'locations') return (data as any).locations && (data as any).locations.length > 0;
        if (s.dataKey === 'props') return ((data as any).global_props && (data as any).global_props.length > 0) || 
                                        ((data as any).scene_props && Object.keys((data as any).scene_props).length > 0);
        if (s.dataKey === 'vehicles') return (data as any).global_vehicles && (data as any).global_vehicles.length > 0;
        if (s.dataKey === 'weapons') return (data as any).global_weapons && (data as any).global_weapons.length > 0;
        // ... (dodać podobne szczegółowe sprawdzenia dla innych dataKey zagnieżdżonych w obiektach)
        if (Array.isArray(data)) return data.length > 0;
        if (typeof data === 'object') return Object.keys(data).length > 0;
        return false;
      });
      if (firstAvailableSection) {
        setActiveSection(firstAvailableSection.key);
      } else if (analysisResult && Object.keys(analysisResult).length > 0) {
        setActiveSection('METADANE PRODUKCJI');
      }
    }
  }, [analysisResult]);

  useEffect(() => {
    if (selectedSection === 'Graf' && scriptId) {
      setGraphLoading(true);
      
      import('./config').then(({ default: config }) => {
        Promise.all([
          fetch(`${config.apiUrl}/script/${scriptId}/graph/nodes`).then(res => res.ok ? res.text() : null),
          fetch(`${config.apiUrl}/script/${scriptId}/graph/edges`).then(res => res.ok ? res.text() : null)
        ])
          .then(([nodesCsv, edgesCsv]) => {
            const scenes = nodesCsv ? parseScenesCSV(nodesCsv) : [];
            const relations = edgesCsv ? parseRelationsCSV(edgesCsv) : [];
            setGraphData({ scenes, relations });
          })
          .catch(() => setGraphData(null))
          .finally(() => setGraphLoading(false));
      });
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
    setUploadProgress(0); // Resetuj postęp
    setUploadStatus('Rozpoczynam przesyłanie...'); // Początkowy status
    setError(null); // Resetuj błędy

    let progressInterval: NodeJS.Timeout | null = null;
    setUploadProgress(10); // Startowy mały postęp
    progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) {
          if (progressInterval) clearInterval(progressInterval);
          return 90;
        }
        return prev + 5; // Symulacja postępu
      });
      setUploadStatus('Trwa wysyłanie i analiza scenariusza...'); // Aktualizacja statusu
    }, 400); // Co 400ms

    const formData = new FormData();
    formData.append('script', selectedFile);
    formData.append('type', 'pdf');
    formData.append('model', 'gpt-4-turbo-2024-04-09'); // Model można by przenieść do konfiguracji

    const originalFileNameForDownload = selectedFile.name; // Zapisz nazwę pliku dla DownloadResults

    try {
      if (!offlineManager.isOnline()) {
        if (progressInterval) clearInterval(progressInterval);
        offlineManager.addToQueue('/api/script/analyze', 'POST', formData);
        setUploadStatus('Aplikacja jest offline. Żądanie w kolejce.');
        // Nie ustawiamy setIsUploading(false) od razu, użytkownik powinien wiedzieć, że coś jest w kolejce
        // Można dodać timeout lub inną logikę resetowania isUploading dla offline
        setSnackbar({open: true, message: 'Aplikacja jest offline. Żądanie zostanie wysłane po przywróceniu połączenia.', severity: 'info'});
        // Po pewnym czasie można by ustawić isUploading na false, jeśli nie chcemy, aby pasek wisiał w nieskończoność
        setTimeout(() => {
            setIsUploading(false);
            setUploadProgress(0); 
        }, 5000); // Np. po 5 sekundach resetuj widok ładowania dla offline
        return;
      }

      const response = await fetch('/api/script/analyze', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`
        }
      });

      if (progressInterval) clearInterval(progressInterval); // Zatrzymaj symulację postępu
      const data = await response.json();

      if (response.ok) {
        setUploadProgress(100);
        setUploadStatus('Analiza zakończona pomyślnie!'); // Komunikat o sukcesie
        setSnackbar({open: true, message: 'Plik został pomyślnie przesłany i analiza zakończona!', severity: 'success'});
        
        setProcessedFileName(originalFileNameForDownload); // Ustaw nazwę pliku dla DownloadResults
        if (data.id) setScriptId(data.id); // Ustaw scriptId
        if (data.result) {
          setAnalysisResult(data.result);
          if (selectedFile) cache.set(originalFileNameForDownload, data.result); // Użyj zapisanej nazwy
        }
        setSelectedFile(null); // Wyczyść wybrany plik po sukcesie
        // Resetuj isUploading i uploadProgress po chwili, aby użytkownik zobaczył 100%
        setTimeout(() => {
            setIsUploading(false);
            setUploadProgress(0);
            setUploadStatus('');
        }, 3000); // Np. po 3 sekundach

      } else {
        setUploadProgress(0);
        const errorMessage = data.error || 'Wystąpił błąd podczas przesyłania pliku';
        setUploadStatus(errorMessage);
        setError(errorMessage);
        setSnackbar({open: true, message: errorMessage, severity: 'error'});
        setIsUploading(false); // Zatrzymaj ładowanie w przypadku błędu z odpowiedzi API
      }
    } catch (errorCatch: any) {
      if (progressInterval) clearInterval(progressInterval);
      setUploadProgress(0);
      const networkErrorMessage = 'Wystąpił błąd podczas połączenia z serwerem';
      setUploadStatus(networkErrorMessage);
      setError(networkErrorMessage);
      setSnackbar({open: true, message: networkErrorMessage, severity: 'error'});
      setIsUploading(false); // Zatrzymaj ładowanie w przypadku błędu sieciowego
    } 
    // Usunięto finally, bo setIsUploading jest zarządzane wewnątrz try/catch
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

  const handleJobCreated = (jobId: string, fileName: string) => {
    setScriptId(jobId);
    setProcessedFileName(fileName);
    console.log(`Job created: ${jobId}, file: ${fileName}. Connecting to WebSocket...`);
    setAnalysisProgress({ stage: 'queued', message: 'Zadanie w kolejce...', progress: 0 });
  };

  const sectionComponents: Record<string, React.ReactNode> = {
    'Dashboard': null,
    'Analiza scenariusza': (
      <Box p={4}>
        <Typography variant="h4" gutterBottom>Analiza scenariusza</Typography>
        {analysisResult ? (
          <Box sx={{ display: 'flex', gap: 4 }}>
            <Box>
              <AnalysisMenu activeSection={activeSection} onSectionChange={setActiveSection} analysisResult={analysisResult} />
              {scriptId && <Box mt={2}><DownloadResults jobId={scriptId} fileName={processedFileName || undefined} /></Box>}
            </Box>
            <Box sx={{ flex: 1 }}>
              {renderAnalysisContent(activeSection, analysisResult)}
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
      <Box sx={{ display: 'flex', height: '100vh', flexDirection: 'column' }}>
        <TopAppBar darkMode={darkMode} onToggleTheme={() => setDarkMode(!darkMode)} />
        <Box sx={{ display: 'flex', flexGrow: 1, overflow: 'hidden' }}>
          <Sidebar selected={selectedSection} onSelect={setSelectedSection} />
          <Box
            component="main"
            sx={{
              flexGrow: 1,
              p: 3,
              width: `calc(100% - ${drawerWidth}px)`,
              overflowY: 'auto',
              display: 'flex', // Dodane dla układu AnalysisMenu i contentu
              flexDirection: 'column', // Content poniżej menu jeśli za wąsko, lub obok
            }}
          >
            <Toolbar /> {/* Aby uniknąć nachodzenia na TopAppBar */}
            
            {selectedSection === 'Dashboard' && (
              <Container maxWidth="lg">
                <Typography variant="h4" gutterBottom>Dashboard</Typography>
                
                <Paper 
                  {...getRootProps()} 
                  sx={{ p: 4, mb: 2, border: '2px dashed grey', textAlign: 'center', cursor: 'pointer', backgroundColor: isDragActive ? 'action.hover' : 'background.paper' }}
                >
                  <input {...getInputProps()} />
                  {isDragActive ? <Typography>Upuść plik tutaj...</Typography> : <Typography>Przeciągnij i upuść plik PDF tutaj, lub kliknij, aby wybrać</Typography>}
                  {selectedFile && <Typography sx={{mt:1}}>Wybrany plik: {selectedFile.name}</Typography>}
                </Paper>

                {isUploading && <LinearProgress variant="determinate" value={uploadProgress} sx={{mb: 2}} />}
                {uploadStatus && <Typography color={error ? "error" : "success"} sx={{mb: 2}}>{uploadStatus}</Typography>}
                
                <ApiKeyInput 
                  initialValue={openaiApiKey} 
                  onSave={(newApiKey) => {
                    setOpenaiApiKey(newApiKey);
                    localStorage.setItem('openaiApiKey', newApiKey); // Opcjonalnie, jeśli chcemy to nadal robić tutaj
                    setSnackbar({open: true, message: 'Klucz API został zapisany.', severity: 'success'});
                  }}
                />
                
                <Button onClick={handleSubmit} disabled={!selectedFile || isUploading || !openaiApiKey.startsWith('sk-')} variant="contained" sx={{ mt: 2 }}>
                  Prześlij i Analizuj Scenariusz (REST)
                </Button>
                
                 {analysisProgress && (
                  <Box sx={{ mt: 2 }}>
                    <Typography>{analysisProgress.message}</Typography>
                    {analysisProgress.stage === 'processing' && <CircularProgress size={20} />}
                  </Box>
                )}
                {scriptId && analysisResult && (
                  <Box sx={{mt: 2}}>
                    <DownloadResults jobId={scriptId} fileName={processedFileName || undefined} />
                  </Box>
                )}
              </Container>
            )}

            {selectedSection === 'Analiza scenariusza' && (
              <Box sx={{ display: 'flex', flexGrow: 1, gap: 3 }}> {/* Używamy flex i gap */}
                <Box sx={{ width: drawerWidth, flexShrink: 0, borderRight: 1, borderColor: 'divider', pr: 2 }}>
                  <AnalysisMenu
                    activeSection={activeSection}
                    onSectionChange={setActiveSection}
                    analysisResult={analysisResult} // Przekazujemy analysisResult
                  />
                </Box>
                <Box sx={{ flexGrow: 1, overflowY: 'auto', pl: 2 }}> {/* Dodajemy overflowY i padding */}
                  {renderAnalysisContent(activeSection, analysisResult)}
                </Box>
              </Box>
            )}

            {selectedSection === 'Graf' && (
              <Container maxWidth="lg" sx={{ height: '100%'}}>
                {graphLoading ? <CircularProgress /> : 
                 (graphData && graphData.scenes.length > 0 ? 
                    <GraphView scenes={graphData.scenes} relations={graphData.relations} /> : 
                    <Typography>Brak danych do wyświetlenia grafu lub graf jest pusty.</Typography>)}
              </Container>
            )}
            
            {/* Placeholder dla innych sekcji */}
            {selectedSection === 'Wyszukiwarka' && <Typography variant="h4">Wyszukiwarka (w budowie)</Typography>}
            {selectedSection === 'Czat z AI' && <Typography variant="h4">Czat z AI (w budowie)</Typography>}
            {selectedSection === 'Ustawienia' && <Typography variant="h4">Ustawienia (w budowie)</Typography>}
            {selectedSection === 'Pomoc' && <Typography variant="h4">Pomoc (w budowie)</Typography>}

          </Box>
        </Box>
        <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleSnackbarClose} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
          <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </ThemeProvider>
  );
}

export default App;