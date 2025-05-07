import React from 'react';
import {
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Chip,
  Box,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import ReportProblemIcon from '@mui/icons-material/ReportProblem'; // Ikona dla ryzyka
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import HealingIcon from '@mui/icons-material/Healing'; // Ikona dla mitygacji
import type { AnalysisResult } from '../../types';

interface RiskItem {
  scene_id: string;
  risk_type: string;
  mitigation: string;
}

interface ProductionRisksDisplayProps {
  risksData: AnalysisResult['production_risks']; 
}

const ProductionRisksDisplay: React.FC<ProductionRisksDisplayProps> = ({ risksData }) => {
  const risks = risksData?.risks;

  if (!risks || risks.length === 0) {
    return <Typography>Brak danych o ryzykach produkcyjnych.</Typography>;
  }

  return (
    <Paper elevation={3} sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom sx={{ mb: 2 }}>
        Ryzyka Produkcyjne
      </Typography>
      <Box>
        {risks.map((risk, index) => (
          <Accordion key={index} sx={{ mb: 1, boxShadow: 'none', border: '1px solid', borderColor: 'divider' }} defaultExpanded>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              aria-controls={`risk-panel${index}a-content`}
              id={`risk-panel${index}a-header`}
            >
              <ReportProblemIcon color="error" sx={{ mr: 1 }} />
              <Typography fontWeight="medium">Ryzyko: {risk.risk_type} (Scena: {risk.scene_id || 'Globalne'})</Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ borderTop: '1px solid', borderColor: 'divider', pt:2 }}>
              <Typography variant="subtitle2" gutterBottom>Sugerowana Mitygacja:</Typography>
              <Box sx={{display: 'flex', alignItems: 'center'}}>
                <HealingIcon color="success" sx={{mr: 1, fontSize: '1.2rem'}} />
                <Typography variant="body2" color="text.secondary">
                  {risk.mitigation}
                </Typography>
              </Box>
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>
    </Paper>
  );
};

export default ProductionRisksDisplay; 