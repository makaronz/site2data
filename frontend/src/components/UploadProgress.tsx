import React from 'react';
import { LinearProgress, Typography, Box } from '@mui/material';

interface UploadProgressProps {
  progress: number;
  status: string;
}

const UploadProgress: React.FC<UploadProgressProps> = ({ progress, status }) => {
  return (
    <Box sx={{ width: '100%', mb: 1 }}>
      <LinearProgress
        variant="determinate"
        value={progress}
        sx={{ height: 8, borderRadius: 2 }}
        aria-label="Postęp przesyłania"
      />
      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
        {status}
      </Typography>
    </Box>
  );
};

export default UploadProgress; 