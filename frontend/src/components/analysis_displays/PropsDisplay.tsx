import React from 'react';
import {
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListSubheader,
  Divider,
  Chip,
  Box
} from '@mui/material';
import ExtensionIcon from '@mui/icons-material/Extension'; // Ikona dla rekwizytów
import type { AnalysisResult } from '../../types'; // Dostosuj ścieżkę

interface PropsDisplayProps {
  propsData: AnalysisResult['props']; 
}

const PropsDisplay: React.FC<PropsDisplayProps> = ({ propsData }) => {
  const globalProps = propsData?.global_props;
  const sceneProps = propsData?.scene_props;

  const hasGlobalProps = globalProps && globalProps.length > 0;
  const hasSceneProps = sceneProps && Object.keys(sceneProps).length > 0;

  if (!hasGlobalProps && !hasSceneProps) {
    return <Typography>Brak danych o rekwizytach do wyświetlenia.</Typography>;
  }

  return (
    <Paper elevation={3} sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom sx={{ mb: 2 }}>
        Rekwizyty
      </Typography>

      {hasGlobalProps && (
        <Box mb={3}>
          <Typography variant="h6" gutterBottom>Rekwizyty Globalne</Typography>
          <Paper variant="outlined" sx={{p:1}}>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {globalProps?.map((prop, index) => (
                <Chip key={`global-${index}`} icon={<ExtensionIcon fontSize="small" />} label={prop} />
              ))}
            </Box>
          </Paper>
        </Box>
      )}

      {hasSceneProps && (
        <Box>
          <Typography variant="h6" gutterBottom>Rekwizyty w Scenach</Typography>
          <List component={Paper} variant="outlined">
            {Object.entries(sceneProps || {}).map(([sceneId, propsInScene], index, arr) => (
              propsInScene.length > 0 && (
                <React.Fragment key={`scene-${sceneId}`}>
                  <ListItem sx={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                    <ListItemText 
                      primary={<Typography fontWeight="medium">Scena: {sceneId}</Typography>} 
                      sx={{mb:0.5}}
                    />
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {propsInScene.map((prop, propIndex) => (
                        <Chip 
                          key={`scene-${sceneId}-prop-${propIndex}`} 
                          label={prop} 
                          size="small" 
                          variant="outlined"
                          icon={<ExtensionIcon fontSize="small" />}
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

export default PropsDisplay; 