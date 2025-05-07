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
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar'; // Ikona dla pojazdów
import type { AnalysisResult } from '../../types'; // Dostosuj ścieżkę

interface VehiclesDisplayProps {
  vehiclesData: AnalysisResult['vehicles']; 
}

const VehiclesDisplay: React.FC<VehiclesDisplayProps> = ({ vehiclesData }) => {
  const globalVehicles = vehiclesData?.global_vehicles;
  // const sceneVehicles = vehiclesData?.scene_vehicles; // Można dodać obsługę w przyszłości

  const hasGlobalVehicles = globalVehicles && globalVehicles.length > 0;
  // const hasSceneVehicles = sceneVehicles && Object.keys(sceneVehicles).length > 0;

  if (!hasGlobalVehicles) { // Na razie sprawdzamy tylko globalne
    return <Typography>Brak danych o pojazdach do wyświetlenia.</Typography>;
  }

  return (
    <Paper elevation={3} sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom sx={{ mb: 2 }}>
        Pojazdy
      </Typography>

      {hasGlobalVehicles && (
        <Box mb={hasGlobalVehicles ? 3 : 0}> {/* Usuwamy margines jeśli nie ma sceneVehicles */}
          <Typography variant="h6" gutterBottom>Pojazdy Globalne</Typography>
          <List component={Paper} variant="outlined">
            {globalVehicles?.map((vehicle, index) => (
              <React.Fragment key={`global-${index}`}>
                <ListItem>
                  <ListItemIcon>
                    <DirectionsCarIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText primary={vehicle} />
                </ListItem>
                {index < globalVehicles.length - 1 && <Divider component="li" />}
              </React.Fragment>
            ))}
          </List>
        </Box>
      )}

      {/* 
      {hasSceneVehicles && (
        <Box>
          <Typography variant="h6" gutterBottom>Pojazdy w Scenach</Typography>
          // Tutaj logika renderowania pojazdów w scenach, podobnie do PropsDisplay
        </Box>
      )}
      */}
    </Paper>
  );
};

export default VehiclesDisplay; 