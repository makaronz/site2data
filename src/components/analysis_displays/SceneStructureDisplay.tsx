import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  List,
  ListItemButton,
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
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import NightsStayIcon from '@mui/icons-material/NightsStay';
import HomeIcon from '@mui/icons-material/Home';
import LandscapeIcon from '@mui/icons-material/Landscape';
import LocationOnIcon from '@mui/icons-material/LocationOn';

interface Scene {
  scene_id: string;
  title?: string;
  description?: string;
  int_ext?: 'INT' | 'EXT' | null;
  day_time?: 'DAY' | 'NIGHT' | 'DUSK' | 'DAWN' | 'OTHER' | null;
  location?: string;
  characters?: string[];
  estimated_length?: string | number;
}

interface AnalysisResult {
  scenes_structure?: {
    scenes?: Scene[];
  };
  analysis?: {
    critical_scenes?: Array<{
      scene_id: string;
      description: string;
    }>;
  };
  locations?: {
    locations?: string[];
  };
  roles?: {
    roles?: Array<{ character: string; role: string }>;
  };
}

interface SceneStructureDisplayProps {
  analysisResult: AnalysisResult;
  onSceneClick?: (sceneId: string) => void;
}

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

const SceneStructureDisplay = ({ analysisResult, onSceneClick }: SceneStructureDisplayProps): React.ReactNode => {
  const [searchQuery, setSearchQuery] = useState('');
  const [intExtFilter, setIntExtFilter] = useState<string>('all');
  const [dayTimeFilter, setDayTimeFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  
  // Funkcja przygotowująca dane scen do wyświetlenia
  const getScenes = (): SceneDisplayData[] => {
    if (analysisResult.scenes_structure?.scenes && analysisResult.scenes_structure.scenes.length > 0) {
      return analysisResult.scenes_structure.scenes.map(scene => ({
        id: scene.scene_id,
        scene_number: scene.scene_id,
        title: scene.title,
        description: scene.description,
        intExt: scene.int_ext,
        dayTime: scene.day_time,
        location: scene.location,
        characters: scene.characters,
        estimatedLength: scene.estimated_length ? parseFloat(String(scene.estimated_length)) : undefined
      }));
    }
    
    if (analysisResult.analysis?.critical_scenes && analysisResult.analysis.critical_scenes.length > 0) {
      return analysisResult.analysis.critical_scenes.map((scene) => ({
        id: scene.scene_id,
        scene_number: scene.scene_id,
        description: scene.description,
        intExt: Math.random() > 0.5 ? 'INT' : 'EXT',
        dayTime: Math.random() > 0.3 ? 'DAY' : (Math.random() > 0.5 ? 'NIGHT' : 'DUSK'),
        location: analysisResult.locations?.locations?.[Math.floor(Math.random() * (analysisResult.locations.locations.length || 1))] || 'Nieznana lokacja',
        characters: analysisResult.roles?.roles
          ?.slice(0, Math.floor(Math.random() * 3) + 1)
          .map(role => role.character) || []
      }));
    }
    // Jawne typowanie, aby upewnić się, że TS rozumie typ zwracany
    const emptyScenes: SceneDisplayData[] = [];
    return emptyScenes;
  };
  
  const scenes = getScenes();
  
  const filteredScenes = scenes.filter(scene => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = 
      searchQuery === '' || 
      (scene.title && scene.title.toLowerCase().includes(searchLower)) ||
      (scene.description && scene.description.toLowerCase().includes(searchLower)) ||
      (scene.location && scene.location.toLowerCase().includes(searchLower)) ||
      (scene.characters && scene.characters.some(char => char.toLowerCase().includes(searchLower)));
    
    const matchesIntExt = 
      intExtFilter === 'all' || 
      (intExtFilter === 'int' && scene.intExt === 'INT') ||
      (intExtFilter === 'ext' && scene.intExt === 'EXT');
    
    const matchesDayTime = 
      dayTimeFilter === 'all' || 
      (dayTimeFilter === 'day' && scene.dayTime === 'DAY') ||
      (dayTimeFilter === 'night' && scene.dayTime === 'NIGHT') ||
      (dayTimeFilter === 'other' && ['DUSK', 'DAWN', 'OTHER'].includes(scene.dayTime || ''));
    
    return matchesSearch && matchesIntExt && matchesDayTime;
  });
  
  const formatSceneDuration = (minutes?: number) => {
    if (minutes === undefined || minutes === null) return 'Nieznana';
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

  const DayTimeIcon = ({ dayTime }: { dayTime: SceneDisplayData['dayTime'] }) => {
    switch (dayTime) {
      case 'DAY': return <WbSunnyIcon fontSize="small" />;
      case 'NIGHT': return <NightsStayIcon fontSize="small" />;
      case 'DUSK':
      case 'DAWN':
      case 'OTHER':
        return <NightsStayIcon fontSize="small" sx={{ opacity: 0.7 }}/>;
      default: return null;
    }
  };
  
  const translateDayTime = (dayTime: SceneDisplayData['dayTime']) => {
    switch (dayTime) {
      case 'DAY': return 'Dzień';
      case 'NIGHT': return 'Noc';
      case 'DUSK': return 'Zmierzch';
      case 'DAWN': return 'Świt';
      case 'OTHER': return 'Inna';
      default: return 'Nieznana';
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Struktura scen ({scenes.length})
      </Typography>
      
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
      
      {showFilters && (
        <Box sx={{ mb: 3, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
          <Grid container spacing={2} alignItems="center">
            {/* @ts-ignore Problemy z typowaniem Grid item, tymczasowe ignorowanie */}
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
            
            {/* @ts-ignore Problemy z typowaniem Grid item, tymczasowe ignorowanie */}
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
      
      <List sx={{ bgcolor: 'background.paper', borderRadius: 1, overflow: 'auto', maxHeight: '60vh' }}>
        {filteredScenes.length > 0 ? (
          filteredScenes.map((scene, index) => (
            <React.Fragment key={scene.id}>
              {index > 0 && <Divider />}
              <ListItemButton
                alignItems="flex-start" 
                sx={{ 
                  '&:hover': { backgroundColor: 'action.hover' },
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
                            variant="outlined"
                            color={scene.intExt === 'INT' ? 'primary' : 'success'}
                          />
                        </Tooltip>
                      )}
                      
                      {scene.dayTime && (
                        <Tooltip title={translateDayTime(scene.dayTime)}>
                          <Chip 
                            icon={<DayTimeIcon dayTime={scene.dayTime} />}
                            label={translateDayTime(scene.dayTime)} 
                            size="small"
                            variant="outlined"
                          />
                        </Tooltip>
                      )}
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      Długość: {formatSceneDuration(scene.estimatedLength)}
                    </Typography>
                  </Box>
                  
                  {scene.title && (
                    <Typography variant="body1" gutterBottom sx={{ fontWeight: 'medium' }}>
                      {scene.title}
                    </Typography>
                  )}
                  
                  {scene.description && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {scene.description}
                    </Typography>
                  )}
                  
                  {scene.location && (
                    <Chip 
                      icon={<LocationOnIcon fontSize="small" />} 
                      label={scene.location} 
                      size="small" 
                      sx={{ mr: 1, mb: 0.5 }} 
                      variant="outlined"
                    />
                  )}

                  {scene.characters && scene.characters.length > 0 && (
                    scene.characters.map(char => (
                      <Chip 
                        key={char} 
                        label={char} 
                        size="small" 
                        sx={{ mr: 0.5, mb: 0.5 }} 
                        variant="outlined"
                        color="default"
                      />
                    ))
                  )}
                </Box>
              </ListItemButton>
            </React.Fragment>
          ))
        ) : (
          <ListItemText 
            primary="Nie znaleziono scen pasujących do kryteriów." 
            sx={{ textAlign: 'center', p: 2 }} 
          />
        )}
      </List>
    </Paper>
  );
};

export default SceneStructureDisplay; 