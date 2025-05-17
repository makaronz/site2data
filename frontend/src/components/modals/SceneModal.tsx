import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Typography,
  Grid,
  Chip,
  Box,
  Divider,
  List,
  ListItem,
  ListItemText,
  Button,
  Paper,
  Tab,
  Tabs
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PersonIcon from '@mui/icons-material/Person';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PropIcon from '@mui/icons-material/EmojiObjects';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import WarningIcon from '@mui/icons-material/Warning';
import NightsStayIcon from '@mui/icons-material/NightsStay';
import ChildCareIcon from '@mui/icons-material/ChildCare';
import PetsIcon from '@mui/icons-material/Pets';
import BuildIcon from '@mui/icons-material/Build';
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
      id={`scene-tabpanel-${index}`}
      aria-labelledby={`scene-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

interface SceneModalProps {
  open: boolean;
  onClose: () => void;
  sceneId: string;
  analysisResult: AnalysisResult;
}

interface SceneData {
  id: string;
  description: string;
  intExt?: 'INT' | 'EXT' | null;
  dayTime?: 'DAY' | 'NIGHT' | 'DUSK' | 'DAWN' | 'OTHER' | null;
  location?: string;
  characters?: string[];
  props?: string[];
  vehicles?: string[];
  weapons?: string[];
  tags?: string[];
  estimatedLength?: 'short' | 'medium' | 'long' | null;
  productionChecklist?: {
    hasRisk?: boolean;
    hasChildren?: boolean;
    needsPermit?: boolean;
    hasAnimals?: boolean;
    isNightScene?: boolean;
  };
}

const SceneModal: React.FC<SceneModalProps> = ({ open, onClose, sceneId, analysisResult }) => {
  const [tabValue, setTabValue] = useState(0);

  // Funkcja pomocnicza do zbierania danych o scenie z różnych sekcji AnalysisResult
  const getSceneData = (): SceneData => {
    // Domyślne dane sceny
    const sceneData: SceneData = {
      id: sceneId,
      description: 'Brak opisu',
    };

    // Krytyczne sceny z metadanych
    if (analysisResult.analysis?.critical_scenes) {
      const criticalScene = analysisResult.analysis.critical_scenes.find(
        scene => scene.scene_id === sceneId
      );
      if (criticalScene) {
        sceneData.description = criticalScene.description;
        if (!sceneData.tags) sceneData.tags = [];
        sceneData.tags.push('critical');
      }
    }

    // Trudne sceny
    if (analysisResult.difficult_scenes?.difficult_scenes) {
      const difficultScene = analysisResult.difficult_scenes.difficult_scenes.find(
        scene => scene.scene_id === sceneId
      );
      if (difficultScene) {
        if (!sceneData.tags) sceneData.tags = [];
        sceneData.tags.push('difficult');
      }
    }

    // Props w scenie
    if (analysisResult.props?.scene_props && analysisResult.props.scene_props[sceneId]) {
      sceneData.props = analysisResult.props.scene_props[sceneId];
    }

    // Vehicles w scenie
    if (analysisResult.vehicles?.scene_vehicles && analysisResult.vehicles.scene_vehicles[sceneId]) {
      sceneData.vehicles = analysisResult.vehicles.scene_vehicles[sceneId];
    }

    // Weapons w scenie
    if (analysisResult.weapons?.scene_weapons && analysisResult.weapons.scene_weapons[sceneId]) {
      sceneData.weapons = analysisResult.weapons.scene_weapons[sceneId];
    }

    // Oświetlenie
    if (analysisResult.lighting_schemes?.lighting) {
      const lighting = analysisResult.lighting_schemes.lighting.find(
        light => light.scene_id === sceneId
      );
      if (lighting) {
        if (!sceneData.tags) sceneData.tags = [];
        sceneData.tags.push(`lighting:${lighting.style}`);
      }
    }

    // Symulacja danych, które byłyby dostępne po rozszerzeniu modelu
    // W rzeczywistości te dane powinny pochodzić z rozszerzonego modelu AnalysisResult
    // Poniżej przykładowe dane dla demonstracji
    sceneData.intExt = Math.random() > 0.5 ? 'INT' : 'EXT';
    sceneData.dayTime = ['DAY', 'NIGHT', 'DUSK', 'DAWN'][Math.floor(Math.random() * 4)] as 'DAY' | 'NIGHT' | 'DUSK' | 'DAWN';
    sceneData.location = analysisResult.locations?.locations?.[Math.floor(Math.random() * (analysisResult.locations.locations.length || 1))] || 'Nieznana lokacja';
    sceneData.characters = analysisResult.roles?.roles?.map(role => role.character).slice(0, Math.floor(Math.random() * 5) + 1) || [];
    sceneData.estimatedLength = ['short', 'medium', 'long'][Math.floor(Math.random() * 3)] as 'short' | 'medium' | 'long';
    
    // Symulacja danych checklisty produkcyjnej
    sceneData.productionChecklist = {
      hasRisk: Math.random() > 0.7,
      hasChildren: Math.random() > 0.8,
      needsPermit: Math.random() > 0.7,
      hasAnimals: Math.random() > 0.8,
      isNightScene: sceneData.dayTime === 'NIGHT',
    };
    
    return sceneData;
  };

  const sceneData = getSceneData();

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      fullWidth 
      maxWidth="md"
      scroll="paper"
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">
          Scena {sceneId} 
          {sceneData.intExt && <Chip 
            size="small" 
            label={sceneData.intExt} 
            sx={{ ml: 1, backgroundColor: sceneData.intExt === 'INT' ? 'info.light' : 'success.light' }} 
          />}
          {sceneData.dayTime && <Chip 
            size="small" 
            label={sceneData.dayTime} 
            sx={{ ml: 1, backgroundColor: sceneData.dayTime === 'NIGHT' ? 'grey.700' : 'warning.light', color: sceneData.dayTime === 'NIGHT' ? 'white' : 'inherit' }} 
          />}
        </Typography>
        <IconButton aria-label="close" onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="scene tabs">
          <Tab label="Szczegóły" />
          <Tab label="Powiązania" />
          <Tab label="Checklista produkcyjna" />
        </Tabs>
      </Box>
      
      <DialogContent>
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>Opis</Typography>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography>{sceneData.description}</Typography>
              </Paper>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle1" gutterBottom>Lokacja</Typography>
              <Chip 
                icon={<LocationOnIcon />} 
                label={sceneData.location} 
                variant="outlined" 
                color="primary" 
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle1" gutterBottom>Szacowana długość</Typography>
              <Chip 
                label={sceneData.estimatedLength === 'short' ? 'Krótka' : sceneData.estimatedLength === 'medium' ? 'Średnia' : 'Długa'} 
                variant="outlined" 
                color={sceneData.estimatedLength === 'short' ? 'success' : sceneData.estimatedLength === 'medium' ? 'info' : 'warning'} 
              />
            </Grid>
            
            {sceneData.tags && sceneData.tags.length > 0 && (
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>Tagi</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {sceneData.tags.map((tag, index) => (
                    <Chip key={index} label={tag} size="small" />
                  ))}
                </Box>
              </Grid>
            )}
          </Grid>
        </TabPanel>
        
        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>Postaci</Typography>
              {sceneData.characters && sceneData.characters.length > 0 ? (
                <List>
                  {sceneData.characters.map((character, index) => (
                    <ListItem key={index} sx={{ pb: 0 }}>
                      <PersonIcon sx={{ mr: 1, color: 'primary.main' }} />
                      <ListItemText primary={character} />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography color="text.secondary">Brak powiązanych postaci</Typography>
              )}
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>Rekwizyty</Typography>
              {sceneData.props && sceneData.props.length > 0 ? (
                <List>
                  {sceneData.props.map((prop, index) => (
                    <ListItem key={index} sx={{ pb: 0 }}>
                      <PropIcon sx={{ mr: 1, color: 'secondary.main' }} />
                      <ListItemText primary={prop} />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography color="text.secondary">Brak powiązanych rekwizytów</Typography>
              )}
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>Pojazdy</Typography>
              {sceneData.vehicles && sceneData.vehicles.length > 0 ? (
                <List>
                  {sceneData.vehicles.map((vehicle, index) => (
                    <ListItem key={index} sx={{ pb: 0 }}>
                      <DirectionsCarIcon sx={{ mr: 1, color: 'info.main' }} />
                      <ListItemText primary={vehicle} />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography color="text.secondary">Brak powiązanych pojazdów</Typography>
              )}
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>Broń</Typography>
              {sceneData.weapons && sceneData.weapons.length > 0 ? (
                <List>
                  {sceneData.weapons.map((weapon, index) => (
                    <ListItem key={index} sx={{ pb: 0 }}>
                      <WarningIcon sx={{ mr: 1, color: 'error.main' }} />
                      <ListItemText primary={weapon} />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography color="text.secondary">Brak powiązanej broni</Typography>
              )}
            </Grid>
          </Grid>
        </TabPanel>
        
        <TabPanel value={tabValue} index={2}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>Checklista produkcyjna</Typography>
                <List>
                  <ListItem>
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      width: '100%', 
                      backgroundColor: sceneData.productionChecklist?.hasRisk ? 'error.light' : 'success.light',
                      borderRadius: 1,
                      py: 1,
                      px: 2
                    }}>
                      <WarningIcon sx={{ mr: 1, color: sceneData.productionChecklist?.hasRisk ? 'error.main' : 'success.main' }} />
                      <ListItemText 
                        primary="Ryzyko produkcyjne" 
                        secondary={sceneData.productionChecklist?.hasRisk ? "Scena zawiera elementy ryzyka produkcyjnego" : "Brak zidentyfikowanego ryzyka"} 
                      />
                    </Box>
                  </ListItem>
                  
                  <ListItem>
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      width: '100%', 
                      backgroundColor: sceneData.productionChecklist?.hasChildren ? 'warning.light' : 'success.light',
                      borderRadius: 1,
                      py: 1,
                      px: 2
                    }}>
                      <ChildCareIcon sx={{ mr: 1, color: sceneData.productionChecklist?.hasChildren ? 'warning.main' : 'success.main' }} />
                      <ListItemText 
                        primary="Dzieci na planie" 
                        secondary={sceneData.productionChecklist?.hasChildren ? "Scena wymaga obecności dzieci" : "Brak dzieci w scenie"} 
                      />
                    </Box>
                  </ListItem>
                  
                  <ListItem>
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      width: '100%', 
                      backgroundColor: sceneData.productionChecklist?.hasAnimals ? 'warning.light' : 'success.light',
                      borderRadius: 1,
                      py: 1,
                      px: 2
                    }}>
                      <PetsIcon sx={{ mr: 1, color: sceneData.productionChecklist?.hasAnimals ? 'warning.main' : 'success.main' }} />
                      <ListItemText 
                        primary="Zwierzęta na planie" 
                        secondary={sceneData.productionChecklist?.hasAnimals ? "Scena wymaga obecności zwierząt" : "Brak zwierząt w scenie"} 
                      />
                    </Box>
                  </ListItem>
                  
                  <ListItem>
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      width: '100%', 
                      backgroundColor: sceneData.productionChecklist?.needsPermit ? 'warning.light' : 'success.light',
                      borderRadius: 1,
                      py: 1,
                      px: 2
                    }}>
                      <BuildIcon sx={{ mr: 1, color: sceneData.productionChecklist?.needsPermit ? 'warning.main' : 'success.main' }} />
                      <ListItemText 
                        primary="Wymagane pozwolenia" 
                        secondary={sceneData.productionChecklist?.needsPermit ? "Scena wymaga specjalnych pozwoleń" : "Brak potrzeby uzyskania pozwoleń"} 
                      />
                    </Box>
                  </ListItem>
                  
                  <ListItem>
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      width: '100%', 
                      backgroundColor: sceneData.productionChecklist?.isNightScene ? 'grey.700' : 'success.light',
                      borderRadius: 1,
                      py: 1,
                      px: 2,
                      color: sceneData.productionChecklist?.isNightScene ? 'white' : 'inherit'
                    }}>
                      <NightsStayIcon sx={{ mr: 1, color: sceneData.productionChecklist?.isNightScene ? 'white' : 'success.main' }} />
                      <ListItemText 
                        primary="Scena nocna" 
                        secondary={sceneData.productionChecklist?.isNightScene ? "Scena realizowana w nocy" : "Scena dzienna"} 
                        sx={{ color: sceneData.productionChecklist?.isNightScene ? 'white' : 'inherit' }}
                      />
                    </Box>
                  </ListItem>
                </List>
              </Paper>
            </Grid>
          </Grid>
        </TabPanel>
      </DialogContent>
    </Dialog>
  );
};

export default SceneModal; 