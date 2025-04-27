import React, { useState } from 'react';
import axios from 'axios';
import {
  Box,
  Button,
  Container,
  Paper,
  Typography,
  LinearProgress,
  Snackbar,
  Alert,
  Fade,
} from '@mui/material';

interface AnalysisProgress {
  stage: string;
  percentage: number;
  message: string;
}

interface AnalysisResult {
  analysis: {
    metadata: {
      title: string;
      authors: string[];
      detected_language: string;
      scene_count: number;
      token_count: number;
      analysis_timestamp: string;
    };
    scenes: Array<{
      id: string;
      location: string;
      time: string;
      characters: string[];
      summary: string;
      dominant_emotions: {
        joy: number;
        trust: number;
        fear: number;
        surprise: number;
        sadness: number;
        disgust: number;
        anger: number;
        anticipation: number;
      };
      narrative_importance: number;
    }>;
    characters: Array<{
      name: string;
      role: 'protagonist' | 'antagonist' | 'supporting' | 'other';
      description: string;
      emotional_profile: {
        joy: number;
        trust: number;
        fear: number;
        surprise: number;
        sadness: number;
        disgust: number;
        anger: number;
        anticipation: number;
      };
      centrality_score: number;
      arc_type: string;
    }>;
    relationships: Array<{
      character_a: string;
      character_b: string;
      strength: number;
      overall_sentiment: number;
      key_scenes: string[];
    }>;
    turning_points: Array<{
      scene_id: string;
      type: 'inciting' | 'midpoint' | 'climax' | 'resolution' | 'other';
      intensity: number;
      impact_summary: string;
    }>;
    themes: Array<{
      theme: string;
      relevance: number;
    }>;
    topic_clusters: Array<{
      topic: string;
      keywords: string[];
      frequency: number;
    }>;
    emotional_timeline: Array<{
      scene_id: string;
      valence: number;
      arousal: number;
    }>;
    overall_summary: string;
  };
  locations: string[];
  roles: Array<{
    character: string;
    role: string;
  }>;
  props: string[];
  vehicles: string[];
  special_effects: string[];
  weapons: string[];
  difficult_scenes: Array<{
    scene_id: string;
    reason: string;
    gear_needed: string[];
  }>;
}

const MAX_SIZE_MB = 10;

export const PdfAnalyzer: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<AnalysisProgress>({
    stage: 'idle',
    percentage: 0,
    message: 'Gotowy do analizy',
  });
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [currentSnippet, setCurrentSnippet] = useState<string>('');
  const [showSnippet, setShowSnippet] = useState<boolean>(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' | 'warning' }>({
    open: false,
    message: '',
    severity: 'info',
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const f = event.target.files?.[0];
    if (!f) return;
    if (!f.type.includes('pdf')) {
      setSnackbar({ open: true, message: 'Dozwolone są tylko pliki PDF', severity: 'error' });
      return;
    }
    if (f.size > MAX_SIZE_MB * 1024 * 1024) {
      setSnackbar({ open: true, message: 'Plik jest za duży', severity: 'error' });
      return;
    }
    setFile(f);
  };

  const handleAnalyze = async () => {
    if (!file) return;

    setProgress({
      stage: 'uploading',
      percentage: 0,
      message: 'Rozpoczynam przesyłanie pliku...',
    });

    let ws: WebSocket | null = null;

    try {
      ws = new WebSocket(`ws://${window.location.host}/ws/script-analysis`);

      ws.onopen = () => {
        // Połączenie WebSocket nawiązane
      };

      ws.onerror = () => {
        setProgress({
          stage: 'error',
          percentage: 0,
          message: 'Błąd połączenia WebSocket',
        });
        setSnackbar({ open: true, message: 'Błąd połączenia WebSocket', severity: 'error' });
      };

      ws.onclose = () => {
        // Połączenie WebSocket zamknięte
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setProgress({
            stage: data.stage,
            percentage: data.percentage,
            message: data.message,
          });
          if (data.snippet) {
            setShowSnippet(false);
            setTimeout(() => {
              setCurrentSnippet(data.snippet);
              setShowSnippet(true);
            }, 200);
          }
          if (data.stage === 'completed' || data.stage === 'complete') {
            setResult(data.result);
            ws?.close();
            setShowSnippet(false);
            setCurrentSnippet('');
          }
          if (data.stage === 'error') {
            setSnackbar({ open: true, message: data.message, severity: 'error' });
            ws?.close();
          }
        } catch (error) {
          setSnackbar({ open: true, message: 'Błąd przetwarzania wiadomości WebSocket', severity: 'error' });
        }
      };

      // Upload pliku
      const formData = new FormData();
      formData.append('script', file);

      await axios.post('/api/script/analyze', formData, {
        onUploadProgress: (progressEvent) => {
          const percentage = Math.round(
            (progressEvent.loaded * 100) / (progressEvent.total || 100)
          );
          setProgress({
            stage: 'uploading',
            percentage,
            message: `Przesyłanie pliku: ${percentage}%`,
          });
        },
      });
    } catch (error) {
      setProgress({
        stage: 'error',
        percentage: 0,
        message: 'Wystąpił błąd podczas analizy: ' + (error instanceof Error ? error.message : 'Nieznany błąd'),
      });
      setSnackbar({ open: true, message: 'Wystąpił błąd podczas analizy', severity: 'error' });
      ws?.close();
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" fontWeight="bold" mb={3}>
        Analiza Skryptu PDF
      </Typography>

      <Box mb={3}>
        <Button
          variant="contained"
          component="label"
          fullWidth
          aria-label="Wybierz plik PDF"
        >
          Wybierz plik PDF
          <input
            type="file"
            accept=".pdf"
            hidden
            onChange={handleFileChange}
          />
        </Button>
        {file && (
          <Typography variant="body2" color="text.secondary" mt={1}>
            Wybrano: {file.name}
          </Typography>
        )}
      </Box>

      <Button
        onClick={handleAnalyze}
        disabled={!file || progress.stage === 'analyzing'}
        variant="contained"
        color="primary"
        fullWidth
        sx={{ mb: 3 }}
        aria-label="Rozpocznij analizę"
      >
        {progress.stage === 'analyzing' ? 'Analizuję...' : 'Analizuj'}
      </Button>

      <Box mb={3}>
        <LinearProgress
          variant="determinate"
          value={progress.percentage}
          sx={{ height: 8, borderRadius: 2 }}
          aria-label="Postęp analizy"
        />
        <Typography variant="body2" color="text.secondary" mt={2}>
          {progress.message}
        </Typography>
      </Box>

      <Fade in={showSnippet} timeout={600}>
        <div>
          {currentSnippet && (
            <Paper elevation={2} sx={{ mt: 2, p: 2, bgcolor: 'grey.100' }}>
              <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                Przykładowy nagłówek sceny:
              </Typography>
              <Typography variant="body1" sx={{ fontStyle: 'italic' }}>
                {currentSnippet}
              </Typography>
            </Paper>
          )}
        </div>
      </Fade>

      {result && (
        <Paper elevation={3} sx={{ mt: 4, p: 3 }}>
          <Typography variant="h6" mb={2}>
            Wyniki Analizy
          </Typography>
          <Typography variant="body1">
            Tytuł: {result.analysis.metadata.title}
          </Typography>
          <Typography variant="body1">
            Liczba scen: {result.analysis.metadata.scene_count}
          </Typography>
          <Typography variant="body1">
            Język: {result.analysis.metadata.detected_language}
          </Typography>
          {/* Dodaj tu kolejne sekcje wyników */}
        </Paper>
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
      >
        <Alert
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}; 