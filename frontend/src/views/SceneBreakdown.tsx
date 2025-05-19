import React from 'react';
import { Box, Typography, Paper, Grid, useTheme } from '@mui/material';
import useGlobalStore from '../store/globalStore';

/**
 * Scene Breakdown View
 * 
 * Role: Director / 1st AD
 * 
 * Features:
 * - Grid view of all scenes
 * - Mood line graph for emotional progression
 * - Filters for location, mood, risk score
 */
const SceneBreakdown: React.FC = () => {
  const theme = useTheme();
  const { highContrast, setSelectedScene } = useGlobalStore();
  
  // Mock data for scenes (will be replaced with API data)
  const mockScenes = [
    { id: 1, number: 1, location: 'INT. APARTMENT - DAY', characters: ['JOHN', 'MARY'], mood: 'tense', risk: 'low' },
    { id: 2, number: 2, location: 'EXT. STREET - NIGHT', characters: ['JOHN'], mood: 'mysterious', risk: 'medium' },
    { id: 3, number: 3, location: 'INT. OFFICE - DAY', characters: ['MARY', 'BOSS'], mood: 'professional', risk: 'low' },
    { id: 4, number: 4, location: 'EXT. PARK - DAY', characters: ['JOHN', 'MARY'], mood: 'romantic', risk: 'low' },
    { id: 5, number: 5, location: 'INT. RESTAURANT - NIGHT', characters: ['JOHN', 'MARY', 'WAITER'], mood: 'tense', risk: 'low' },
  ];
  
  // Get mood emoji
  const getMoodEmoji = (mood: string) => {
    switch (mood) {
      case 'tense': return '😰';
      case 'mysterious': return '🤔';
      case 'professional': return '🧐';
      case 'romantic': return '❤️';
      default: return '😐';
    }
  };
  
  // Get risk indicator
  const getRiskIndicator = (risk: string) => {
    switch (risk) {
      case 'high': return '🔴';
      case 'medium': return '🟠';
      case 'low': return '🟢';
      default: return '⚪';
    }
  };
  
  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Scene Breakdown
      </Typography>
      
      <Typography variant="body1" paragraph>
        View and analyze all scenes in the script. Click on a scene to see detailed information.
      </Typography>
      
      {/* Scene Grid */}
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
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={1}>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>Scene</Typography>
          </Grid>
          <Grid item xs={4}>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>Location</Typography>
          </Grid>
          <Grid item xs={3}>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>Characters</Typography>
          </Grid>
          <Grid item xs={2}>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>Mood</Typography>
          </Grid>
          <Grid item xs={2}>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>Risk</Typography>
          </Grid>
        </Grid>
        
        {mockScenes.map((scene) => (
          <Paper 
            key={scene.id}
            elevation={1}
            sx={{ 
              p: 2, 
              mb: 2, 
              cursor: 'pointer',
              '&:hover': {
                backgroundColor: theme.palette.action.hover,
              },
              backgroundColor: highContrast 
                ? theme.palette.mode === 'dark' ? '#1e1e1e' : '#f5f5f5'
                : theme.palette.background.paper,
            }}
            onClick={() => setSelectedScene(scene)}
          >
            <Grid container spacing={2}>
              <Grid item xs={1}>
                <Typography>{scene.number}</Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography>{scene.location}</Typography>
              </Grid>
              <Grid item xs={3}>
                <Typography>{scene.characters.join(', ')}</Typography>
              </Grid>
              <Grid item xs={2}>
                <Typography>
                  {getMoodEmoji(scene.mood)} {scene.mood}
                </Typography>
              </Grid>
              <Grid item xs={2}>
                <Typography>
                  {getRiskIndicator(scene.risk)} {scene.risk}
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        ))}
      </Paper>
      
      {/* Placeholder for Mood Line Graph */}
      <Paper 
        elevation={2}
        sx={{ 
          p: 2, 
          height: 300, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          backgroundColor: highContrast 
            ? theme.palette.mode === 'dark' ? '#121212' : '#ffffff'
            : theme.palette.background.paper,
        }}
      >
        <Typography variant="body1">
          Mood Line Graph will be implemented here using Recharts
        </Typography>
      </Paper>
    </Box>
  );
};

export default SceneBreakdown;
