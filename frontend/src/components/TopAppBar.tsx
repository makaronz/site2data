import React from 'react';
import { AppBar, Toolbar, Typography, IconButton, Box, Switch, Avatar } from '@mui/material';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';

const TopAppBar = ({ darkMode, onToggleTheme }: { darkMode: boolean, onToggleTheme: () => void }) => (
  <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1, background: 'linear-gradient(90deg, #181A20 0%, #23263A 100%)', boxShadow: '0 2px 8px #0008' }}>
    <Toolbar>
      <Typography variant="h5" fontWeight={700} sx={{ flexGrow: 1, letterSpacing: 2, color: '#FFB300', textShadow: '0 0 8px #FFB30088' }}>
        CINEHUBAI
      </Typography>
      <Box display="flex" alignItems="center" gap={2}>
        <IconButton color="inherit" onClick={onToggleTheme}>
          {darkMode ? <Brightness7Icon /> : <Brightness4Icon />}
        </IconButton>
        <Avatar sx={{ bgcolor: 'secondary.main' }}>U</Avatar>
      </Box>
    </Toolbar>
  </AppBar>
);

export default TopAppBar; 