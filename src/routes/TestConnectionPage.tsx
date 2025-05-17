import React from 'react';
import { Container, Typography, Paper } from '@mui/material';
import TestConnection from '../components/TestConnection'; // Zakładamy, że komponent zostanie tam przeniesiony

const TestConnectionPage: React.FC = () => {
  return (
    <Container maxWidth="md">
      <Paper sx={{ my: 4, p: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Test Połączenia z API
        </Typography>
        <TestConnection />
      </Paper>
    </Container>
  );
};

export default TestConnectionPage; 