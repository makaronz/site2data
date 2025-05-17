import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, Typography, Button, Paper,
  Card, CardContent, CardActions, CardMedia
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { 
  CloudUpload as UploadIcon, 
  Analytics as AnalyticsIcon 
} from '@mui/icons-material';

const HomePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Site2Data
      </Typography>
      
      <Typography variant="body1" paragraph sx={{ mb: 4 }}>
        Witaj w aplikacji do analizy scenariuszy. Przesyłaj pliki PDF z tekstem scenariusza
        i otrzymuj szczegółową analizę postaci, scen, dialogów i wielu innych elementów.
      </Typography>
      
      <Grid container spacing={4}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardMedia
              sx={{ height: 140, bgcolor: 'primary.light', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <UploadIcon sx={{ fontSize: 60, color: 'white' }} />
            </CardMedia>
            <CardContent>
              <Typography gutterBottom variant="h5" component="div">
                Prześlij Scenariusz
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Załaduj plik PDF ze scenariuszem, aby rozpocząć analizę. 
                Nasz system automatycznie przetworzy tekst i przygotuje szczegółowy raport.
              </Typography>
            </CardContent>
            <CardActions>
              <Button 
                size="large" 
                startIcon={<UploadIcon />}
                onClick={() => navigate('/upload')}
                fullWidth
                variant="contained"
              >
                Rozpocznij Upload
              </Button>
            </CardActions>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card>
            <CardMedia
              sx={{ height: 140, bgcolor: 'secondary.light', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <AnalyticsIcon sx={{ fontSize: 60, color: 'white' }} />
            </CardMedia>
            <CardContent>
              <Typography gutterBottom variant="h5" component="div">
                Przeglądaj Analizy
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Przeglądaj wyniki poprzednich analiz, porównuj scenariusze 
                i korzystaj z zaawansowanych narzędzi do wizualizacji danych.
              </Typography>
            </CardContent>
            <CardActions>
              <Button 
                size="large" 
                color="secondary"
                startIcon={<AnalyticsIcon />}
                onClick={() => navigate('/analysis/example-job-id')}
                fullWidth
                variant="contained"
              >
                Przeglądaj Analizy
              </Button>
            </CardActions>
          </Card>
        </Grid>
      </Grid>
      
      <Paper elevation={1} sx={{ mt: 4, p: 3, bgcolor: 'background.paper' }}>
        <Typography variant="h6" gutterBottom>
          O Projekcie
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Site2Data to narzędzie do analizy scenariuszy, które wykorzystuje zaawansowane 
          algorytmy przetwarzania języka naturalnego do ekstrakcji danych z plików tekstowych.
          Aplikacja dostarcza szczegółową analizę postaci, scen, dialogów, lokalizacji i wielu innych
          elementów, które są kluczowe dla zrozumienia struktury i dynamiki scenariusza.
        </Typography>
      </Paper>
    </Box>
  );
};

export default HomePage; 