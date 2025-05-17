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
  List,
  ListItem,
  ListItemText,
  Paper,
  Tab,
  Tabs,
  TextField,
  Button
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import MoviesIcon from '@mui/icons-material/Movie';
import PersonIcon from '@mui/icons-material/Person';
import PlaceIcon from '@mui/icons-material/Place';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import HomeIcon from '@mui/icons-material/Home';
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
      id={`location-tabpanel-${index}`}
      aria-labelledby={`location-tab-${index}`}
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

interface LocationModalProps {
  open: boolean;
  onClose: () => void;
  location: string;
  analysisResult: AnalysisResult;
}

interface LocationData {
  name: string;
  type: 'interior' | 'exterior' | 'interior_exterior' | 'unknown';
  scenes: { id: string; description: string }[];
  characters: string[];
  logisticsNotes: string;
  userNotes: string;
}

const LocationModal: React.FC<LocationModalProps> = ({ open, onClose, location, analysisResult }) => {
  const [tabValue, setTabValue] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editedNotes, setEditedNotes] = useState('');

  // Funkcja pomocnicza do zbierania danych o lokacji z różnych sekcji AnalysisResult
  const getLocationData = (): LocationData => {
    // Domyślne dane lokacji
    const locationData: LocationData = {
      name: location,
      type: 'unknown',
      scenes: [],
      characters: [],
      logisticsNotes: '',
      userNotes: ''
    };

    // Określ typ lokacji - w rzeczywistej implementacji powinno to pochodzić z backendu
    // Na potrzeby przykładu, używamy losowego typu
    const locationTypes = ['interior', 'exterior', 'interior_exterior', 'unknown'];
    locationData.type = locationTypes[Math.floor(Math.random() * 3)] as 'interior' | 'exterior' | 'interior_exterior' | 'unknown';

    // Symulacja scen dla tej lokacji
    // W rzeczywistej implementacji te dane powinny być dostępne w backend lub w rozszerzonym AnalysisResult
    const sceneIds = ['2', '4', '6', '9'];
    locationData.scenes = sceneIds.map(id => {
      let description = 'Brak opisu';
      
      // Sprawdź w critical_scenes
      const criticalScene = analysisResult.analysis?.critical_scenes?.find(s => s.scene_id === id);
      if (criticalScene) {
        description = criticalScene.description;
      }
      
      return { id, description };
    });

    // Symulacja postaci przebywających w tej lokacji
    // W rzeczywistej implementacji to byłoby wyliczone na podstawie scen w danej lokacji
    if (analysisResult.roles?.roles) {
      // Wybierz losowe postaci
      locationData.characters = analysisResult.roles.roles
        .slice(0, Math.floor(Math.random() * 5) + 1)
        .map(role => role.character);
    }

    // Symulacja notatek logistycznych
    locationData.logisticsNotes = `Notatki logistyczne dla lokacji ${location}. Zawierają informacje o dostępności, kosztach i wymaganiach technicznych.`;
    
    // Symulacja notatek użytkownika
    locationData.userNotes = `Notatki użytkownika dla lokacji ${location}. W rzeczywistej implementacji te dane powinny pochodzić z backendu i być edytowalne.`;

    return locationData;
  };

  const locationData = getLocationData();
  
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  const handleEditClick = () => {
    setIsEditing(true);
    setEditedNotes(locationData.userNotes);
  };
  
  const handleSaveClick = () => {
    // W rzeczywistej implementacji tutaj byłby kod zapisujący zmiany do backendu
    setIsEditing(false);
    // Na tym etapie tylko udajemy, że zapisaliśmy (brak faktycznego zapisu)
    alert('Zapisano zmiany (symulacja - bez faktycznego zapisu)');
  };
  
  const handleCancelClick = () => {
    setIsEditing(false);
    setEditedNotes('');
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
          {locationData.name}
          <Chip 
            size="small" 
            icon={<HomeIcon />}
            label={locationData.type === 'interior' ? 'Wnętrze' : 
                   locationData.type === 'exterior' ? 'Plener' : 
                   locationData.type === 'interior_exterior' ? 'Mieszana' : 'Nieznany'}
            sx={{ ml: 1 }}
            color={locationData.type === 'interior' ? 'primary' : 
                   locationData.type === 'exterior' ? 'success' : 
                   locationData.type === 'interior_exterior' ? 'warning' : 'default'}
          />
        </Typography>
        <IconButton aria-label="close" onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="location tabs">
          <Tab label="Informacje" />
          <Tab label="Sceny" />
          <Tab label="Postaci" />
          <Tab label="Notatki" />
        </Tabs>
      </Box>
      
      <DialogContent>
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>Podstawowe informacje</Typography>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle1" fontWeight="bold">Nazwa</Typography>
                    <Typography>{locationData.name}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle1" fontWeight="bold">Typ</Typography>
                    <Typography>
                      {locationData.type === 'interior' ? 'Wnętrze' : 
                       locationData.type === 'exterior' ? 'Plener' : 
                       locationData.type === 'interior_exterior' ? 'Mieszana' : 'Nieznany'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle1" fontWeight="bold">Liczba scen</Typography>
                    <Typography>{locationData.scenes.length}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle1" fontWeight="bold">Liczba postaci</Typography>
                    <Typography>{locationData.characters.length}</Typography>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>Notatki logistyczne</Typography>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography>{locationData.logisticsNotes}</Typography>
              </Paper>
            </Grid>
          </Grid>
        </TabPanel>
        
        <TabPanel value={tabValue} index={1}>
          <Typography variant="h6" gutterBottom>Sceny w tej lokacji</Typography>
          <List>
            {locationData.scenes.map((scene, index) => (
              <ListItem key={index} sx={{ mb: 2 }}>
                <Paper 
                  variant="outlined" 
                  sx={{ 
                    p: 2, 
                    width: '100%',
                    '&:hover': {
                      backgroundColor: 'action.hover',
                      cursor: 'pointer'
                    }
                  }}
                >
                  <Grid container spacing={1}>
                    <Grid item>
                      <MoviesIcon color="primary" sx={{ fontSize: 24, mr: 1 }} />
                    </Grid>
                    <Grid item xs>
                      <Typography variant="subtitle1" fontWeight="bold">
                        Scena {scene.id}
                      </Typography>
                      <Typography variant="body2">{scene.description}</Typography>
                    </Grid>
                  </Grid>
                </Paper>
              </ListItem>
            ))}
          </List>
        </TabPanel>
        
        <TabPanel value={tabValue} index={2}>
          <Typography variant="h6" gutterBottom>Postaci w tej lokacji</Typography>
          <List>
            {locationData.characters.map((character, index) => (
              <ListItem key={index} sx={{ mb: 2 }}>
                <Paper 
                  variant="outlined" 
                  sx={{ 
                    p: 2, 
                    width: '100%',
                    '&:hover': {
                      backgroundColor: 'action.hover',
                      cursor: 'pointer'
                    }
                  }}
                >
                  <Grid container spacing={1}>
                    <Grid item>
                      <PersonIcon color="secondary" sx={{ fontSize: 24, mr: 1 }} />
                    </Grid>
                    <Grid item xs>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {character}
                      </Typography>
                    </Grid>
                  </Grid>
                </Paper>
              </ListItem>
            ))}
          </List>
        </TabPanel>
        
        <TabPanel value={tabValue} index={3}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6">Notatki użytkownika</Typography>
            {!isEditing ? (
              <Button 
                startIcon={<EditIcon />} 
                variant="outlined" 
                onClick={handleEditClick}
              >
                Edytuj
              </Button>
            ) : (
              <Box>
                <Button 
                  startIcon={<SaveIcon />} 
                  variant="contained" 
                  color="primary"
                  onClick={handleSaveClick}
                  sx={{ mr: 1 }}
                >
                  Zapisz
                </Button>
                <Button 
                  startIcon={<CancelIcon />} 
                  variant="outlined" 
                  color="error"
                  onClick={handleCancelClick}
                >
                  Anuluj
                </Button>
              </Box>
            )}
          </Box>
          
          <Paper variant="outlined" sx={{ p: 2 }}>
            {!isEditing ? (
              <Typography>{locationData.userNotes}</Typography>
            ) : (
              <TextField
                fullWidth
                multiline
                rows={6}
                value={editedNotes}
                onChange={(e) => setEditedNotes(e.target.value)}
                variant="outlined"
              />
            )}
          </Paper>
        </TabPanel>
      </DialogContent>
    </Dialog>
  );
};

export default LocationModal; 