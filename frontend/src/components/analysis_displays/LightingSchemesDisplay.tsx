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
  Box
} from '@mui/material';
import EmojiObjectsIcon from '@mui/icons-material/EmojiObjects'; // Ikona dla oświetlenia
import type { AnalysisResult } from '../../types';

interface LightingScheme {
  scene_id: string;
  style: string;
}

interface LightingSchemesDisplayProps {
  lightingSchemesData: AnalysisResult['lighting_schemes']; 
}

const LightingSchemesDisplay: React.FC<LightingSchemesDisplayProps> = ({ lightingSchemesData }) => {
  const lighting = lightingSchemesData?.lighting;

  if (!lighting || lighting.length === 0) {
    return <Typography>Brak danych o schematach oświetlenia.</Typography>;
  }

  return (
    <Paper elevation={3} sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom sx={{ mb: 2 }}>
        Schematy Oświetlenia
      </Typography>
      <List component={Paper} variant="outlined">
        {lighting.map((scheme, index) => (
          <React.Fragment key={index}>
            <ListItem sx={{ flexDirection: 'column', alignItems: 'flex-start' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', mb: 0.5 }}>
                <ListItemIcon sx={{minWidth: 'auto', mr: 1}}>
                  <EmojiObjectsIcon color="primary" />
                </ListItemIcon>
                <ListItemText 
                  primary={<Typography fontWeight="medium">Scena: {scheme.scene_id}</Typography>}
                />
              </Box>
              <Chip label={scheme.style} variant="outlined" size="small" sx={{ml: 'auto', mr: 'auto'}} />
            </ListItem>
            {index < lighting.length - 1 && <Divider component="li" />}
          </React.Fragment>
        ))}
      </List>
    </Paper>
  );
};

export default LightingSchemesDisplay; 