import React from 'react';
import { Box, Typography, Paper, Tabs, Tab, Divider } from '@mui/material';
import { useParams } from 'react-router-dom';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`analysis-tabpanel-${index}`}
      aria-labelledby={`analysis-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

const a11yProps = (index: number) => {
  return {
    id: `analysis-tab-${index}`,
    'aria-controls': `analysis-tabpanel-${index}`,
  };
};

const AnalysisPage: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const [tabValue, setTabValue] = React.useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Tutaj będziemy w przyszłości pobierać dane analizy

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Analiza Scenariusza
      </Typography>
      
      {jobId && (
        <Typography variant="caption" display="block" sx={{ mb: 3 }}>
          ID zadania: {jobId}
        </Typography>
      )}
      
      <Paper elevation={3} sx={{ mb: 4 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="analysis tabs"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Podsumowanie" {...a11yProps(0)} />
          <Tab label="Postacie" {...a11yProps(1)} />
          <Tab label="Sceny" {...a11yProps(2)} />
          <Tab label="Dialogi" {...a11yProps(3)} />
          <Tab label="Lokalizacje" {...a11yProps(4)} />
          <Tab label="Rekwizyty" {...a11yProps(5)} />
          <Tab label="Emocje" {...a11yProps(6)} />
          <Tab label="Wątki" {...a11yProps(7)} />
          <Tab label="Wizualizacje" {...a11yProps(8)} />
        </Tabs>
        
        <Divider />
        
        <TabPanel value={tabValue} index={0}>
          <Typography variant="h6" gutterBottom>Podsumowanie Scenariusza</Typography>
          <Typography variant="body1">
            Tutaj będzie wyświetlane podsumowanie analizy scenariusza.
          </Typography>
        </TabPanel>
        
        <TabPanel value={tabValue} index={1}>
          <Typography variant="h6" gutterBottom>Analiza Postaci</Typography>
          <Typography variant="body1">
            Informacje o postaciach w scenariuszu, ich cechy, rozwój i znaczenie.
          </Typography>
        </TabPanel>
        
        <TabPanel value={tabValue} index={2}>
          <Typography variant="h6" gutterBottom>Analiza Scen</Typography>
          <Typography variant="body1">
            Struktura scen, długość, tempo i rozkład w scenariuszu.
          </Typography>
        </TabPanel>
        
        <TabPanel value={tabValue} index={3}>
          <Typography variant="h6" gutterBottom>Analiza Dialogów</Typography>
          <Typography variant="body1">
            Analiza dialogów, częstość, długość i charakterystyka wypowiedzi postaci.
          </Typography>
        </TabPanel>
        
        <TabPanel value={tabValue} index={4}>
          <Typography variant="h6" gutterBottom>Lokalizacje</Typography>
          <Typography variant="body1">
            Mapa i analiza lokalizacji występujących w scenariuszu.
          </Typography>
        </TabPanel>
        
        <TabPanel value={tabValue} index={5}>
          <Typography variant="h6" gutterBottom>Rekwizyty i Obiekty</Typography>
          <Typography variant="body1">
            Lista i analiza rekwizytów i obiektów pojawiających się w scenariuszu.
          </Typography>
        </TabPanel>
        
        <TabPanel value={tabValue} index={6}>
          <Typography variant="h6" gutterBottom>Analiza Emocjonalna</Typography>
          <Typography variant="body1">
            Mapa emocji i napięcia w scenariuszu.
          </Typography>
        </TabPanel>
        
        <TabPanel value={tabValue} index={7}>
          <Typography variant="h6" gutterBottom>Wątki Fabularne</Typography>
          <Typography variant="body1">
            Analiza głównych i pobocznych wątków fabularnych.
          </Typography>
        </TabPanel>
        
        <TabPanel value={tabValue} index={8}>
          <Typography variant="h6" gutterBottom>Wizualizacje</Typography>
          <Typography variant="body1">
            Graficzne przedstawienie kluczowych aspektów scenariusza.
          </Typography>
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default AnalysisPage; 