import React from 'react';
import { Box, Typography, Paper, useTheme, Button } from '@mui/material';
import useGlobalStore from '../store/globalStore';

/**
 * Character Map View
 * 
 * Role: Director / Screenwriter
 * 
 * Features:
 * - Force-directed graph using @react-sigma/core
 * - Nodes: characters, sized by centrality
 * - Edges: sentiment-based (color-coded)
 * - Filters and export options
 */
const CharacterMap: React.FC = () => {
  const theme = useTheme();
  const { highContrast, setSelectedCharacter } = useGlobalStore();
  
  // Mock data for characters (will be replaced with API data)
  const mockCharacters = [
    { id: 1, name: 'JOHN', centrality: 0.8, scenes: 12, relationships: ['MARY', 'BOSS'] },
    { id: 2, name: 'MARY', centrality: 0.7, scenes: 10, relationships: ['JOHN', 'BOSS'] },
    { id: 3, name: 'BOSS', centrality: 0.4, scenes: 5, relationships: ['JOHN', 'MARY'] },
    { id: 4, name: 'WAITER', centrality: 0.2, scenes: 2, relationships: ['JOHN', 'MARY'] },
  ];
  
  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Character Map
      </Typography>
      
      <Typography variant="body1" paragraph>
        Visualize character relationships and interactions throughout the script.
      </Typography>
      
      {/* Filter Controls */}
      <Paper 
        elevation={2}
        sx={{ 
          p: 2, 
          mb: 4,
          backgroundColor: highContrast 
            ? theme.palette.mode === 'dark' ? '#121212' : '#ffffff'
            : theme.palette.background.paper,
        }}
      >
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Button variant="outlined" size="small">
            Filter by Character
          </Button>
          <Button variant="outlined" size="small">
            Filter by Scene
          </Button>
          <Button variant="outlined" size="small">
            Filter by Sentiment
          </Button>
          <Box sx={{ flexGrow: 1 }} />
          <Button variant="contained" size="small">
            Export PNG
          </Button>
          <Button variant="contained" size="small">
            Export GEXF
          </Button>
        </Box>
      </Paper>
      
      {/* Character Graph */}
      <Paper 
        elevation={2}
        sx={{ 
          p: 2, 
          height: 500, 
          display: 'flex', 
          flexDirection: 'column',
          backgroundColor: highContrast 
            ? theme.palette.mode === 'dark' ? '#121212' : '#ffffff'
            : theme.palette.background.paper,
        }}
      >
        <Typography variant="body1" sx={{ textAlign: 'center', my: 'auto' }}>
          Character relationship graph will be implemented here using @react-sigma/core
        </Typography>
      </Paper>
      
      {/* Character List */}
      <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>
        Characters
      </Typography>
      
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        {mockCharacters.map((character) => (
          <Paper 
            key={character.id}
            elevation={1}
            sx={{ 
              p: 2, 
              width: 200,
              cursor: 'pointer',
              '&:hover': {
                backgroundColor: theme.palette.action.hover,
              },
              backgroundColor: highContrast 
                ? theme.palette.mode === 'dark' ? '#1e1e1e' : '#f5f5f5'
                : theme.palette.background.paper,
            }}
            onClick={() => setSelectedCharacter(character)}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
              {character.name}
            </Typography>
            <Typography variant="body2">
              Scenes: {character.scenes}
            </Typography>
            <Typography variant="body2">
              Centrality: {character.centrality.toFixed(2)}
            </Typography>
            <Typography variant="body2">
              Relationships: {character.relationships.join(', ')}
            </Typography>
          </Paper>
        ))}
      </Box>
    </Box>
  );
};

export default CharacterMap;
