import React from 'react';
import { Box, TextField, Stack } from '@mui/material';

interface ApiKeyInputProps {
  label?: string;
  onApiKeyChange: (apiKey: string) => void;
  value: string;
  disabled?: boolean;
}

const ApiKeyInput: React.FC<ApiKeyInputProps> = ({ 
  label = 'API Key', 
  onApiKeyChange,
  value,
  disabled = false
}) => {

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onApiKeyChange(e.target.value);
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
        <TextField
          label={label}
          value={value}
          onChange={handleChange}
          variant="outlined"
          size="small"
          fullWidth
          disabled={disabled}
          aria-label={label}
          inputProps={{ 'aria-label': label, autoComplete: 'off', tabIndex: 0 }}
        />
      </Stack>
    </Box>
  );
};

export default ApiKeyInput; 