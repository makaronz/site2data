import React from 'react';
import { Alert, AlertTitle, Button, Box, Typography } from '@mui/material';
import ErrorIcon from '@mui/icons-material/Error';
import RefreshIcon from '@mui/icons-material/Refresh';

interface ErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
  componentStack?: string;
}

/**
 * A reusable error fallback component to display when an error boundary catches an error
 */
const ErrorFallback: React.FC<ErrorFallbackProps> = ({ 
  error, 
  resetErrorBoundary,
  componentStack 
}) => {
  return (
    <Box 
      sx={{ 
        p: 3, 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center',
        bgcolor: 'background.paper',
        borderRadius: 2,
        boxShadow: 3
      }}
    >
      <Alert 
        severity="error" 
        icon={<ErrorIcon fontSize="large" />}
        sx={{ width: '100%', mb: 2 }}
      >
        <AlertTitle>Component Error</AlertTitle>
        Something went wrong in this component.
      </Alert>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
        {error.message || 'An unexpected error occurred'}
      </Typography>
      
      {componentStack && (
        <Box 
          sx={{ 
            width: '100%', 
            mb: 2, 
            p: 2, 
            bgcolor: 'grey.100', 
            borderRadius: 1,
            overflow: 'auto',
            maxHeight: '200px'
          }}
        >
          <Typography variant="caption" component="pre" sx={{ fontFamily: 'monospace' }}>
            {componentStack}
          </Typography>
        </Box>
      )}
      
      <Button 
        variant="contained" 
        color="primary" 
        onClick={resetErrorBoundary}
        startIcon={<RefreshIcon />}
      >
        Try Again
      </Button>
    </Box>
  );
};

export default ErrorFallback;
