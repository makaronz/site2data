import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  Paper, 
  Stepper, 
  Step, 
  StepLabel, 
  Button, 
  CircularProgress,
  Alert,
  useTheme,
  Divider
} from '@mui/material';
import ApiKeyInput from '../components/ApiKeyInput';
import ScriptUploadForm from '../components/ScriptUploadForm';
import { useNavigate } from 'react-router-dom';

// Pixelpasta-inspired header graphic component
const PixelpastaHeader: React.FC = () => {
  const theme = useTheme();
  
  return (
    <Box 
      sx={{
        width: '100%',
        height: '120px',
        background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 50%, ${theme.palette.secondary.main} 100%)`,
        borderRadius: '8px',
        mb: 4,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
      }}
    >
      {/* Pixelated elements */}
      {[...Array(20)].map((_, i) => (
        <Box
          key={i}
          sx={{
            position: 'absolute',
            width: Math.random() * 30 + 10,
            height: Math.random() * 30 + 10,
            backgroundColor: i % 2 === 0 ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
            transform: `rotate(${Math.random() * 45}deg)`,
            top: Math.random() * 120,
            left: Math.random() * 100 + '%',
            borderRadius: '2px',
          }}
        />
      ))}
      
      <Typography 
        variant="h3" 
        component="h1" 
        sx={{ 
          color: '#fff', 
          fontWeight: 800,
          textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
          zIndex: 2,
          letterSpacing: '1px'
        }}
      >
        ai_CineHub
      </Typography>
    </Box>
  );
};

const steps = ['Enter OpenAI API Key', 'Upload Screenplay', 'Analysis'];

const LandingPage: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [apiKey, setApiKey] = useState('');
  const [isValidatingKey, setIsValidatingKey] = useState(false);
  const [keyValidationError, setKeyValidationError] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const navigate = useNavigate();
  const theme = useTheme();

  // Check if API key is already stored in localStorage
  useEffect(() => {
    const storedApiKey = localStorage.getItem('openai_api_key');
    if (storedApiKey) {
      setApiKey(storedApiKey);
      // Optionally auto-validate stored key
      // validateApiKey(storedApiKey);
    }
  }, []);

  const validateApiKey = async (key: string) => {
    setIsValidatingKey(true);
    setKeyValidationError(null);
    
    try {
      // Call API to validate OpenAI key
      const response = await fetch('/api/validate-openai-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ apiKey: key }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.valid) {
        // Store valid key in localStorage
        localStorage.setItem('openai_api_key', key);
        // Move to next step
        setActiveStep(1);
      } else {
        setKeyValidationError(data.message || 'Invalid API key. Please check and try again.');
      }
    } catch (error) {
      setKeyValidationError('Network error. Please try again later.');
      console.error('API key validation error:', error);
    } finally {
      setIsValidatingKey(false);
    }
  };

  const handleApiKeySave = (key: string) => {
    setApiKey(key);
    validateApiKey(key);
  };

  const handleJobCreated = (newJobId: string, fileName: string) => {
    setJobId(newJobId);
    setActiveStep(2);
    
    // After a short delay, redirect to analysis page
    setTimeout(() => {
      navigate(`/analysis/${newJobId}`);
    }, 3000);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <PixelpastaHeader />
      
      <Paper 
        elevation={3} 
        sx={{ 
          p: 4, 
          borderRadius: '12px',
          backgroundColor: theme.palette.background.paper,
          border: '1px solid',
          borderColor: theme.palette.divider
        }}
      >
        <Typography 
          variant="h4" 
          component="h2" 
          align="center" 
          gutterBottom
          sx={{ 
            color: theme.palette.text.primary,
            fontWeight: 700,
            mb: 3
          }}
        >
          Screenplay Analysis
        </Typography>
        
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        
        <Divider sx={{ mb: 4 }} />
        
        {activeStep === 0 && (
          <Box>
            <Typography variant="h6" gutterBottom sx={{ color: theme.palette.text.primary }}>
              Enter your OpenAI API Key
            </Typography>
            <Typography 
              variant="body1" 
              paragraph
              sx={{ 
                color: theme.palette.text.secondary,
                mb: 3
              }}
            >
              Your API key is required to analyze screenplays. The key is stored locally and never sent to our servers.
            </Typography>
            
            <ApiKeyInput 
              label="OpenAI API Key" 
              onSave={handleApiKeySave} 
              initialValue={apiKey} 
            />
            
            {isValidatingKey && (
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                <CircularProgress size={20} sx={{ mr: 1 }} />
                <Typography variant="body2">Validating API key...</Typography>
              </Box>
            )}
            
            {keyValidationError && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {keyValidationError}
              </Alert>
            )}
            
            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                color="primary"
                onClick={() => validateApiKey(apiKey)}
                disabled={!apiKey || isValidatingKey}
              >
                {isValidatingKey ? 'Validating...' : 'Continue'}
              </Button>
            </Box>
          </Box>
        )}
        
        {activeStep === 1 && (
          <Box>
            <Typography variant="h6" gutterBottom sx={{ color: theme.palette.text.primary }}>
              Upload Your Screenplay
            </Typography>
            <Typography 
              variant="body1" 
              paragraph
              sx={{ 
                color: theme.palette.text.secondary,
                mb: 3
              }}
            >
              Upload your screenplay in PDF format to begin the analysis process.
            </Typography>
            
            <ScriptUploadForm onJobCreated={handleJobCreated} />
            
            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between' }}>
              <Button onClick={handleBack}>
                Back
              </Button>
            </Box>
          </Box>
        )}
        
        {activeStep === 2 && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <CircularProgress size={60} sx={{ mb: 3 }} />
            <Typography variant="h6" gutterBottom>
              Analysis in Progress
            </Typography>
            <Typography variant="body1" paragraph>
              Your screenplay is being analyzed. You will be redirected to the results page shortly.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Job ID: {jobId}
            </Typography>
          </Box>
        )}
      </Paper>
      
      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          ai_CineHub - Screenplay Analysis Tool
        </Typography>
      </Box>
    </Container>
  );
};

export default LandingPage;
