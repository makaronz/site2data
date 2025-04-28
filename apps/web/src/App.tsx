import React from 'react';
import {
  CssBaseline,
  ThemeProvider,
  createTheme,
  Container,
  AppBar,
  Toolbar,
  Typography,
  Box,
} from '@mui/material';
import FileUpload from './components/FileUpload'; // Create this component

// TODO: Move theme to a separate file (e.g., src/theme.ts)
const theme = createTheme({
  palette: {
    // Define your theme colors here (e.g., based on film studio branding)
    primary: {
      main: '#1976d2', // Example primary color
    },
    secondary: {
      main: '#dc004e', // Example secondary color
    },
    // Consider adding dark mode later
  },
});

function App() {
  const handleUploadComplete = (objectKey: string) => {
    console.log('Upload complete! Object key:', objectKey);
    // TODO: Call tRPC mutation notifyUploadComplete
    // TODO: Start SSE connection
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Site2Data - Analiza Scenariuszy
          </Typography>
        </Toolbar>
      </AppBar>
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Box sx={{ my: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Prześlij scenariusz (PDF)
          </Typography>
          {/* Basic FileUpload component placeholder */}
          <FileUpload onUploadComplete={handleUploadComplete} />

          {/* TODO: Add Stepper component for progress */}
          {/* TODO: Add Tabs for results */}
        </Box>
      </Container>
    </ThemeProvider>
  );
}

export default App; 