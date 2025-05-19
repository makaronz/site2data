import React from 'react';
import { Box, Typography, Paper, useTheme, Grid, Chip, Button } from '@mui/material';
import useGlobalStore from '../store/globalStore';

/**
 * Production Risk Dashboard View
 * 
 * Role: Producer
 * 
 * Features:
 * - List of risky scenes with warning indicators
 * - Aggregated risk score per scene
 * - Filters by risk type, score level, time of day
 */
const ProductionRisks: React.FC = () => {
  const theme = useTheme();
  const { highContrast, setSelectedScene } = useGlobalStore();
  
  // Mock data for risky scenes (will be replaced with API data)
  const mockRiskyScenes = [
    { 
      id: 2, 
      number: 2, 
      location: 'EXT. STREET - NIGHT', 
      characters: ['JOHN'], 
      riskScore: 'medium',
      riskFactors: ['night_shooting', 'traffic'],
      mitigation: 'Traffic control, safety officer on set'
    },
    { 
      id: 6, 
      number: 6, 
      location: 'EXT. ROOFTOP - NIGHT', 
      characters: ['JOHN', 'VILLAIN'], 
      riskScore: 'high',
      riskFactors: ['stunts', 'heights', 'night_shooting'],
      mitigation: 'Stunt coordinator, safety harnesses, padding'
    },
    { 
      id: 8, 
      number: 8, 
      location: 'INT. BURNING BUILDING - DAY', 
      characters: ['JOHN', 'VICTIM'], 
      riskScore: 'high',
      riskFactors: ['sfx', 'fire'],
      mitigation: 'Fire safety officer, controlled environment, fire extinguishers'
    },
    { 
      id: 12, 
      number: 12, 
      location: 'EXT. PARK - DAY', 
      characters: ['JOHN', 'MARY', 'CHILD'], 
      riskScore: 'medium',
      riskFactors: ['children'],
      mitigation: 'Child wrangler, limited hours, parent on set'
    },
    { 
      id: 15, 
      number: 15, 
      location: 'EXT. FARM - DAY', 
      characters: ['JOHN', 'FARMER'], 
      riskScore: 'low',
      riskFactors: ['animals'],
      mitigation: 'Animal handler on set'
    }
  ];
  
  // Get risk icon
  const getRiskIcon = (riskFactor: string) => {
    switch (riskFactor) {
      case 'stunts': return '🔥';
      case 'animals': return '🐶';
      case 'sfx': return '🎆';
      case 'children': return '👶';
      case 'fire': return '🔥';
      case 'heights': return '🏔️';
      case 'night_shooting': return '🌙';
      case 'traffic': return '🚗';
      default: return '⚠️';
    }
  };
  
  // Get risk color
  const getRiskColor = (riskScore: string) => {
    switch (riskScore) {
      case 'high': return theme.palette.error.main;
      case 'medium': return theme.palette.warning.main;
      case 'low': return theme.palette.success.main;
      default: return theme.palette.info.main;
    }
  };
  
  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Production Risk Dashboard
      </Typography>
      
      <Typography variant="body1" paragraph>
        Monitor and manage production risks across all scenes.
      </Typography>
      
      {/* Filter Controls */}
      <Paper 
        elevation={2}
        sx={{ 
          p: 2, 
          mb: 4,
          backgroundColor: highContrast 
            ? theme.palette.mode === 'dark' ? '#121212' : '#ffffff'
            : theme.palette.background.paper,
        }}
      >
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Button variant="outlined" size="small">
            All Risks
          </Button>
          <Button variant="outlined" size="small">
            High Risk Only
          </Button>
          <Button variant="outlined" size="small">
            Stunts
          </Button>
          <Button variant="outlined" size="small">
            Special Effects
          </Button>
          <Button variant="outlined" size="small">
            Children
          </Button>
          <Button variant="outlined" size="small">
            Animals
          </Button>
        </Box>
      </Paper>
      
      {/* Risk List */}
      <Grid container spacing={3}>
        {mockRiskyScenes.map((scene) => (
          <Grid item xs={12} md={6} key={scene.id}>
            <Paper 
              elevation={2}
              sx={{ 
                p: 0,
                overflow: 'hidden',
                cursor: 'pointer',
                '&:hover': {
                  boxShadow: 6,
                },
                backgroundColor: highContrast 
                  ? theme.palette.mode === 'dark' ? '#1e1e1e' : '#f5f5f5'
                  : theme.palette.background.paper,
                borderLeft: `6px solid ${getRiskColor(scene.riskScore)}`,
              }}
              onClick={() => setSelectedScene(scene)}
            >
              <Box sx={{ 
                p: 2, 
                borderBottom: `1px solid ${theme.palette.divider}`,
                backgroundColor: theme.palette.mode === 'dark' 
                  ? 'rgba(255, 255, 255, 0.05)' 
                  : 'rgba(0, 0, 0, 0.02)',
              }}>
                <Typography variant="h6">
                  Scene {scene.number}: {scene.location}
                </Typography>
                <Typography variant="body2">
                  Cast: {scene.characters.join(', ')}
                </Typography>
              </Box>
              
              <Box sx={{ p: 2 }}>
                {/* Risk Score */}
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ mr: 2 }}>
                    Risk Level:
                  </Typography>
                  <Chip 
                    label={scene.riskScore.toUpperCase()} 
                    size="small"
                    sx={{ 
                      backgroundColor: getRiskColor(scene.riskScore),
                      color: '#fff',
                      fontWeight: 'bold'
                    }}
                  />
                </Box>
                
                {/* Risk Factors */}
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Risk Factors:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                  {scene.riskFactors.map((factor) => (
                    <Chip 
                      key={factor}
                      icon={<span style={{ fontSize: '1.2rem' }}>{getRiskIcon(factor)}</span>}
                      label={factor.replace('_', ' ')}
                      size="small"
                      variant="outlined"
                    />
                  ))}
                </Box>
                
                {/* Mitigation */}
                <Typography variant="subtitle2">
                  Mitigation Strategy:
                </Typography>
                <Typography variant="body2">
                  {scene.mitigation}
                </Typography>
                
                {/* View in Planner Button */}
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                  <Button 
                    variant="outlined" 
                    size="small"
                    href={`/shooting-planner?scene=${scene.id}`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    View in Planner
                  </Button>
                </Box>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default ProductionRisks;
