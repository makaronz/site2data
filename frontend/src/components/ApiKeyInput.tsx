import React, { useState } from 'react';
import { Box, TextField, Button, Snackbar, Alert, Stack } from '@mui/material';

interface ApiKeyInputProps {
  label?: string;
  onSave?: (apiKey: string) => void;
  initialValue?: string;
}

const ApiKeyInput: React.FC<ApiKeyInputProps> = ({ label = 'API Key', onSave, initialValue = '' }) => {
  const [apiKey, setApiKey] = useState<string>(initialValue);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setApiKey(e.target.value);
  };

  const handleSave = () => {
    if (!apiKey.trim()) {
      setSnackbar({ open: true, message: 'API Key nie może być pusty.', severity: 'error' });
      return;
    }
    setSnackbar({ open: true, message: 'API Key zapisany!', severity: 'success' });
    if (onSave) onSave(apiKey.trim());
  };

  const handleSnackbarClose = () => setSnackbar(s => ({ ...s, open: false }));

  return (
    <Box sx={{ width: '100%' }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
        <TextField
          label={label}
          value={apiKey}
          onChange={handleChange}
          variant="outlined"
          size="small"
          fullWidth
          aria-label={label}
          inputProps={{ 'aria-label': label, autoComplete: 'off', tabIndex: 0 }}
        />
        <Button
          variant="contained"
          color="primary"
          onClick={handleSave}
          aria-label="Zapisz API Key"
        >
          Zapisz
        </Button>
      </Stack>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ApiKeyInput; 