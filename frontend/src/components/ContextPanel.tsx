import React from 'react';
import { Box, Paper, useTheme } from '@mui/material';
import useGlobalStore from '../store/globalStore';

/**
 * Context Panel component
 * 
 * Displays context-sensitive information based on the currently selected item
 * (scene, character, location, etc.)
 */
const ContextPanel: React.FC = () => {
  const theme = useTheme();
  const { 
    selectedScene, 
    selectedCharacter, 
    selectedLocation,
    highContrast 
  } = useGlobalStore();
  
  // Determine what content to show based on what's selected
  const renderContent = () => {
    if (selectedScene) {
      return renderSceneDetails(selectedScene);
    } else if (selectedCharacter) {
      return renderCharacterDetails(selectedCharacter);
    } else if (selectedLocation) {
      return renderLocationDetails(selectedLocation);
    } else {
      return renderEmptyState();
    }
  };
  
  // Render scene details
  const renderSceneDetails = (scene: any) => (
    <Box>
      <h3>Scene Details</h3>
      <p>Select a scene to view details</p>
      {/* This will be populated with actual scene data when available */}
    </Box>
  );
  
  // Render character details
  const renderCharacterDetails = (character: any) => (
    <Box>
      <h3>Character Details</h3>
      <p>Select a character to view details</p>
      {/* This will be populated with actual character data when available */}
    </Box>
  );
  
  // Render location details
  const renderLocationDetails = (location: any) => (
    <Box>
      <h3>Location Details</h3>
      <p>Select a location to view details</p>
      {/* This will be populated with actual location data when available */}
    </Box>
  );
  
  // Render empty state
  const renderEmptyState = () => (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center',
      height: '100%',
      p: 3,
      color: theme.palette.text.secondary
    }}>
      <p>Select a scene, character, or location to view details</p>
    </Box>
  );
  
  return (
    <Paper
      elevation={0}
      sx={{
        width: 300,
        height: '100%',
        borderLeft: `1px solid ${theme.palette.divider}`,
        backgroundColor: highContrast 
          ? theme.palette.mode === 'dark' ? '#121212' : '#ffffff'
          : theme.palette.background.paper,
        color: highContrast 
          ? theme.palette.mode === 'dark' ? '#ffffff' : '#000000'
          : theme.palette.text.primary,
        overflow: 'auto'
      }}
    >
      <Box sx={{ p: 2 }}>
        {renderContent()}
      </Box>
    </Paper>
  );
};

export default ContextPanel;
