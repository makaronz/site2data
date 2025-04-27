import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  LinearProgress,
  Stack,
  Chip,
  Alert,
  List,
  ListItem,
  ListItemText,
  Divider,
  Container,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';

type ChunkStatus = 'processing' | 'retry' | 'done' | 'error';

interface ProgressChunk {
  chunkId: string;
  status: ChunkStatus;
  retries: number;
  error?: string;
  startedAt?: string;
  finishedAt?: string;
}

interface ProgressEvent {
  jobId: string;
  status: 'chunking' | 'processing' | 'done' | 'error';
  processed: number;
  total: number;
  eta?: number;
  chunk?: ProgressChunk;
  message?: string;
  timestamp: string;
}

interface JobProgressProps {
  jobId: string;
}

export const JobProgress: React.FC<JobProgressProps> = ({ jobId }) => {
  const [progress, setProgress] = useState<{
    processed: number;
    total: number;
    status: string;
    eta?: number;
  }>({ processed: 0, total: 0, status: 'chunking' });
  const [chunks, setChunks] = useState<Record<string, ProgressChunk>>({});
  const [logs, setLogs] = useState<ProgressEvent[]>([]);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!jobId) return;
    const url = `/api/progress/${jobId}`;
    const es = new window.EventSource(url);

    es.onmessage = (event) => {
      try {
        const data: ProgressEvent = JSON.parse(event.data);
        setProgress(prev => ({
          processed: data.processed,
          total: data.total,
          status: data.status,
          eta: data.eta,
        }));
        if (data.chunk) {
          setChunks(prev => ({
            ...prev,
            [data.chunk!.chunkId]: data.chunk!,
          }));
        }
        setLogs(prev => [
          ...prev,
          data,
        ]);
      } catch (err) {
        // Optionally handle parse error
      }
    };

    es.onerror = () => {
      es.close();
    };

    eventSourceRef.current = es;
    return () => {
      es.close();
    };
  }, [jobId]);

  const percent = progress.total > 0 ? Math.round((progress.processed / progress.total) * 100) : 0;

  return (
    <Container maxWidth="md" sx={{ mt: 6 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Stack spacing={3}>
          <Typography variant="h6" fontWeight={700}>
            Progres analizy scenariusza
          </Typography>
          <Box>
            <Typography variant="body2" sx={{ mb: 1 }}>
              Status: <b>{progress.status === 'done' ? 'Zakończono' : progress.status}</b>
              {progress.eta !== undefined && progress.status !== 'done' && (
                <> &nbsp;|&nbsp; Szacowany czas: <b>{Math.ceil(progress.eta / 1000)}s</b></>
              )}
            </Typography>
            <LinearProgress
              variant={progress.total > 0 ? 'determinate' : 'indeterminate'}
              value={percent}
              sx={{ height: 10, borderRadius: 2 }}
              aria-label="Pasek postępu analizy"
            />
            <Typography variant="body2" sx={{ mt: 1 }}>
              {progress.processed} / {progress.total} chunków przetworzono ({percent}%)
            </Typography>
          </Box>
          <Divider />
          <Typography variant="subtitle1" fontWeight={600}>
            Statusy chunków
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {Object.values(chunks).map(chunk => (
              <Chip
                key={chunk.chunkId}
                label={`Chunk ${chunk.chunkId.slice(-4)}: ${chunk.status}${chunk.retries > 0 ? ` (retry: ${chunk.retries})` : ''}`}
                color={
                  chunk.status === 'done'
                    ? 'success'
                    : chunk.status === 'error'
                    ? 'error'
                    : chunk.status === 'retry'
                    ? 'warning'
                    : 'info'
                }
                icon={
                  chunk.status === 'done' ? <CheckCircleIcon /> :
                  chunk.status === 'error' ? <ErrorIcon /> :
                  chunk.status === 'retry' ? <AutorenewIcon /> :
                  <HourglassEmptyIcon />
                }
                aria-label={`Chunk ${chunk.chunkId} status: ${chunk.status}`}
                sx={{ minWidth: 180 }}
              />
            ))}
          </Box>
          <Divider />
          <Typography variant="subtitle1" fontWeight={600}>
            Logi zdarzeń
          </Typography>
          <Paper variant="outlined" sx={{ maxHeight: 200, overflow: 'auto', p: 1 }}>
            <List dense>
              {logs.map((log, idx) => (
                <ListItem key={idx} disablePadding>
                  <ListItemText
                    primary={
                      <span>
                        <b>{new Date(log.timestamp).toLocaleTimeString()}</b> — {log.message || log.status}
                        {log.chunk && (
                          <>
                            {' | '}
                            <span>
                              Chunk <b>{log.chunk.chunkId.slice(-4)}</b>: {log.chunk.status}
                              {log.chunk.retries > 0 && <> (retry: {log.chunk.retries})</>}
                              {log.chunk.error && (
                                <Alert severity="error" sx={{ display: 'inline', ml: 1, p: 0.5 }}>
                                  {log.chunk.error}
                                </Alert>
                              )}
                            </span>
                          </>
                        )}
                      </span>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
          {progress.status === 'done' && (
            <Alert severity="success" sx={{ mt: 2 }}>
              Analiza zakończona! Możesz pobrać wyniki lub przejść do kolejnego kroku.
            </Alert>
          )}
          {progress.status === 'error' && (
            <Alert severity="error" sx={{ mt: 2 }}>
              Wystąpił błąd podczas analizy. Sprawdź logi powyżej.
            </Alert>
          )}
        </Stack>
      </Paper>
    </Container>
  );
};

export default JobProgress; 