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
import AssignmentIcon from '@mui/icons-material/Assignment'; // Ikona dla pozwoleń
import type { AnalysisResult } from '../../types';

interface Permit {
  scene_id: string;
  permit_type: string;
  reason: string;
}

interface PermitsDisplayProps {
  permitsData: AnalysisResult['permits']; 
}

const PermitsDisplay: React.FC<PermitsDisplayProps> = ({ permitsData }) => {
  const permits = permitsData?.permits_needed;

  if (!permits || permits.length === 0) {
    return <Typography>Brak informacji o potrzebnych pozwoleniach.</Typography>;
  }

  return (
    <Paper elevation={3} sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom sx={{ mb: 2 }}>
        Potrzebne Pozwolenia
      </Typography>
      <List component={Paper} variant="outlined">
        {permits.map((permit, index) => (
          <React.Fragment key={index}>
            <ListItem sx={{ flexDirection: 'column', alignItems: 'flex-start' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', mb: 0.5 }}>
                <ListItemIcon sx={{minWidth: 'auto', mr: 1}}>
                  <AssignmentIcon color="secondary" />
                </ListItemIcon>
                <ListItemText 
                  primary={<Typography fontWeight="medium">Scena: {permit.scene_id} - {permit.permit_type}</Typography>}
                />
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{pl: '36px'}}> {/* Wcięcie dla powodu */}
                Powód: {permit.reason}
              </Typography>
            </ListItem>
            {index < permits.length - 1 && <Divider component="li" />}
          </React.Fragment>
        ))}
      </List>
    </Paper>
  );
};

export default PermitsDisplay; 