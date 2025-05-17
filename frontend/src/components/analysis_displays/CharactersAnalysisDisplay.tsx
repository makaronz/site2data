import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Chip,
  Card,
  CardContent,
  CardHeader,
  Avatar,
  AvatarGroup,
  TextField,
  InputAdornment,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemAvatar,
  Divider,
  Tabs,
  Tab
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import PersonIcon from '@mui/icons-material/Person';
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
      id={`characters-tabpanel-${index}`}
      aria-labelledby={`characters-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

interface CharactersAnalysisDisplayProps {
  analysisResult: AnalysisResult;
  onCharacterClick?: (characterId: string) => void;
}

const CharactersAnalysisDisplay: React.FC<CharactersAnalysisDisplayProps> = ({ 
  analysisResult, 
  onCharacterClick 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [tabValue, setTabValue] = useState(0);

  // Pobierz listę postaci z danych analizy
  const characters = analysisResult.roles?.roles || [];

  // Filtruj postaci według wyszukiwania
  const filteredCharacters = characters.filter(character => {
    const query = searchQuery.toLowerCase();
    return (
      query === '' || 
      character.character.toLowerCase().includes(query) || 
      character.role.toLowerCase().includes(query)
    );
  });

  // Pomocnicza funkcja do grupowania postaci wg ról
  const getCharactersByRoleType = () => {
    const roleGroups: Record<string, typeof characters> = {
      'Główne': [],
      'Poboczne': [],
      'Epizodyczne': [],
      'Inne': []
    };

    characters.forEach(character => {
      const role = character.role.toLowerCase();
      if (role.includes('główn') || role.includes('główna') || role === 'main' || role === 'lead') {
        roleGroups['Główne'].push(character);
      } else if (role.includes('poboczn') || role.includes('secondary') || role.includes('supporting')) {
        roleGroups['Poboczne'].push(character);
      } else if (role.includes('epizod') || role.includes('episodic') || role.includes('minor')) {
        roleGroups['Epizodyczne'].push(character);
      } else {
        roleGroups['Inne'].push(character);
      }
    });

    return roleGroups;
  };

  const charactersByRole = getCharactersByRoleType();

  // Pomocnicza funkcja do znajdowania postaci z największą liczbą scen
  const getCharactersWithMostScenes = () => {
    const characterScenes: Record<string, number> = {};
    
    // W prawdziwej implementacji to powinno pochodzić z danych postaci
    // Tutaj tworzymy przykładowe dane dla demonstracji
    characters.forEach(character => {
      characterScenes[character.character] = Math.floor(Math.random() * 15) + 1;
    });
    
    return Object.entries(characterScenes)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5); // Zwracamy top 5
  };

  const charactersWithMostScenes = getCharactersWithMostScenes();

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleCharacterClick = (characterId: string) => {
    if (onCharacterClick) {
      onCharacterClick(characterId);
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Analiza postaci ({characters.length})
      </Typography>
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="tabs analiza postaci">
          <Tab label="Przegląd" />
          <Tab label="Lista postaci" />
          <Tab label="Statystyki" />
        </Tabs>
      </Box>
      
      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={3}>
          {/* Podsumowanie ilościowe */}
          <Grid item xs={12} md={4}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardHeader title="Podsumowanie" />
              <CardContent>
                <List>
                  <ListItem>
                    <ListItemText 
                      primary="Liczba postaci"
                      secondary={characters.length}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Postaci główne"
                      secondary={charactersByRole['Główne'].length}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Postaci poboczne"
                      secondary={charactersByRole['Poboczne'].length}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Postaci epizodyczne"
                      secondary={charactersByRole['Epizodyczne'].length}
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>
          
          {/* Postaci z największą liczbą scen */}
          <Grid item xs={12} md={8}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardHeader title="Postaci z największą liczbą scen" />
              <CardContent>
                <List>
                  {charactersWithMostScenes.map(([character, sceneCount], index) => (
                    <ListItem 
                      key={index}
                      button
                      onClick={() => handleCharacterClick(character)}
                      sx={{ 
                        '&:hover': { backgroundColor: 'action.hover' }
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: index === 0 ? 'primary.main' : index === 1 ? 'secondary.main' : 'grey.500' }}>
                          <PersonIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText 
                        primary={character} 
                        secondary={`${sceneCount} scen`}
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
          
          {/* Grupy postaci */}
          <Grid item xs={12}>
            <Card variant="outlined">
              <CardHeader title="Grupy postaci" />
              <CardContent>
                <Grid container spacing={2}>
                  {Object.entries(charactersByRole).map(([roleType, chars]) => (
                    chars.length > 0 && (
                      <Grid item xs={12} md={6} lg={3} key={roleType}>
                        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                          {roleType} ({chars.length})
                        </Typography>
                        <AvatarGroup max={5} sx={{ mb: 2 }}>
                          {chars.map((char, index) => (
                            <Avatar 
                              key={index} 
                              alt={char.character}
                              sx={{ cursor: 'pointer' }}
                              onClick={() => handleCharacterClick(char.character)}
                            >
                              {char.character.charAt(0)}
                            </Avatar>
                          ))}
                        </AvatarGroup>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {chars.map((char, index) => (
                            <Chip
                              key={index}
                              label={char.character}
                              size="small"
                              onClick={() => handleCharacterClick(char.character)}
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
          placeholder="Szukaj postaci..."
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
        
        {/* Lista postaci */}
        <List>
          {filteredCharacters.length > 0 ? (
            filteredCharacters.map((character, index) => (
              <React.Fragment key={index}>
                {index > 0 && <Divider />}
                <ListItem 
                  button
                  onClick={() => handleCharacterClick(character.character)}
                  sx={{ py: 2 }}
                >
                  <ListItemAvatar>
                    <Avatar>
                      <PersonIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText 
                    primary={character.character} 
                    secondary={`Rola: ${character.role}`}
                  />
                  <Chip 
                    label={
                      character.role.toLowerCase().includes('główn') ? 'Główna' :
                      character.role.toLowerCase().includes('poboczn') ? 'Poboczna' :
                      character.role.toLowerCase().includes('epizod') ? 'Epizodyczna' : 
                      'Inna'
                    }
                    size="small"
                    color={
                      character.role.toLowerCase().includes('główn') ? 'primary' :
                      character.role.toLowerCase().includes('poboczn') ? 'secondary' :
                      'default'
                    }
                  />
                </ListItem>
              </React.Fragment>
            ))
          ) : (
            <Typography color="text.secondary" align="center" sx={{ py: 3 }}>
              Nie znaleziono pasujących postaci
            </Typography>
          )}
        </List>
      </TabPanel>
      
      <TabPanel value={tabValue} index={2}>
        <Typography variant="h6" gutterBottom>
          Statystyki postaci
        </Typography>
        <Typography color="text.secondary">
          Dodatkowe statystyki i relacje między postaciami będą dostępne w przyszłych wersjach aplikacji.
        </Typography>
      </TabPanel>
    </Paper>
  );
};

export default CharactersAnalysisDisplay; 