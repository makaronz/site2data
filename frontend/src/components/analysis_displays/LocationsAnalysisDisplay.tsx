import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Card,
  CardContent,
  CardHeader,
  Grid,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  TextField,
  InputAdornment,
  Tabs,
  Tab,
  CircularProgress,
  Avatar
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import HomeIcon from '@mui/icons-material/Home';
import LandscapeIcon from '@mui/icons-material/Landscape';
import MovieIcon from '@mui/icons-material/Movie';
import type { AnalysisResult } from '../../types';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`locations-tabpanel-${index}`}
      aria-labelledby={`locations-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

interface LocationsAnalysisDisplayProps {
  analysisResult: AnalysisResult;
  onLocationClick?: (locationId: string) => void;
}

// Typ dla zdefiniowania danych lokacji
interface LocationData {
  id: string;
  name: string;
  type?: 'interior' | 'exterior' | 'mixed' | 'unknown';
  sceneCount?: number;
  scenes?: { id: string; description: string }[];
  description?: string;
}

const LocationsAnalysisDisplay: React.FC<LocationsAnalysisDisplayProps> = ({ 
  analysisResult, 
  onLocationClick 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [tabValue, setTabValue] = useState(0);

  // Przygotuj dane lokacji do wyświetlenia
  const getLocationsData = (): LocationData[] => {
    const rawLocations = analysisResult.locations?.locations || [];
    
    // W rzeczywistej implementacji te dane powinny być pełniejsze
    // Na potrzeby demonstracji tworzymy przykładowe dane
    return rawLocations.map((locationName, index) => {
      // Losowa liczba scen dla tej lokacji
      const sceneCount = Math.floor(Math.random() * 8) + 1;
      
      // Losowy typ lokacji
      const types = ['interior', 'exterior', 'mixed', 'unknown'] as const;
      const type = types[Math.floor(Math.random() * 3)] as 'interior' | 'exterior' | 'mixed' | 'unknown';
      
      // Pobierz losowe sceny do przypisania do tej lokacji
      const locationScenes = [];
      if (analysisResult.analysis?.critical_scenes) {
        for (let i = 0; i < Math.min(sceneCount, analysisResult.analysis.critical_scenes.length); i++) {
          const randomIndex = Math.floor(Math.random() * analysisResult.analysis.critical_scenes.length);
          const scene = analysisResult.analysis.critical_scenes[randomIndex];
          locationScenes.push({
            id: scene.scene_id,
            description: scene.description
          });
        }
      }
      
      return {
        id: index.toString(),
        name: locationName,
        type,
        sceneCount,
        scenes: locationScenes,
        description: `Opis lokacji "${locationName}". W rzeczywistej implementacji ten opis powinien pochodzić z backendu.`
      };
    });
  };
  
  const locations = getLocationsData();
  
  // Filtrowanie lokacji na podstawie wyszukiwania
  const filteredLocations = locations.filter(location => {
    const query = searchQuery.toLowerCase();
    return (
      query === '' || 
      location.name.toLowerCase().includes(query) || 
      (location.description && location.description.toLowerCase().includes(query))
    );
  });
  
  // Grupowanie lokacji według typów
  const getLocationsByType = () => {
    const typesMap: Record<string, LocationData[]> = {
      'Wnętrza': [],
      'Plenery': [],
      'Mieszane': [],
      'Inne': []
    };
    
    locations.forEach(location => {
      if (location.type === 'interior') {
        typesMap['Wnętrza'].push(location);
      } else if (location.type === 'exterior') {
        typesMap['Plenery'].push(location);
      } else if (location.type === 'mixed') {
        typesMap['Mieszane'].push(location);
      } else {
        typesMap['Inne'].push(location);
      }
    });
    
    return typesMap;
  };
  
  const locationsByType = getLocationsByType();
  
  // Lokacje z największą liczbą scen
  const locationsWithMostScenes = [...locations]
    .sort((a, b) => (b.sceneCount || 0) - (a.sceneCount || 0))
    .slice(0, 5);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  const handleLocationClick = (locationId: string) => {
    if (onLocationClick) {
      onLocationClick(locationId);
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Analiza lokacji ({locations.length})
      </Typography>
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="tabs analiza lokacji">
          <Tab label="Przegląd" />
          <Tab label="Lista lokacji" />
          <Tab label="Mapa" />
        </Tabs>
      </Box>
      
      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={3}>
          {/* Podsumowanie typów lokacji */}
          <Grid item xs={12} md={4}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardHeader title="Podsumowanie" />
              <CardContent>
                <List>
                  <ListItem>
                    <ListItemText 
                      primary="Liczba lokacji"
                      secondary={locations.length}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Wnętrza"
                      secondary={locationsByType['Wnętrza'].length}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Plenery"
                      secondary={locationsByType['Plenery'].length}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Lokacje mieszane"
                      secondary={locationsByType['Mieszane'].length}
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>
          
          {/* Lokacje z największą liczbą scen */}
          <Grid item xs={12} md={8}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardHeader title="Lokacje z największą liczbą scen" />
              <CardContent>
                <List>
                  {locationsWithMostScenes.map((location, index) => (
                    <ListItem 
                      key={location.id}
                      button
                      onClick={() => handleLocationClick(location.id)}
                      sx={{ 
                        '&:hover': { backgroundColor: 'action.hover' }
                      }}
                    >
                      <ListItemIcon>
                        <Avatar sx={{ bgcolor: index === 0 ? 'primary.main' : index === 1 ? 'secondary.main' : 'grey.500' }}>
                          {location.type === 'interior' ? <HomeIcon /> : <LandscapeIcon />}
                        </Avatar>
                      </ListItemIcon>
                      <ListItemText 
                        primary={location.name} 
                        secondary={`${location.sceneCount} scen`}
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
          
          {/* Grupy lokacji według typów */}
          <Grid item xs={12}>
            <Card variant="outlined">
              <CardHeader title="Lokacje według typów" />
              <CardContent>
                <Grid container spacing={2}>
                  {Object.entries(locationsByType).map(([type, locs]) => (
                    locs.length > 0 && (
                      <Grid item xs={12} md={6} key={type}>
                        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                          {type} ({locs.length})
                        </Typography>
                        <Divider sx={{ mb: 2 }} />
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {locs.map((loc) => (
                            <Chip
                              key={loc.id}
                              icon={
                                loc.type === 'interior' ? <HomeIcon /> : 
                                loc.type === 'exterior' ? <LandscapeIcon /> : 
                                <LocationOnIcon />
                              }
                              label={loc.name}
                              onClick={() => handleLocationClick(loc.id)}
                              sx={{ mb: 0.5 }}
                            />
                          ))}
                        </Box>
                      </Grid>
                    )
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>
      
      <TabPanel value={tabValue} index={1}>
        {/* Wyszukiwarka */}
        <TextField
          placeholder="Szukaj lokacji..."
          variant="outlined"
          fullWidth
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ mb: 3 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            )
          }}
        />
        
        {/* Lista lokacji */}
        <List>
          {filteredLocations.length > 0 ? (
            filteredLocations.map((location, index) => (
              <React.Fragment key={location.id}>
                {index > 0 && <Divider />}
                <ListItem 
                  button
                  onClick={() => handleLocationClick(location.id)}
                  sx={{ py: 2 }}
                >
                  <ListItemIcon>
                    {location.type === 'interior' ? (
                      <HomeIcon color="primary" />
                    ) : location.type === 'exterior' ? (
                      <LandscapeIcon color="secondary" />
                    ) : (
                      <LocationOnIcon />
                    )}
                  </ListItemIcon>
                  <ListItemText 
                    primary={location.name} 
                    secondary={location.description}
                  />
                  <Box>
                    {/* Chip pokazujący typ lokacji */}
                    <Chip 
                      label={
                        location.type === 'interior' ? 'Wnętrze' :
                        location.type === 'exterior' ? 'Plener' :
                        location.type === 'mixed' ? 'Mieszana' : 
                        'Nieznany'
                      }
                      size="small"
                      color={
                        location.type === 'interior' ? 'primary' :
                        location.type === 'exterior' ? 'secondary' :
                        'default'
                      }
                      sx={{ mr: 1 }}
                    />
                    
                    {/* Chip pokazujący liczbę scen */}
                    <Chip 
                      icon={<MovieIcon />}
                      label={`${location.sceneCount} scen`}
                      size="small"
                      variant="outlined"
                    />
                  </Box>
                </ListItem>
              </React.Fragment>
            ))
          ) : (
            <Typography color="text.secondary" align="center" sx={{ py: 3 }}>
              Nie znaleziono pasujących lokacji
            </Typography>
          )}
        </List>
      </TabPanel>
      
      <TabPanel value={tabValue} index={2}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 5 }}>
          <CircularProgress sx={{ mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            Mapa lokacji
          </Typography>
          <Typography color="text.secondary">
            Funkcja wizualizacji lokacji na mapie będzie dostępna w przyszłych wersjach aplikacji.
          </Typography>
        </Box>
      </TabPanel>
    </Paper>
  );
};

export default LocationsAnalysisDisplay; 