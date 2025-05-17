import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, Typography, Paper
} from '@mui/material';
import FileUpload from '../FileUpload';

const UploadPage: React.FC = () => {
  const navigate = useNavigate();

  const handleUploadComplete = (jobId: string) => {
    console.log('Upload completed, navigating to job status page for job ID:', jobId);
    navigate(`/job/${jobId}`);
  };

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Upload Scenariusza
      </Typography>
      
      <Typography variant="body1" paragraph>
        Załaduj plik PDF ze scenariuszem, aby rozpocząć analizę. Po przesłaniu, 
        system automatycznie przeanalizuje tekst i przygotuje raport.
      </Typography>
      
      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" component="h2" gutterBottom>
          Przesyłanie Pliku
        </Typography>
        <FileUpload onUploadComplete={handleUploadComplete} />
      </Paper>
    </Box>
  );
};

export default UploadPage; 