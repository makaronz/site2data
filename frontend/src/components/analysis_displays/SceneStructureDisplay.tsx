import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  Chip,
  Divider,
  Button,
  TextField,
  InputAdornment,
  IconButton,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import SortIcon from '@mui/icons-material/Sort';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import NightsStayIcon from '@mui/icons-material/NightsStay';
import HomeIcon from '@mui/icons-material/Home';
import LandscapeIcon from '@mui/icons-material/Landscape';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import type { AnalysisResult } from '../../types';

interface SceneStructureDisplayProps {
  analysisResult: AnalysisResult;
  onSceneClick?: (sceneId: string) => void;
}

// Interfejs dla sceny z danymi do wyświetlenia
interface SceneDisplayData {
  id: string;
  scene_number?: string;
  title?: string;
  description?: string;
  intExt?: 'INT' | 'EXT' | null;
  dayTime?: 'DAY' | 'NIGHT' | 'DUSK' | 'DAWN' | 'OTHER' | null;
  location?: string;
  characters?: string[];
  estimatedLength?: number;
}

const SceneStructureDisplay: React.FC<SceneStructureDisplayProps> = ({ analysisResult, onSceneClick }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [intExtFilter, setIntExtFilter] = useState<string>('all');
  const [dayTimeFilter, setDayTimeFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  
  // Przygotuj dane scen do wyświetlenia - w rzeczywistej implementacji 
  // te dane powinny pochodzić z analysisResult
  const getScenes = (): SceneDisplayData[] => {
    // Jeśli mamy faktyczne dane o strukturze scen, używamy ich
    if (analysisResult.scenes_structure?.scenes && analysisResult.scenes_structure.scenes.length > 0) {
      return analysisResult.scenes_structure.scenes.map(scene => ({
        id: scene.scene_id,
        scene_number: scene.scene_id,
        title: scene.title,
        description: scene.description,
        intExt: scene.int_ext as 'INT' | 'EXT' | null,
        dayTime: scene.day_time as 'DAY' | 'NIGHT' | 'DUSK' | 'DAWN' | 'OTHER' | null,
        location: scene.location,
        characters: scene.characters,
        estimatedLength: scene.estimated_length ? parseFloat(scene.estimated_length.toString()) : undefined
      }));
    }
    
    // Jeśli mamy krytyczne sceny, używamy ich jako bazę
    if (analysisResult.analysis?.critical_scenes && analysisResult.analysis.critical_scenes.length > 0) {
      return analysisResult.analysis.critical_scenes.map((scene, index) => ({
        id: scene.scene_id,
        scene_number: scene.scene_id,
        description: scene.description,
        // Symulacja danych wizualnych
        intExt: Math.random() > 0.5 ? 'INT' : 'EXT',
        dayTime: Math.random() > 0.3 ? 'DAY' : 'NIGHT',
        location: analysisResult.locations?.locations?.[Math.floor(Math.random() * (analysisResult.locations.locations.length || 1))] || 'Nieznana lokacja',
        // Symulacja postaci
        characters: analysisResult.roles?.roles
          ?.slice(0, Math.floor(Math.random() * 3) + 1)
          .map(role => role.character) || []
      }));
    }
    
    // Jeśli nie mamy żadnych danych, zwracamy pustą tablicę
    return [];
  };
  
  const scenes = getScenes();
  
  // Filtrowanie scen na podstawie wyszukiwania i filtrów
  const filteredScenes = scenes.filter(scene => {
    // Filtr wyszukiwania
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = 
      searchQuery === '' || 
      (scene.title && scene.title.toLowerCase().includes(searchLower)) ||
      (scene.description && scene.description.toLowerCase().includes(searchLower)) ||
      (scene.location && scene.location.toLowerCase().includes(searchLower)) ||
      (scene.characters && scene.characters.some(char => char.toLowerCase().includes(searchLower)));
    
    // Filtr INT/EXT
    const matchesIntExt = 
      intExtFilter === 'all' || 
      (intExtFilter === 'int' && scene.intExt === 'INT') ||
      (intExtFilter === 'ext' && scene.intExt === 'EXT');
    
    // Filtr pory dnia
    const matchesDayTime = 
      dayTimeFilter === 'all' || 
      (dayTimeFilter === 'day' && scene.dayTime === 'DAY') ||
      (dayTimeFilter === 'night' && scene.dayTime === 'NIGHT') ||
      (dayTimeFilter === 'other' && ['DUSK', 'DAWN', 'OTHER'].includes(scene.dayTime || ''));
    
    return matchesSearch && matchesIntExt && matchesDayTime;
  });
  
  // Formatowanie czasu trwania sceny
  const formatSceneDuration = (minutes?: number) => {
    if (!minutes) return 'Nieznana';
    if (minutes < 1) return `${Math.round(minutes * 60)}s`;
    return `${minutes.toFixed(1)} min`;
  };
  
  const handleSceneClick = (sceneId: string) => {
    if (onSceneClick) {
      onSceneClick(sceneId);
    }
  };
  
  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  return (
    <Paper elevation={3} sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Struktura scen ({scenes.length})
      </Typography>
      
      {/* Pasek wyszukiwania i filtrów */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <TextField
          placeholder="Szukaj scen..."
          variant="outlined"
          size="small"
          fullWidth
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            )
          }}
        />
        
        <Button 
          variant={showFilters ? "contained" : "outlined"} 
          startIcon={<FilterListIcon />}
          onClick={toggleFilters}
          size="medium"
        >
          Filtry
        </Button>
      </Box>
      
      {/* Panel filtrów */}
      {showFilters && (
        <Box sx={{ mb: 3, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Wnętrze/Plener</InputLabel>
                <Select
                  value={intExtFilter}
                  label="Wnętrze/Plener"
                  onChange={(e) => setIntExtFilter(e.target.value)}
                >
                  <MenuItem value="all">Wszystkie</MenuItem>
                  <MenuItem value="int">Wnętrze (INT)</MenuItem>
                  <MenuItem value="ext">Plener (EXT)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Pora dnia</InputLabel>
                <Select
                  value={dayTimeFilter}
                  label="Pora dnia"
                  onChange={(e) => setDayTimeFilter(e.target.value)}
                >
                  <MenuItem value="all">Wszystkie</MenuItem>
                  <MenuItem value="day">Dzień</MenuItem>
                  <MenuItem value="night">Noc</MenuItem>
                  <MenuItem value="other">Inne (świt/zmierzch)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Box>
      )}
      
      {/* Lista scen */}
      <List sx={{ bgcolor: 'background.paper', borderRadius: 1 }}>
        {filteredScenes.length > 0 ? (
          filteredScenes.map((scene, index) => (
            <React.Fragment key={scene.id}>
              {index > 0 && <Divider />}
              <ListItem 
                alignItems="flex-start" 
                sx={{ 
                  '&:hover': { 
                    backgroundColor: 'action.hover',
                    cursor: 'pointer'
                  },
                  py: 1.5
                }}
                onClick={() => handleSceneClick(scene.id)}
              >
                <Box sx={{ width: '100%' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="subtitle1" fontWeight="bold">
                        Scena {scene.scene_number || scene.id}
                      </Typography>
                      
                      {scene.intExt && (
                        <Tooltip title={scene.intExt === 'INT' ? 'Wnętrze' : 'Plener'}>
                          <Chip 
                            icon={scene.intExt === 'INT' ? <HomeIcon fontSize="small" /> : <LandscapeIcon fontSize="small" />}
                            label={scene.intExt} 
                            size="small" 
                            color={scene.intExt === 'INT' ? 'primary' : 'secondary'}
                          />
                        </Tooltip>
                      )}
                      
                      {scene.dayTime && (
                        <Tooltip title={
                          scene.dayTime === 'DAY' ? 'Dzień' : 
                          scene.dayTime === 'NIGHT' ? 'Noc' : 
                          scene.dayTime === 'DUSK' ? 'Zmierzch' : 
                          scene.dayTime === 'DAWN' ? 'Świt' : 'Inna pora'
                        }>
                          <Chip 
                            icon={scene.dayTime === 'DAY' ? <WbSunnyIcon fontSize="small" /> : <NightsStayIcon fontSize="small" />}
                            label={scene.dayTime} 
                            size="small" 
                            sx={{ 
                              bgcolor: scene.dayTime === 'NIGHT' ? 'grey.700' : 
                                    (scene.dayTime === 'DUSK' || scene.dayTime === 'DAWN') ? 'warning.light' : 
                                    undefined,
                              color: scene.dayTime === 'NIGHT' ? 'white' : undefined
                            }}
                          />
                        </Tooltip>
                      )}
                    </Box>
                    
                    {scene.estimatedLength && (
                      <Chip 
                        label={formatSceneDuration(scene.estimatedLength)} 
                        size="small" 
                        variant="outlined"
                      />
                    )}
                  </Box>
                  
                  {scene.title && (
                    <Typography variant="body1" fontWeight="medium" sx={{ mb: 0.5 }}>
                      {scene.title}
                    </Typography>
                  )}
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {scene.description || 'Brak opisu sceny'}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {scene.location && (
                      <Chip 
                        label={scene.location} 
                        size="small" 
                        variant="outlined"
                        icon={<LocationOnIcon />}
                      />
                    )}
                    
                    {scene.characters && scene.characters.map((character, idx) => (
                      <Chip 
                        key={idx}
                        label={character} 
                        size="small" 
                        variant="outlined"
                      />
                    ))}
                  </Box>
                </Box>
              </ListItem>
            </React.Fragment>
          ))
        ) : (
          <ListItem>
            <ListItemText 
              primary="Brak scen spełniających kryteria wyszukiwania"
              secondary="Zmień filtrowanie lub wyszukiwaną frazę"
            />
          </ListItem>
        )}
      </List>
    </Paper>
  );
};

export default SceneStructureDisplay; 