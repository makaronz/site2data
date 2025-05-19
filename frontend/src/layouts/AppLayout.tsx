import React from 'react';
import { Box, CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import Sidebar from '../components/Sidebar';
import ContextPanel from '../components/ContextPanel';
import useGlobalStore from '../store/globalStore';

/**
 * Main application layout component
 * 
 * Provides the global layout structure with:
 * - Sidebar for navigation
 * - Main content area
 * - Context panel for details
 */
const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { darkMode, highContrast } = useGlobalStore();
  
  // Create theme based on user preferences
  const theme = React.useMemo(() => {
    return createTheme({
      palette: {
        mode: darkMode ? 'dark' : 'light',
        primary: {
          main: '#3f51b5',
        },
        secondary: {
          main: '#f50057',
        },
        background: {
          default: darkMode ? '#121212' : '#f5f5f5',
          paper: darkMode ? '#1e1e1e' : '#ffffff',
        },
        text: {
          primary: highContrast 
            ? darkMode ? '#ffffff' : '#000000'
            : darkMode ? '#e0e0e0' : '#333333',
          secondary: highContrast
            ? darkMode ? '#cccccc' : '#333333'
            : darkMode ? '#a0a0a0' : '#666666',
        },
      },
      typography: {
        fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
        h1: {
          fontWeight: 500,
        },
        h2: {
          fontWeight: 500,
        },
        h3: {
          fontWeight: 500,
        },
      },
      components: {
        MuiButton: {
          styleOverrides: {
            root: {
              textTransform: 'none',
            },
          },
        },
      },
    });
  }, [darkMode, highContrast]);
  
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ 
        display: 'flex', 
        minHeight: '100vh',
        backgroundColor: theme.palette.background.default
      }}>
        {/* Sidebar */}
        <Sidebar />
        
        {/* Main content area */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: 3,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'auto',
          }}
        >
          {children}
        </Box>
        
        {/* Context panel */}
        <ContextPanel />
      </Box>
    </ThemeProvider>
  );
};

export default AppLayout;
