import React from 'react';
import { Paper, Typography, Grid, Box, Chip } from '@mui/material';
import type { AnalysisResult } from '../../types'; // Dostosuj ścieżkę w razie potrzeby

interface MetadataDisplayProps {
  metadata: AnalysisResult['analysis']; // Oczekujemy tylko części 'analysis' z AnalysisResult
}

const MetadataDisplay: React.FC<MetadataDisplayProps> = ({ metadata }) => {
  if (!metadata || Object.keys(metadata).length === 0) {
    return <Typography>Brak metadanych do wyświetlenia.</Typography>;
  }

  const renderValue = (value: any) => {
    if (Array.isArray(value)) {
      if (value.length === 0) return <Typography variant="body2" color="text.secondary"><em>Brak</em></Typography>;
      return (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
          {value.map((item, index) => (
            <Chip key={index} label={typeof item === 'object' ? JSON.stringify(item) : item} size="small" />
          ))}
        </Box>
      );
    }
    if (typeof value === 'object' && value !== null) {
      // Dla obiektów zagnieżdżonych (np. critical_scenes)
      return <pre>{JSON.stringify(value, null, 2)}</pre>; 
    }
    return <Typography variant="body2">{String(value)}</Typography>;
  };

  const metadataItems = [
    { label: 'Tytuł Scenariusza', value: metadata.script_name },
    { label: 'Autor', value: metadata.author },
    { label: 'Liczba Scen', value: metadata.number_of_scenes },
    { label: 'Liczba Postaci', value: metadata.number_of_characters },
    { label: 'Główne Lokacje', value: metadata.locations },
    { label: 'Okresy Czasowe', value: metadata.time_periods },
    { label: 'Główne Tematy', value: metadata.major_themes },
    // Możemy dodać critical_scenes tutaj lub jako osobną podsekcję w 'Struktura Scen'
  ];

  return (
    <Paper elevation={3} sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom sx={{ mb: 2 }}>
        Metadane Produkcji
      </Typography>
      <Grid container spacing={2}>
        {metadataItems.filter(item => item.value !== undefined && item.value !== null).map((item, index) => (
          <React.Fragment key={index}>
            <Grid item xs={12} sm={4}>
              <Typography variant="subtitle1" fontWeight="bold">
                {item.label}:
              </Typography>
            </Grid>
            <Grid item xs={12} sm={8}>
              {renderValue(item.value)}
            </Grid>
          </React.Fragment>
        ))}
      </Grid>
      {/* Można tu dodać specjalne renderowanie dla metadata.critical_scenes jeśli jest bardziej złożone */}
      {metadata.critical_scenes && metadata.critical_scenes.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Kluczowe Sceny
          </Typography>
          {metadata.critical_scenes.map((scene, idx) => (
            <Paper key={idx} variant="outlined" sx={{ p: 1.5, mb: 1 }}>
              <Typography variant="subtitle2">ID Sceny: {scene.scene_id}</Typography>
              <Typography variant="body2" color="text.secondary">Opis: {scene.description}</Typography>
            </Paper>
          ))}
        </Box>
      )}
    </Paper>
  );
};

export default MetadataDisplay; 