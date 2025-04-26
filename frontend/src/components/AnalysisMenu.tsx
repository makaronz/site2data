import React from 'react';
import { Stack, Button, Typography } from '@mui/material';
import type { AnalysisSection } from '../types';

const sections: { key: AnalysisSection; label: string }[] = [
  { key: 'Metadane produkcji', label: 'Metadane produkcji' },
  { key: 'Struktura scen', label: 'Struktura scen' },
  { key: 'Postaci', label: 'Postaci' },
  { key: 'Relacje', label: 'Relacje' },
  { key: 'Tematy i klastery', label: 'Tematy i klastery' },
  { key: 'Zasoby produkcyjne', label: 'Zasoby produkcyjne' },
  { key: 'Pacing & statystyki techniczne', label: 'Pacing & statystyki techniczne' },
  { key: 'Budżetowe czerwone flagi', label: 'Budżetowe czerwone flagi' },
  { key: 'Ekstra', label: 'Ekstra' },
  { key: 'Graf', label: 'Graf relacji' },
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