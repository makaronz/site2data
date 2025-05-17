import React from 'react';
import { useParams } from 'react-router-dom';
import JobStatusDisplay from '../components/JobStatusDisplay';
import { Typography, Paper } from '@mui/material';

const JobStatusPage: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>();

  if (!jobId) {
    return (
      <Paper elevation={3} sx={{ p: 3, mt: 2, backgroundColor: 'warning.light' }}>
        <Typography variant="h6" color="error">Brak ID zadania.</Typography>
        <Typography>Nie można wyświetlić statusu zadania bez jego identyfikatora.</Typography>
      </Paper>
    );
  }

  return (
    <Paper elevation={3} sx={{ p: 3, mt: 2 }}>
      <Typography variant="h5" component="h1" gutterBottom>
        Status Zadania
      </Typography>
      <JobStatusDisplay jobId={jobId} />
    </Paper>
  );
};

export default JobStatusPage; 