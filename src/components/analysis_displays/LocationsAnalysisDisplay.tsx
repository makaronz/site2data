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
  Avatar,
  ListItemButton
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import HomeIcon from '@mui/icons-material/Home';
import LandscapeIcon from '@mui/icons-material/Landscape';
import MovieIcon from '@mui/icons-material/Movie';

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

// Tymczasowy, uproszczony typ AnalysisResult
interface AnalysisResult {
  locations?: {
    locations?: string[];
  };
  analysis?: {
    critical_scenes?: Array<{ scene_id: string; description: string }>;
  };
  // Można tu dodać inne potrzebne pola w przyszłości
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
      const locationScenes: { id: string; description: string }[] = [];
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
          
          <Grid item size={{ xs: 12, md: 4 }}>
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
          
          <Grid item size={{ xs: 12, md: 8 }}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardHeader title="Lokacje z największą liczbą scen" />
              <CardContent>
                <List>
                  {locationsWithMostScenes.map((location, index) => (
                    
                    <ListItemButton 
                      key={location.id}
                      onClick={() => handleLocationClick(location.id)}
                      sx={{ 
                        cursor: 'pointer',
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
                    </ListItemButton>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
          
          {/* Grupy lokacji według typów */}
          
          <Grid item size={12}>
            <Card variant="outlined">
              <CardHeader title="Lokacje według typów" />
              {/* TODO: Dokończyć implementację tej sekcji, jeśli jest potrzebna.
                Na razie jest pusta lub niepełna w oryginalnym kodzie. */}
            </Card>
          </Grid>
        </Grid>
      </TabPanel>
      
      <TabPanel value={tabValue} index={1}>
        {/* Wyszukiwarka */}
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Szukaj lokacji..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ mb: 3 }}
        />
        
        {/* Lista wszystkich lokacji */}
        <Grid container spacing={2}>
          {filteredLocations.length > 0 ? (
            filteredLocations.map(location => (
              
              <Grid item size={{ xs: 12, sm: 6, md: 4 }} key={location.id}>
                <Card 
                  onClick={() => handleLocationClick(location.id)}
                  sx={{ 
                    cursor: 'pointer', 
                    '&:hover': { boxShadow: 6 } 
                  }}
                >
                  <CardHeader 
                    avatar={
                      location.type === 'interior' ? <HomeIcon /> :
                      location.type === 'exterior' ? <LandscapeIcon /> :
                      <MovieIcon />
                    }
                    title={location.name} 
                    subheader={`Scen: ${location.sceneCount || 'N/A'}`}
                  />
                  <CardContent>
                    <Typography variant="body2" color="text.secondary" noWrap>
                      {location.description || 'Brak opisu.'}
                    </Typography>
                    {location.scenes && location.scenes.length > 0 && (
                      <Box mt={1}>
                        <Typography variant="caption">Przykładowe sceny:</Typography>
                        <List dense disablePadding>
                          {location.scenes.slice(0, 2).map(scene => (
                            <ListItem key={scene.id} disablePadding>
                              <ListItemText primary={scene.description} primaryTypographyProps={{ variant: 'caption', noWrap: true, component: 'span' }} />
                            </ListItem>
                          ))}
                        </List>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))
          ) : (
            
            <Grid item size={12}>
              <Typography>Nie znaleziono lokacji pasujących do kryteriów.</Typography>
            </Grid>
          )}
        </Grid>
      </TabPanel>
      
      <TabPanel value={tabValue} index={2}>
        {/* TODO: Implementacja mapy lokacji */}
        <Typography>Mapa lokacji (do zaimplementowania)</Typography>
        <Typography variant="body2" color="text.secondary">
          W tym miejscu mogłaby się znaleźć interaktywna mapa pokazująca rozmieszczenie lokacji,
          o ile dostępne byłyby dane geograficzne.
        </Typography>
        <Box sx={{ height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'grey.200', borderRadius: 1, mt:2 }}>
           <CircularProgress /> <Typography sx={{ml: 2}}>Ładowanie mapy...</Typography>
        </Box>
      </TabPanel>
    </Paper>
  );
};

export default LocationsAnalysisDisplay; 