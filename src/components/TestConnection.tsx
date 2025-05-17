import React, { useState } from 'react';
import { Box, Button, Typography, Alert } from '@mui/material';
import { trpc } from '../utils/trpc'; // Import rzeczywistego klienta tRPC

const TestConnection: React.FC = () => {
  const [testResult, setTestResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  // const [isLoading, setIsLoading] = useState(false); // isLoading będzie zarządzane przez useMutation

  const presignedUrlMutation = trpc.requestPresignedUrl.useMutation({
    onSuccess: (data) => {
      setTestResult(JSON.stringify(data, null, 2));
      setError(null);
    },
    onError: (err) => {
      console.error('Test connection failed:', err);
      setError(err.message || 'Błąd podczas testowania połączenia');
      setTestResult(null);
    },
  });

  const handleTest = async () => {
    // setIsLoading(true); // Już niepotrzebne
    setError(null);
    setTestResult(null);
    presignedUrlMutation.mutate({ filename: 'test.pdf' });
  };

  return (
    <Box sx={{ my: 4 }}>
      <Typography variant="h6" gutterBottom>
        Test połączenia API (tRPC)
      </Typography>
      <Button 
        variant="contained" 
        onClick={handleTest} 
        disabled={presignedUrlMutation.isLoading} // Użyj isLoading z mutacji
        sx={{ mb: 2 }}
      >
        {presignedUrlMutation.isLoading ? 'Testowanie...' : 'Testuj połączenie'}
      </Button>

      {presignedUrlMutation.data && (
        <Box sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
          <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
            {/* Wyświetlamy dane bezpośrednio z mutacji, które są już stringiem po onSuccess */}
            {testResult} 
          </Typography>
        </Box>
      )}

      {/* Błąd jest zarządzany przez stan `error`, aktualizowany w onError mutacji */}
      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
    </Box>
  );
};

export default TestConnection; 