import React from 'react';
import { Stack, Button, Typography } from '@mui/material';
import type { AnalysisSection } from '../types';

const sections: { key: AnalysisSection; label: string }[] = [
  { key: 'METADANE PRODUKCJI', label: 'METADANE PRODUKCJI' },
  { key: 'STRUKTURA SCEN', label: 'STRUKTURA SCEN' },
  { key: 'POSTACI', label: 'POSTACI' },
  { key: 'RELACJE', label: 'RELACJE' },
  { key: 'TEMATY I KLASTERY', label: 'TEMATY I KLASTERY' },
  { key: 'ZASOBY PRODUKCYJNE', label: 'ZASOBY PRODUKCYJNE' },
  { key: 'PACING & STATYSTYKI', label: 'PACING & STATYSTYKI' },
  { key: 'TECHNICZNE', label: 'TECHNICZNE' },
  { key: 'BUDŻETOWE CZERWONE FLAGI', label: 'BUDŻETOWE CZERWONE FLAGI' },
  { key: 'EKSTRA', label: 'EKSTRA' },
  { key: 'GRAF RELACJI', label: 'GRAF RELACJI' },
];

interface AnalysisMenuProps {
  activeSection: AnalysisSection;
  onSectionChange: (section: AnalysisSection) => void;
}

const AnalysisMenu: React.FC<AnalysisMenuProps> = ({ activeSection, onSectionChange }) => {
  return (
    <nav aria-label="Nawigacja analizy">
      <Typography variant="h6" sx={{ mb: 2 }}>
        Sekcje analizy
      </Typography>
      <Stack spacing={1}>
        {sections.map((section) => (
          <Button
            key={section.key}
            variant={activeSection === section.key ? 'contained' : 'outlined'}
            color={activeSection === section.key ? 'primary' : 'inherit'}
            onClick={() => onSectionChange(section.key)}
            aria-current={activeSection === section.key ? 'page' : undefined}
            sx={{ justifyContent: 'flex-start', fontWeight: activeSection === section.key ? 'bold' : 'normal' }}
            fullWidth
          >
            {section.label}
          </Button>
        ))}
      </Stack>
    </nav>
  );
};

export default AnalysisMenu; 