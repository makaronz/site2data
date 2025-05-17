import React, { useState, useMemo } from 'react';
import {
  Paper,
  Typography,
  Box,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Grid,
  Divider,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Button,
  IconButton,
  Tooltip
} from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import WarningIcon from '@mui/icons-material/Warning';
import NightsStayIcon from '@mui/icons-material/NightsStay';
import ChildCareIcon from '@mui/icons-material/ChildCare';
import PetsIcon from '@mui/icons-material/Pets';
import BuildIcon from '@mui/icons-material/Build';
import InfoIcon from '@mui/icons-material/Info';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import type { AnalysisResult } from '../../types';

interface Scene {
  id: string;
  title?: string;
  description?: string;
  intExt: 'INT' | 'EXT' | null;
  dayTime: 'DAY' | 'NIGHT' | 'DUSK' | 'DAWN' | 'OTHER' | null;
  location?: string;
  productionChecklist: {
    hasRisk: boolean;
    hasChildren: boolean;
    needsPermit: boolean;
    hasAnimals: boolean;
    isNightScene: boolean;
  };
}

interface ProductionChecklistDisplayProps {
  analysisResult: AnalysisResult;
  onSceneClick?: (sceneId: string) => void;
}

const ProductionChecklistDisplay: React.FC<ProductionChecklistDisplayProps> = ({ analysisResult, onSceneClick }) => {
  const [filters, setFilters] = useState({
    showRisk: true,
    showChildren: true,
    showAnimals: true,
    showPermits: true,
    showNightScenes: true
  });
  const [filtersVisible, setFiltersVisible] = useState(false);

  // Symulacja scen z checklistami (w rzeczywistej implementacji pobrałbym je z backendu)
  const scenes = useMemo(() => {
    // Dane przykładowe dla demonstracji
    const mockScenes: Scene[] = [];
    
    // Użyj krytycznych scen jako bazę do symulacji danych checklisty
    if (analysisResult.analysis?.critical_scenes) {
      analysisResult.analysis.critical_scenes.forEach(criticalScene => {
        // Losowo przydzielaj wartości checklisty
        mockScenes.push({
          id: criticalScene.scene_id,
          description: criticalScene.description,
          intExt: Math.random() > 0.5 ? 'INT' : 'EXT',
          dayTime: Math.random() > 0.7 ? 'NIGHT' : 'DAY',
          location: analysisResult.locations?.locations?.[Math.floor(Math.random() * (analysisResult.locations.locations?.length || 1))] || 'Nieznana',
          productionChecklist: {
            hasRisk: Math.random() > 0.7,
            hasChildren: Math.random() > 0.8,
            needsPermit: Math.random() > 0.7,
            hasAnimals: Math.random() > 0.8,
            isNightScene: Math.random() > 0.7
          }
        });
      });
    }
    
    // Dodaj kilka dodatkowych scen, jeśli mamy za mało
    if (mockScenes.length < 5) {
      for (let i = mockScenes.length + 1; i <= 10; i++) {
        mockScenes.push({
          id: i.toString(),
          title: `Scena ${i}`,
          description: `Opis sceny ${i}`,
          intExt: Math.random() > 0.5 ? 'INT' : 'EXT',
          dayTime: Math.random() > 0.7 ? 'NIGHT' : 'DAY',
          location: `Lokacja ${i}`,
          productionChecklist: {
            hasRisk: Math.random() > 0.7,
            hasChildren: Math.random() > 0.8,
            needsPermit: Math.random() > 0.7,
            hasAnimals: Math.random() > 0.8,
            isNightScene: Math.random() > 0.7
          }
        });
      }
    }
    
    return mockScenes;
  }, [analysisResult]);

  // Filtrowanie scen na podstawie aktywnych filtrów
  const filteredScenes = useMemo(() => {
    return scenes.filter(scene => {
      if (filters.showRisk && scene.productionChecklist.hasRisk) return true;
      if (filters.showChildren && scene.productionChecklist.hasChildren) return true;
      if (filters.showAnimals && scene.productionChecklist.hasAnimals) return true;
      if (filters.showPermits && scene.productionChecklist.needsPermit) return true;
      if (filters.showNightScenes && scene.productionChecklist.isNightScene) return true;
      return false;
    });
  }, [scenes, filters]);

  // Liczniki dla poszczególnych kategorii ryzyk
  const risksCount = useMemo(() => {
    return {
      total: scenes.length,
      risk: scenes.filter(s => s.productionChecklist.hasRisk).length,
      children: scenes.filter(s => s.productionChecklist.hasChildren).length,
      animals: scenes.filter(s => s.productionChecklist.hasAnimals).length,
      permits: scenes.filter(s => s.productionChecklist.needsPermit).length,
      nightScenes: scenes.filter(s => s.productionChecklist.isNightScene).length
    };
  }, [scenes]);

  const handleFilterChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({
      ...filters,
      [event.target.name]: event.target.checked
    });
  };

  const toggleFiltersVisibility = () => {
    setFiltersVisible(!filtersVisible);
  };

  const handleSceneClick = (sceneId: string) => {
    if (onSceneClick) {
      onSceneClick(sceneId);
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" gutterBottom>
          Checklista Produkcyjna
        </Typography>
        <Button 
          startIcon={<FilterListIcon />} 
          onClick={toggleFiltersVisibility}
          variant={filtersVisible ? "contained" : "outlined"}
          size="small"
        >
          Filtry
        </Button>
      </Box>

      {/* Panel z podsumowaniem */}
      <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Podsumowanie
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={4}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <WarningIcon color="error" sx={{ mr: 1 }} />
              <Typography>
                Ryzyko produkcyjne: <b>{risksCount.risk}</b> scen
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <ChildCareIcon color="warning" sx={{ mr: 1 }} />
              <Typography>
                Dzieci na planie: <b>{risksCount.children}</b> scen
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <PetsIcon color="warning" sx={{ mr: 1 }} />
              <Typography>
                Zwierzęta na planie: <b>{risksCount.animals}</b> scen
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <BuildIcon color="warning" sx={{ mr: 1 }} />
              <Typography>
                Wymagane pozwolenia: <b>{risksCount.permits}</b> scen
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <NightsStayIcon sx={{ mr: 1 }} />
              <Typography>
                Sceny nocne: <b>{risksCount.nightScenes}</b> scen
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Panel filtrów */}
      {filtersVisible && (
        <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Pokaż sceny z:
          </Typography>
          <FormGroup row>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={4}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={filters.showRisk}
                      onChange={handleFilterChange}
                      name="showRisk"
                    />
                  }
                  label="Ryzyko produkcyjne"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={filters.showChildren}
                      onChange={handleFilterChange}
                      name="showChildren"
                    />
                  }
                  label="Dzieci na planie"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={filters.showAnimals}
                      onChange={handleFilterChange}
                      name="showAnimals"
                    />
                  }
                  label="Zwierzęta na planie"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={filters.showPermits}
                      onChange={handleFilterChange}
                      name="showPermits"
                    />
                  }
                  label="Wymagane pozwolenia"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={filters.showNightScenes}
                      onChange={handleFilterChange}
                      name="showNightScenes"
                    />
                  }
                  label="Sceny nocne"
                />
              </Grid>
            </Grid>
          </FormGroup>
        </Paper>
      )}

      {/* Lista scen */}
      <List>
        {filteredScenes.length > 0 ? (
          filteredScenes.map((scene) => (
            <React.Fragment key={scene.id}>
              <ListItem 
                alignItems="flex-start" 
                sx={{ 
                  backgroundColor: 'background.paper',
                  mb: 1,
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: 'divider',
                  '&:hover': { 
                    backgroundColor: 'action.hover',
                    cursor: 'pointer'
                  }
                }}
                onClick={() => handleSceneClick(scene.id)}
              >
                <Grid container spacing={1}>
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="subtitle1" fontWeight="bold">
                        Scena {scene.id} 
                        {scene.intExt && (
                          <Chip 
                            size="small" 
                            label={scene.intExt} 
                            sx={{ ml: 1, backgroundColor: scene.intExt === 'INT' ? 'info.light' : 'success.light' }} 
                          />
                        )}
                        {scene.dayTime && (
                          <Chip 
                            size="small" 
                            label={scene.dayTime} 
                            sx={{ 
                              ml: 1, 
                              backgroundColor: scene.dayTime === 'NIGHT' ? 'grey.700' : 'warning.light',
                              color: scene.dayTime === 'NIGHT' ? 'white' : 'inherit'
                            }} 
                          />
                        )}
                      </Typography>
                      <IconButton size="small">
                        <ChevronRightIcon />
                      </IconButton>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      {scene.description || `Lokacja: ${scene.location}`}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {scene.productionChecklist.hasRisk && (
                        <Tooltip title="Ryzyko produkcyjne">
                          <Chip 
                            icon={<WarningIcon />} 
                            label="Ryzyko" 
                            size="small" 
                            color="error" 
                          />
                        </Tooltip>
                      )}
                      {scene.productionChecklist.hasChildren && (
                        <Tooltip title="Dzieci na planie">
                          <Chip 
                            icon={<ChildCareIcon />} 
                            label="Dzieci" 
                            size="small" 
                            color="warning"
                          />
                        </Tooltip>
                      )}
                      {scene.productionChecklist.hasAnimals && (
                        <Tooltip title="Zwierzęta na planie">
                          <Chip 
                            icon={<PetsIcon />} 
                            label="Zwierzęta" 
                            size="small" 
                            color="warning"
                          />
                        </Tooltip>
                      )}
                      {scene.productionChecklist.needsPermit && (
                        <Tooltip title="Wymagane pozwolenia">
                          <Chip 
                            icon={<BuildIcon />} 
                            label="Pozwolenia" 
                            size="small" 
                            color="warning"
                          />
                        </Tooltip>
                      )}
                      {scene.productionChecklist.isNightScene && (
                        <Tooltip title="Scena nocna">
                          <Chip 
                            icon={<NightsStayIcon />} 
                            label="Noc" 
                            size="small" 
                            sx={{ backgroundColor: 'grey.700', color: 'white' }}
                          />
                        </Tooltip>
                      )}
                    </Box>
                  </Grid>
                </Grid>
              </ListItem>
            </React.Fragment>
          ))
        ) : (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <InfoIcon sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
            <Typography color="text.secondary">
              Brak scen spełniających wybrane kryteria.
            </Typography>
          </Box>
        )}
      </List>
    </Paper>
  );
};

export default ProductionChecklistDisplay; 