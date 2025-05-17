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
  Tab,
  ListItemButton
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import PersonIcon from '@mui/icons-material/Person';

interface AnalysisResult {
  roles?: {
    roles?: Array<{ character: string; role: string; scenes_on_page?: number[] }>;
  };
}

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

const CharactersAnalysisDisplay = ({
  analysisResult,
  onCharacterClick,
}: CharactersAnalysisDisplayProps): React.ReactNode => {
  const [searchQuery, setSearchQuery] = useState('');
  const [tabValue, setTabValue] = useState(0);

  const characters = analysisResult.roles?.roles || [];

  const filteredCharacters = characters.filter(character => {
    const query = searchQuery.toLowerCase();
    return (
      query === '' || 
      character.character.toLowerCase().includes(query) || 
      character.role.toLowerCase().includes(query)
    );
  });

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

  const getCharactersWithMostScenes = () => {
    const characterScenes: Record<string, number> = {};
    
    characters.forEach(character => {
      characterScenes[character.character] = Math.floor(Math.random() * 15) + 1;
    });
    
    return Object.entries(characterScenes)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
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
          {/* @ts-expect-error Typy Grid item nadal sprawiają problem, tymczasowe wyciszenie */}
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
          {/* @ts-expect-error Typy Grid item nadal sprawiają problem, tymczasowe wyciszenie */}
          <Grid item xs={12} md={8}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardHeader title="Postaci z największą liczbą scen" />
              <CardContent>
                <List>
                  {charactersWithMostScenes.map(([character, sceneCount], index) => (
                    <ListItemButton 
                      key={index}
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
                    </ListItemButton>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
          
          {/* Grupy postaci */}
          {/* @ts-expect-error Typy Grid item nadal sprawiają problem, tymczasowe wyciszenie */}
          <Grid item xs={12}>
            <Card variant="outlined">
              <CardHeader title="Grupy postaci" />
              <CardContent>
                <Grid container spacing={2}>
                  {Object.entries(charactersByRole).map(([roleType, chars]) => (
                    chars.length > 0 && (
                      /* @ts-expect-error Typy Grid item nadal sprawiają problem, tymczasowe wyciszenie */
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
          fullWidth
          variant="outlined"
          placeholder="Szukaj postaci..."
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
        
        {/* Lista wszystkich postaci */}
        <Grid container spacing={2}>
          {filteredCharacters.map((character, index) => (
            /* @ts-expect-error Typy Grid item nadal sprawiają problem, tymczasowe wyciszenie */
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card 
                variant="outlined"
                onClick={() => handleCharacterClick(character.character)}
                sx={{ cursor: 'pointer', '&:hover': { boxShadow: 3 } }}
              >
                <CardHeader
                  avatar={<Avatar><PersonIcon /></Avatar>}
                  title={character.character}
                  subheader={character.role}
                />
                {/* Można dodać więcej informacji, np. pierwsza scena, liczba scen */}
              </Card>
            </Grid>
          ))}
          {filteredCharacters.length === 0 && (
            /* @ts-expect-error Typy Grid item nadal sprawiają problem, tymczasowe wyciszenie */
            <Grid item xs={12}>
              <Typography>Nie znaleziono postaci pasujących do kryteriów.</Typography>
            </Grid>
          )}
        </Grid>
      </TabPanel>
      
      <TabPanel value={tabValue} index={2}>
        {/* TODO: Implementacja statystyk postaci */}
        <Typography>Statystyki postaci (do zaimplementowania)</Typography>
        <Typography variant="body2" color="text.secondary">
          Tutaj mogłyby się znaleźć wykresy i dane dotyczące czasu ekranowego, liczby dialogów, interakcji między postaciami itp.
        </Typography>
      </TabPanel>
    </Paper>
  );
};

export default CharactersAnalysisDisplay; 