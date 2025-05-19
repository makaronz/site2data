import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import AppRouter from './routes/AppRouter';
import { CssBaseline } from '@mui/material';

/**
 * Main application entry point
 */
const App: React.FC = () => {
  return (
    <BrowserRouter>
      <CssBaseline />
      <AppRouter />
    </BrowserRouter>
  );
};

export default App;
