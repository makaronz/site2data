import React from 'react';
import { Drawer, List, ListItem, ListItemIcon, ListItemText, Toolbar, Typography, Box } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import DescriptionIcon from '@mui/icons-material/Description';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import SearchIcon from '@mui/icons-material/Search';
import ChatIcon from '@mui/icons-material/Chat';
import SettingsIcon from '@mui/icons-material/Settings';
import HelpIcon from '@mui/icons-material/Help';

const drawerWidth = 240;

const menuItems = [
  { text: 'Dashboard', icon: <DashboardIcon /> },
  { text: 'Analiza scenariusza', icon: <DescriptionIcon /> },
  { text: 'Graf', icon: <AccountTreeIcon /> },
  { text: 'Wyszukiwarka', icon: <SearchIcon /> },
  { text: 'Czat z AI', icon: <ChatIcon /> },
  { text: 'Ustawienia', icon: <SettingsIcon /> },
  { text: 'Pomoc', icon: <HelpIcon /> },
];

const Sidebar = ({ selected, onSelect }: { selected: string, onSelect: (text: string) => void }) => (
  <Drawer
    variant="permanent"
    sx={{
      width: drawerWidth,
      flexShrink: 0,
      [`& .MuiDrawer-paper`]: {
        width: drawerWidth,
        boxSizing: 'border-box',
        background: 'linear-gradient(180deg, #181A20 0%, #23263A 100%)',
        color: '#fff',
        borderRight: 'none',
      },
    }}
  >
    <Toolbar>
      <Box display="flex" alignItems="center" gap={2} width="100%">
        {/* Placeholder na logo */}
        <Box sx={{ width: 36, height: 36, bgcolor: 'secondary.main', borderRadius: 2 }} />
        <Typography variant="h6" fontWeight={700} sx={{ letterSpacing: 1 }}>
          CINEHUBAI
        </Typography>
      </Box>
    </Toolbar>
    <List>
      {menuItems.map((item) => (
        <ListItem
          button
          key={item.text}
          selected={selected === item.text}
          onClick={() => onSelect(item.text)}
          sx={{
            my: 0.5,
            borderRadius: 2,
            '&.Mui-selected': {
              background: 'linear-gradient(90deg, #FFB300 0%, #FF6F00 100%)',
              color: '#181A20',
              '& .MuiListItemIcon-root': { color: '#181A20' },
            },
          }}
        >
          <ListItemIcon sx={{ color: 'inherit' }}>{item.icon}</ListItemIcon>
          <ListItemText primary={item.text} />
        </ListItem>
      ))}
    </List>
  </Drawer>
);

export default Sidebar; 