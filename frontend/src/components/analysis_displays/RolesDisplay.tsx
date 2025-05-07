import React from 'react';
import {
  Paper,
  Typography,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  Box
} from '@mui/material';
import type { AnalysisResult } from '../../types'; // Dostosuj ścieżkę

// Definicja typu dla pojedynczej roli, jeśli nie ma globalnie
interface Role {
  character: string;
  role: string;
}

interface RolesDisplayProps {
  rolesData: AnalysisResult['roles']; // Oczekujemy obiektu { roles?: Role[] }
}

const RolesDisplay: React.FC<RolesDisplayProps> = ({ rolesData }) => {
  const roles = rolesData?.roles;

  if (!roles || roles.length === 0) {
    return <Typography>Brak danych o postaciach do wyświetlenia.</Typography>;
  }

  return (
    <Paper elevation={3} sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom sx={{ mb: 2 }}>
        Postaci
      </Typography>
      <TableContainer component={Paper} variant="outlined">
        <Table sx={{ minWidth: 650 }} aria-label="tabela postaci">
          <TableHead sx={{ backgroundColor: 'action.hover' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>Postać</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Rola / Opis</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {roles.map((role, index) => (
              <TableRow
                key={index}
                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
              >
                <TableCell component="th" scope="row">
                  <Typography variant="subtitle1" fontWeight="medium">{role.character}</Typography>
                </TableCell>
                <TableCell>
                  {/* Można dodać logikę do renderowania roli jako Chip lub zwykły tekst */}
                  <Chip label={role.role} size="small" color="primary" variant="outlined" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

export default RolesDisplay; 