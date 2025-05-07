import React from 'react';
import {
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Chip,
  Box,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber'; // Ikona dla trudnych scen
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import BuildIcon from '@mui/icons-material/Build'; // Ikona dla potrzebnego sprzętu
import type { AnalysisResult } from '../../types';

interface DifficultScene {
  scene_id: string;
  reason: string;
  gear_needed?: string[];
}

interface DifficultScenesDisplayProps {
  difficultScenesData: AnalysisResult['difficult_scenes']; 
}

const DifficultScenesDisplay: React.FC<DifficultScenesDisplayProps> = ({ difficultScenesData }) => {
  const scenes = difficultScenesData?.difficult_scenes;

  if (!scenes || scenes.length === 0) {
    return <Typography>Brak danych o trudnych scenach.</Typography>;
  }

  return (
    <Paper elevation={3} sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom sx={{ mb: 2 }}>
        Trudne Sceny
      </Typography>
      <Box>
        {scenes.map((scene, index) => (
          <Accordion key={index} sx={{ mb: 1, boxShadow: 'none', border: '1px solid', borderColor: 'divider' }}>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              aria-controls={`panel${index}a-content`}
              id={`panel${index}a-header`}
            >
              <WarningAmberIcon color="warning" sx={{ mr: 1 }} />
              <Typography fontWeight="medium">Scena: {scene.scene_id}</Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ borderTop: '1px solid', borderColor: 'divider', pt:2 }}>
              <Typography variant="subtitle2" gutterBottom>Powód:</Typography>
              <Typography variant="body2" paragraph color="text.secondary">
                {scene.reason}
              </Typography>
              {scene.gear_needed && scene.gear_needed.length > 0 && (
                <>
                  <Typography variant="subtitle2" gutterBottom sx={{mt: 1.5}}>
                    Sugerowany sprzęt / zasoby:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {scene.gear_needed.map((gear, gearIndex) => (
                      <Chip 
                        key={gearIndex} 
                        icon={<BuildIcon fontSize="small" />} 
                        label={gear} 
                        size="small" 
                        variant="outlined" 
                      />
                    ))}
                  </Box>
                </>
              )}
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>
    </Paper>
  );
};

export default DifficultScenesDisplay; 