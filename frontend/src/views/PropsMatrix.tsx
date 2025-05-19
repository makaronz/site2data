import React from 'react';
import { Box, Typography, Paper, useTheme, Grid, Checkbox, FormControlLabel } from '@mui/material';
import useGlobalStore from '../store/globalStore';

/**
 * Props & Equipment Matrix View
 * 
 * Role: Designer / Operator
 * 
 * Features:
 * - Matrix: Scenes (rows) × Props/Vehicles (columns)
 * - Icons for item types
 * - Interactive checkboxes for allocation
 * - Grouping by location or prop category
 */
const PropsMatrix: React.FC = () => {
  const theme = useTheme();
  const { highContrast } = useGlobalStore();
  
  // Mock data for scenes and props (will be replaced with API data)
  const mockScenes = [
    { id: 1, number: 1, location: 'INT. APARTMENT - DAY' },
    { id: 2, number: 2, location: 'EXT. STREET - NIGHT' },
    { id: 3, number: 3, location: 'INT. OFFICE - DAY' },
    { id: 4, number: 4, location: 'EXT. PARK - DAY' },
    { id: 5, number: 5, location: 'INT. RESTAURANT - NIGHT' },
  ];
  
  const mockProps = [
    { id: 1, name: 'Car', type: 'vehicle', icon: '🚗', scenes: [2] },
    { id: 2, name: 'Gun', type: 'weapon', icon: '🔫', scenes: [2, 6] },
    { id: 3, name: 'Laptop', type: 'electronics', icon: '💻', scenes: [1, 3] },
    { id: 4, name: 'Coffee Cup', type: 'prop', icon: '☕', scenes: [1, 3, 5] },
    { id: 5, name: 'Briefcase', type: 'prop', icon: '💼', scenes: [3] },
    { id: 6, name: 'Picnic Basket', type: 'prop', icon: '🧺', scenes: [4] },
    { id: 7, name: 'Wine Bottle', type: 'prop', icon: '🍾', scenes: [5] },
    { id: 8, name: 'Phone', type: 'electronics', icon: '📱', scenes: [1, 2, 3, 4, 5] },
  ];
  
  // State for checked items
  const [checkedItems, setCheckedItems] = React.useState<Record<string, boolean>>({});
  
  // Handle checkbox change
  const handleCheckboxChange = (sceneId: number, propId: number) => {
    const key = `${sceneId}-${propId}`;
    setCheckedItems(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };
  
  // Check if a prop is used in a scene
  const isPropInScene = (sceneId: number, propId: number) => {
    const prop = mockProps.find(p => p.id === propId);
    return prop?.scenes.includes(sceneId) || false;
  };
  
  // Check if a prop is checked
  const isPropChecked = (sceneId: number, propId: number) => {
    const key = `${sceneId}-${propId}`;
    return checkedItems[key] || false;
  };
  
  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Props & Equipment Matrix
      </Typography>
      
      <Typography variant="body1" paragraph>
        Manage and track props and equipment allocation across all scenes.
      </Typography>
      
      {/* Matrix */}
      <Paper 
        elevation={2}
        sx={{ 
          p: 2,
          overflowX: 'auto',
          backgroundColor: highContrast 
            ? theme.palette.mode === 'dark' ? '#121212' : '#ffffff'
            : theme.palette.background.paper,
        }}
      >
        <Box sx={{ minWidth: 800 }}>
          {/* Header Row */}
          <Grid container spacing={1} sx={{ mb: 2, borderBottom: `1px solid ${theme.palette.divider}`, pb: 1 }}>
            <Grid item xs={3}>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                Scene
              </Typography>
            </Grid>
            {mockProps.map(prop => (
              <Grid item xs={1} key={prop.id} sx={{ textAlign: 'center' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                  <span role="img" aria-label={prop.type} style={{ fontSize: '1.2rem' }}>
                    {prop.icon}
                  </span>
                </Typography>
                <Typography variant="caption" sx={{ display: 'block', fontSize: '0.7rem' }}>
                  {prop.name}
                </Typography>
              </Grid>
            ))}
          </Grid>
          
          {/* Scene Rows */}
          {mockScenes.map(scene => (
            <Grid 
              container 
              spacing={1} 
              key={scene.id} 
              sx={{ 
                mb: 1, 
                py: 1,
                '&:nth-of-type(even)': {
                  backgroundColor: theme.palette.mode === 'dark' 
                    ? 'rgba(255, 255, 255, 0.05)' 
                    : 'rgba(0, 0, 0, 0.02)',
                }
              }}
            >
              <Grid item xs={3}>
                <Typography variant="body2">
                  Scene {scene.number}: {scene.location}
                </Typography>
              </Grid>
              {mockProps.map(prop => (
                <Grid item xs={1} key={prop.id} sx={{ textAlign: 'center' }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        size="small"
                        checked={isPropChecked(scene.id, prop.id)}
                        onChange={() => handleCheckboxChange(scene.id, prop.id)}
                        disabled={!isPropInScene(scene.id, prop.id)}
                      />
                    }
                    label=""
                    sx={{ 
                      m: 0,
                      '& .MuiCheckbox-root': {
                        p: 0.5,
                      }
                    }}
                  />
                </Grid>
              ))}
            </Grid>
          ))}
        </Box>
      </Paper>
      
      {/* Summary */}
      <Paper 
        elevation={2}
        sx={{ 
          p: 2,
          mt: 3,
          backgroundColor: highContrast 
            ? theme.palette.mode === 'dark' ? '#121212' : '#ffffff'
            : theme.palette.background.paper,
        }}
      >
        <Typography variant="h6" gutterBottom>
          Props Summary
        </Typography>
        
        <Grid container spacing={2}>
          {mockProps.map(prop => (
            <Grid item xs={6} md={3} key={prop.id}>
              <Paper 
                elevation={1}
                sx={{ 
                  p: 2,
                  backgroundColor: highContrast 
                    ? theme.palette.mode === 'dark' ? '#1e1e1e' : '#f5f5f5'
                    : theme.palette.background.paper,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <span role="img" aria-label={prop.type} style={{ fontSize: '1.5rem', marginRight: '8px' }}>
                    {prop.icon}
                  </span>
                  <Typography variant="subtitle1">
                    {prop.name}
                  </Typography>
                </Box>
                <Typography variant="body2">
                  Type: {prop.type}
                </Typography>
                <Typography variant="body2">
                  Used in: {prop.scenes.length} scenes
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Paper>
    </Box>
  );
};

export default PropsMatrix;
