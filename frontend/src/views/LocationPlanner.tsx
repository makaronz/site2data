import React from 'react';
import { Box, Typography, Paper, List, ListItem, ListItemText, Chip, useTheme, Grid } from '@mui/material';
import useGlobalStore from '../store/globalStore';

/**
 * Location Planner View
 * 
 * Role: Production Manager / Designer
 * 
 * Features:
 * - List view of all locations
 * - Metadata per location (Interior/Exterior, Day/Night, Permit requirements)
 * - Attached props, SFX requirements, equipment per location
 */
const LocationPlanner: React.FC = () => {
  const theme = useTheme();
  const { highContrast, setSelectedLocation } = useGlobalStore();
  
  // Mock data for locations (will be replaced with API data)
  const mockLocations = [
    { 
      id: 1, 
      name: 'APARTMENT', 
      isInterior: true, 
      timeOfDay: ['day', 'night'], 
      requiresPermit: false,
      props: ['Couch', 'TV', 'Coffee Table'],
      sfx: [],
      equipment: ['Standard Lighting Kit'],
      scenes: [1, 5, 8]
    },
    { 
      id: 2, 
      name: 'STREET', 
      isInterior: false, 
      timeOfDay: ['night'], 
      requiresPermit: true,
      props: ['Car'],
      sfx: [],
      equipment: ['Night Shooting Kit', 'Traffic Control'],
      scenes: [2, 9]
    },
    { 
      id: 3, 
      name: 'OFFICE', 
      isInterior: true, 
      timeOfDay: ['day'], 
      requiresPermit: false,
      props: ['Desk', 'Computer', 'Office Chair'],
      sfx: [],
      equipment: ['Standard Lighting Kit'],
      scenes: [3]
    },
    { 
      id: 4, 
      name: 'PARK', 
      isInterior: false, 
      timeOfDay: ['day'], 
      requiresPermit: true,
      props: ['Bench', 'Picnic Basket'],
      sfx: ['Birds Chirping'],
      equipment: ['Outdoor Lighting Kit'],
      scenes: [4]
    },
    { 
      id: 5, 
      name: 'RESTAURANT', 
      isInterior: true, 
      timeOfDay: ['night'], 
      requiresPermit: true,
      props: ['Tables', 'Chairs', 'Dinnerware'],
      sfx: ['Background Chatter'],
      equipment: ['Standard Lighting Kit', 'Sound Dampening'],
      scenes: [5, 10]
    },
  ];
  
  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Location Planner
      </Typography>
      
      <Typography variant="body1" paragraph>
        Plan and organize all filming locations with associated requirements.
      </Typography>
      
      {/* Locations List */}
      <Grid container spacing={3}>
        {mockLocations.map((location) => (
          <Grid item xs={12} md={6} lg={4} key={location.id}>
            <Paper 
              elevation={2}
              sx={{ 
                height: '100%',
                cursor: 'pointer',
                '&:hover': {
                  boxShadow: 6,
                },
                backgroundColor: highContrast 
                  ? theme.palette.mode === 'dark' ? '#1e1e1e' : '#f5f5f5'
                  : theme.palette.background.paper,
              }}
              onClick={() => setSelectedLocation(location)}
            >
              <Box sx={{ 
                p: 2, 
                borderBottom: `1px solid ${theme.palette.divider}`,
                backgroundColor: theme.palette.primary.main,
                color: theme.palette.primary.contrastText,
                borderRadius: '4px 4px 0 0'
              }}>
                <Typography variant="h6">
                  {location.isInterior ? 'INT. ' : 'EXT. '}{location.name}
                </Typography>
              </Box>
              
              <Box sx={{ p: 2 }}>
                {/* Location Metadata */}
                <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                  <Chip 
                    label={location.isInterior ? 'Interior' : 'Exterior'} 
                    size="small"
                    color={location.isInterior ? 'primary' : 'secondary'}
                    variant="outlined"
                  />
                  
                  {location.timeOfDay.map((time) => (
                    <Chip 
                      key={time}
                      label={time === 'day' ? 'Day' : 'Night'} 
                      size="small"
                      color={time === 'day' ? 'success' : 'info'}
                      variant="outlined"
                    />
                  ))}
                  
                  <Chip 
                    label={location.requiresPermit ? 'Permit Required' : 'No Permit'} 
                    size="small"
                    color={location.requiresPermit ? 'warning' : 'success'}
                    variant="outlined"
                  />
                </Box>
                
                {/* Scenes */}
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mt: 2 }}>
                  Scenes:
                </Typography>
                <Typography variant="body2">
                  {location.scenes.map(scene => `Scene ${scene}`).join(', ')}
                </Typography>
                
                {/* Props */}
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mt: 2 }}>
                  Props:
                </Typography>
                <Typography variant="body2">
                  {location.props.length > 0 ? location.props.join(', ') : 'None'}
                </Typography>
                
                {/* SFX */}
                {location.sfx.length > 0 && (
                  <>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mt: 2 }}>
                      Special Effects:
                    </Typography>
                    <Typography variant="body2">
                      {location.sfx.join(', ')}
                    </Typography>
                  </>
                )}
                
                {/* Equipment */}
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mt: 2 }}>
                  Equipment:
                </Typography>
                <Typography variant="body2">
                  {location.equipment.join(', ')}
                </Typography>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default LocationPlanner;
