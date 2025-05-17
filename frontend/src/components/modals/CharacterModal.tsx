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
  Button,
  Divider
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import TheatersIcon from '@mui/icons-material/Theaters';
import MoviesIcon from '@mui/icons-material/Movie';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
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
      id={`character-tabpanel-${index}`}
      aria-labelledby={`character-tab-${index}`}
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

interface CharacterModalProps {
  open: boolean;
  onClose: () => void;
  character: string;
  analysisResult: AnalysisResult;
}

interface CharacterData {
  name: string;
  role: string;
  scenes: { id: string; description: string }[];
  specialSkills: { skill: string; scene_id: string }[];
  relationships: { character: string; type: string }[];
  notes: string;
}

const CharacterModal: React.FC<CharacterModalProps> = ({ open, onClose, character, analysisResult }) => {
  const [tabValue, setTabValue] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editedNotes, setEditedNotes] = useState('');

  // Funkcja pomocnicza do zbierania danych o postaci z różnych sekcji AnalysisResult
  const getCharacterData = (): CharacterData => {
    // Podstawowe informacje o postaci
    const roleInfo = analysisResult.roles?.roles?.find(role => role.character === character);
    
    // Domyślne dane postaci
    const characterData: CharacterData = {
      name: character,
      role: roleInfo?.role || 'Nieznana rola',
      scenes: [],
      specialSkills: [],
      relationships: [],
      notes: ''
    };

    // Znajdź wszystkie sceny powiązane z postacią (w prawdziwej implementacji powinno to pochodzić z backendu)
    // To jest uproszczona implementacja oparta na dostępnych danych, używająca symulacji dla brakujących informacji
    
    // Symulacja danych dla scen
    const sceneIds = ['1', '3', '5', '8'];
    characterData.scenes = sceneIds.map(id => {
      // Spróbuj znaleźć opis dla sceny
      let description = 'Brak opisu';
      
      // Sprawdź w critical_scenes
      const criticalScene = analysisResult.analysis?.critical_scenes?.find(s => s.scene_id === id);
      if (criticalScene) {
        description = criticalScene.description;
      }
      
      return { id, description };
    });
    
    // Zbierz specjalne umiejętności (jeśli są dostępne)
    if (analysisResult.cast_skills?.special_skills) {
      characterData.specialSkills = analysisResult.cast_skills.special_skills
        .filter(skill => skill.character === character)
        .map(skill => ({ skill: skill.skill, scene_id: skill.scene_id }));
    }
    
    // Symulacja relacji między postaciami
    if (analysisResult.roles?.roles) {
      // Weź kilka losowych postaci jako powiązane
      const otherCharacters = analysisResult.roles.roles
        .filter(role => role.character !== character)
        .slice(0, 3);
      
      const relationshipTypes = ['przyjaciel', 'wróg', 'kochanek', 'mentor', 'rywal'];
      
      characterData.relationships = otherCharacters.map(otherRole => ({
        character: otherRole.character,
        type: relationshipTypes[Math.floor(Math.random() * relationshipTypes.length)]
      }));
    }
    
    // Symulacja notatek dla postaci
    characterData.notes = `Notatki dla postaci ${character}. W rzeczywistej implementacji te dane powinny pochodzić z backendu i być edytowalne przez użytkownika.`;
    
    return characterData;
  };

  const characterData = getCharacterData();
  
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  const handleEditClick = () => {
    setIsEditing(true);
    setEditedNotes(characterData.notes);
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
          {characterData.name}
          <Chip 
            size="small" 
            label={characterData.role} 
            sx={{ ml: 1 }} 
            color="primary"
          />
        </Typography>
        <IconButton aria-label="close" onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="character tabs">
          <Tab label="Informacje" />
          <Tab label="Sceny" />
          <Tab label="Relacje" />
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
                    <Typography variant="subtitle1" fontWeight="bold">Imię/Nazwa</Typography>
                    <Typography>{characterData.name}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle1" fontWeight="bold">Rola</Typography>
                    <Typography>{characterData.role}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle1" fontWeight="bold">Liczba scen</Typography>
                    <Typography>{characterData.scenes.length}</Typography>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
            
            {characterData.specialSkills.length > 0 && (
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>Specjalne umiejętności</Typography>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <List>
                    {characterData.specialSkills.map((skill, index) => (
                      <ListItem key={index}>
                        <ListItemText 
                          primary={skill.skill} 
                          secondary={`Scena ${skill.scene_id}`} 
                        />
                      </ListItem>
                    ))}
                  </List>
                </Paper>
              </Grid>
            )}
          </Grid>
        </TabPanel>
        
        <TabPanel value={tabValue} index={1}>
          <Typography variant="h6" gutterBottom>Sceny z udziałem postaci</Typography>
          <List>
            {characterData.scenes.map((scene, index) => (
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
          <Typography variant="h6" gutterBottom>Relacje z innymi postaciami</Typography>
          <List>
            {characterData.relationships.map((rel, index) => (
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
                      <TheatersIcon color="secondary" sx={{ fontSize: 24, mr: 1 }} />
                    </Grid>
                    <Grid item xs>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {rel.character}
                      </Typography>
                      <Chip 
                        label={rel.type} 
                        size="small" 
                        color="primary" 
                        variant="outlined" 
                      />
                    </Grid>
                  </Grid>
                </Paper>
              </ListItem>
            ))}
          </List>
        </TabPanel>
        
        <TabPanel value={tabValue} index={3}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6">Notatki</Typography>
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
              <Typography>{characterData.notes}</Typography>
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

export default CharacterModal; 