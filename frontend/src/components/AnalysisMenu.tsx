import React from 'react';
import { Stack, Button, Typography } from '@mui/material';
import type { AnalysisSection, AnalysisResult } from '../types';

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

interface AnalysisMenuProps {
  activeSection: AnalysisSection;
  onSectionChange: (section: AnalysisSection) => void;
  analysisResult: AnalysisResult | null;
}

const AnalysisMenu: React.FC<AnalysisMenuProps> = ({ activeSection, onSectionChange, analysisResult }) => {
  
  const availableSections = allPossibleSectionsAnalysis.filter(section => {
    if (!analysisResult) return false;
    if (section.dataKey) {
      const data = analysisResult[section.dataKey];
      if (!data) return false;
      
      if (section.dataKey === 'analysis') return Object.keys(data).length > 0;
      if (section.dataKey === 'roles') return (data as any).roles && (data as any).roles.length > 0;
      if (section.dataKey === 'locations') return (data as any).locations && (data as any).locations.length > 0;
      if (section.dataKey === 'props') return ((data as any).global_props && (data as any).global_props.length > 0) || 
                                      ((data as any).scene_props && Object.keys((data as any).scene_props).length > 0);
      if (section.dataKey === 'vehicles') return (data as any).global_vehicles && (data as any).global_vehicles.length > 0;
      if (section.dataKey === 'weapons') return (data as any).global_weapons && (data as any).global_weapons.length > 0;
      if (section.dataKey === 'lighting_schemes') return (data as any).lighting && (data as any).lighting.length > 0;
      if (section.dataKey === 'difficult_scenes') return (data as any).difficult_scenes && (data as any).difficult_scenes.length > 0;
      if (section.dataKey === 'permits') return (data as any).permits_needed && (data as any).permits_needed.length > 0;
      if (section.dataKey === 'special_gear') return (data as any).camera_gear && (data as any).camera_gear.length > 0;
      if (section.dataKey === 'production_risks') return (data as any).risks && (data as any).risks.length > 0;

      if (Array.isArray(data)) return data.length > 0;
      if (typeof data === 'object' && data !== null) return Object.keys(data).length > 0;
      return false;
    }
    return true;
  });

  if (!analysisResult) {
    return <Typography sx={{mt: 2, ml: 1, color: 'text.secondary'}}>Oczekiwanie na wyniki analizy...</Typography>
  }

  if (availableSections.length === 0 && analysisResult && Object.keys(analysisResult).length > 0 ) {
    return <Typography sx={{mt: 2, ml: 1, color: 'text.secondary'}}>Brak danych do wyświetlenia w menu analizy dla tego pliku.</Typography>
  }

  if (analysisResult && Object.keys(analysisResult).length === 0) {
    return <Typography sx={{mt: 2, ml: 1, color: 'text.secondary'}}>Otrzymano puste wyniki analizy.</Typography>
  }

  return (
    <nav aria-label="Nawigacja analizy">
      <Typography variant="h6" sx={{ mb: 2 }}>
        Sekcje Analizy
      </Typography>
      <Stack spacing={1}>
        {availableSections.map((section) => (
          <Button
            key={section.key}
            variant={activeSection === section.key ? 'contained' : 'outlined'}
            color={activeSection === section.key ? 'primary' : 'inherit'}
            onClick={() => onSectionChange(section.key)}
            aria-current={activeSection === section.key ? 'page' : undefined}
            sx={{ justifyContent: 'flex-start', fontWeight: activeSection === section.key ? 'bold' : 'normal' }}
            fullWidth
          >
            {section.label}
          </Button>
        ))}
        {availableSections.length === 0 && (
            <Typography sx={{color: 'text.secondary'}}>Brak dostępnych sekcji.</Typography>
        )}
      </Stack>
    </nav>
  );
};

export default AnalysisMenu; 