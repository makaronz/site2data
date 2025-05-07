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
import CameraRollIcon from '@mui/icons-material/CameraRoll'; // Ikona dla sprzętu
import type { AnalysisResult } from '../../types';

interface CameraGearItem {
  scene_id: string;
  gear: string[];
}

interface SpecialGearDisplayProps {
  specialGearData: AnalysisResult['special_gear']; 
}

const SpecialGearDisplay: React.FC<SpecialGearDisplayProps> = ({ specialGearData }) => {
  const cameraGear = specialGearData?.camera_gear;

  if (!cameraGear || cameraGear.length === 0) {
    return <Typography>Brak danych o sprzęcie specjalnym.</Typography>;
  }

  return (
    <Paper elevation={3} sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom sx={{ mb: 2 }}>
        Sprzęt Specjalny (Kamera)
      </Typography>
      <List component={Paper} variant="outlined">
        {cameraGear.map((item, index) => (
          <React.Fragment key={index}>
            <ListItem sx={{ flexDirection: 'column', alignItems: 'flex-start' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', mb: 0.5 }}>
                <ListItemIcon sx={{minWidth: 'auto', mr: 1}}>
                  <CameraRollIcon color="action" />
                </ListItemIcon>
                <ListItemText 
                  primary={<Typography fontWeight="medium">Scena: {item.scene_id}</Typography>}
                />
              </Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, pl: '36px' }}>
                {item.gear.map((g, gIndex) => (
                  <Chip key={gIndex} label={g} size="small" variant="outlined" />
                ))}
              </Box>
            </ListItem>
            {index < cameraGear.length - 1 && <Divider component="li" />}
          </React.Fragment>
        ))}
      </List>
    </Paper>
  );
};

export default SpecialGearDisplay; 