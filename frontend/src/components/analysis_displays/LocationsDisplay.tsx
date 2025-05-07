import React from 'react';
import {
  Paper,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Box
} from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn'; // Ikona dla lokacji
import type { AnalysisResult } from '../../types'; // Dostosuj ścieżkę

interface LocationsDisplayProps {
  locationsData: AnalysisResult['locations']; // Oczekujemy obiektu { locations?: string[] }
}

const LocationsDisplay: React.FC<LocationsDisplayProps> = ({ locationsData }) => {
  const locations = locationsData?.locations;

  if (!locations || locations.length === 0) {
    return <Typography>Brak danych o lokacjach do wyświetlenia.</Typography>;
  }

  return (
    <Paper elevation={3} sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom sx={{ mb: 2 }}>
        Lokacje
      </Typography>
      <List component={Paper} variant="outlined">
        {locations.map((location, index) => (
          <React.Fragment key={index}>
            <ListItem>
              <ListItemIcon>
                <LocationOnIcon color="primary" />
              </ListItemIcon>
              <ListItemText primary={location} />
            </ListItem>
            {index < locations.length - 1 && <Divider component="li" />}
          </React.Fragment>
        ))}
      </List>
    </Paper>
  );
};

export default LocationsDisplay; 