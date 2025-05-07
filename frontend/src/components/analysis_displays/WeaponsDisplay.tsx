import React from 'react';
import {
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  Divider,
  Chip,
  Box
} from '@mui/material';
import GavelIcon from '@mui/icons-material/Gavel'; // Przykładowa ikona dla broni
import type { AnalysisResult } from '../../types';

interface WeaponsDisplayProps {
  weaponsData: AnalysisResult['weapons'];
}

const WeaponsDisplay: React.FC<WeaponsDisplayProps> = ({ weaponsData }) => {
  const globalWeapons = weaponsData?.global_weapons;
  const sceneWeapons = weaponsData?.scene_weapons;

  const hasGlobalWeapons = globalWeapons && globalWeapons.length > 0;
  const hasSceneWeapons = sceneWeapons && Object.keys(sceneWeapons).length > 0;

  if (!hasGlobalWeapons && !hasSceneWeapons) {
    return <Typography>Brak danych o broni do wyświetlenia.</Typography>;
  }

  return (
    <Paper elevation={3} sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom sx={{ mb: 2 }}>
        Broń
      </Typography>

      {hasGlobalWeapons && (
        <Box mb={hasSceneWeapons ? 3 : 0}>
          <Typography variant="h6" gutterBottom>Broń Globalna</Typography>
          <Paper variant="outlined" sx={{p:1}}>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {globalWeapons?.map((weapon, index) => (
                <Chip key={`global-${index}`} icon={<GavelIcon fontSize="small" />} label={weapon} />
              ))}
            </Box>
          </Paper>
        </Box>
      )}

      {hasSceneWeapons && (
        <Box>
          <Typography variant="h6" gutterBottom>Broń w Scenach</Typography>
          <List component={Paper} variant="outlined">
            {Object.entries(sceneWeapons || {}).map(([sceneId, weaponsInScene], index, arr) => (
              weaponsInScene.length > 0 && (
                <React.Fragment key={`scene-${sceneId}`}>
                  <ListItem sx={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                    <ListItemText 
                      primary={<Typography fontWeight="medium">Scena: {sceneId}</Typography>} 
                      sx={{mb:0.5}}
                    />
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {weaponsInScene.map((weapon, weaponIndex) => (
                        <Chip 
                          key={`scene-${sceneId}-weapon-${weaponIndex}`} 
                          label={weapon} 
                          size="small" 
                          variant="outlined"
                          icon={<GavelIcon fontSize="small" />}
                        />
                      ))}
                    </Box>
                  </ListItem>
                  {index < arr.length - 1 && <Divider component="li" />}
                </React.Fragment>
              )
            ))}
          </List>
        </Box>
      )}
    </Paper>
  );
};

export default WeaponsDisplay; 