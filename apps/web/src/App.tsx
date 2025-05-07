import React from 'react';
import {
  CssBaseline,
  ThemeProvider,
  Container,
  AppBar,
  Toolbar,
  Typography,
  Box,
} from '@mui/material';
import FileUpload from './components/FileUpload'; // Create this component
import theme from './theme'; // Import the theme

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