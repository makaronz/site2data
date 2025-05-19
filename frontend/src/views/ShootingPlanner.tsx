import React from 'react';
import { Box, Typography, Paper, useTheme, Grid } from '@mui/material';
import useGlobalStore from '../store/globalStore';

/**
 * Shooting Day Planner View
 * 
 * Role: 1st AD
 * 
 * Features:
 * - Calendar integration with react-big-calendar
 * - Scene cards as events
 * - Export functionality for daily checklists
 */
const ShootingPlanner: React.FC = () => {
  const theme = useTheme();
  const { highContrast, setSelectedScene } = useGlobalStore();
  
  // Mock data for shooting schedule (will be replaced with API data)
  const mockSchedule = [
    { 
      id: 1, 
      date: '2025-06-01', 
      scenes: [
        { id: 1, number: 1, location: 'INT. APARTMENT - DAY', characters: ['JOHN', 'MARY'], startTime: '08:00', endTime: '10:30' },
        { id: 3, number: 3, location: 'INT. OFFICE - DAY', characters: ['MARY', 'BOSS'], startTime: '11:00', endTime: '13:30' },
        { id: 4, number: 4, location: 'EXT. PARK - DAY', characters: ['JOHN', 'MARY'], startTime: '14:30', endTime: '17:00' }
      ]
    },
    { 
      id: 2, 
      date: '2025-06-02', 
      scenes: [
        { id: 2, number: 2, location: 'EXT. STREET - NIGHT', characters: ['JOHN'], startTime: '19:00', endTime: '22:00' },
        { id: 5, number: 5, location: 'INT. RESTAURANT - NIGHT', characters: ['JOHN', 'MARY', 'WAITER'], startTime: '22:30', endTime: '01:00' }
      ]
    }
  ];
  
  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Shooting Day Planner
      </Typography>
      
      <Typography variant="body1" paragraph>
        Plan and organize shooting days with scene scheduling.
      </Typography>
      
      {/* Calendar Placeholder */}
      <Paper 
        elevation={2}
        sx={{ 
          p: 2, 
          height: 500, 
          mb: 4,
          backgroundColor: highContrast 
            ? theme.palette.mode === 'dark' ? '#121212' : '#ffffff'
            : theme.palette.background.paper,
        }}
      >
        <Typography variant="body1" sx={{ textAlign: 'center', my: 'auto' }}>
          Calendar will be implemented here using react-big-calendar
        </Typography>
      </Paper>
      
      {/* Shooting Days */}
      {mockSchedule.map((day) => (
        <Paper 
          key={day.id}
          elevation={2}
          sx={{ 
            p: 2, 
            mb: 3,
            backgroundColor: highContrast 
              ? theme.palette.mode === 'dark' ? '#121212' : '#ffffff'
              : theme.palette.background.paper,
          }}
        >
          <Typography variant="h6" gutterBottom>
            Shooting Day: {new Date(day.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </Typography>
          
          <Grid container spacing={2}>
            {day.scenes.map((scene) => (
              <Grid item xs={12} md={6} lg={4} key={scene.id}>
                <Paper 
                  elevation={1}
                  sx={{ 
                    p: 2, 
                    cursor: 'pointer',
                    '&:hover': {
                      backgroundColor: theme.palette.action.hover,
                    },
                    backgroundColor: highContrast 
                      ? theme.palette.mode === 'dark' ? '#1e1e1e' : '#f5f5f5'
                      : theme.palette.background.paper,
                    borderLeft: `4px solid ${theme.palette.primary.main}`
                  }}
                  onClick={() => setSelectedScene(scene)}
                >
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                    Scene {scene.number}: {scene.location}
                  </Typography>
                  
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Time: {scene.startTime} - {scene.endTime}
                  </Typography>
                  
                  <Typography variant="body2">
                    Cast: {scene.characters.join(', ')}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Paper>
      ))}
    </Box>
  );
};

export default ShootingPlanner;
