import React from 'react';
import { Box, Drawer, List, ListItem, ListItemIcon, ListItemText, Divider, Typography, useTheme } from '@mui/material';
import { 
  MovieOutlined, 
  PeopleOutlined, 
  LocationOnOutlined, 
  CalendarMonthOutlined, 
  WarningOutlined, 
  CategoryOutlined,
  PlayArrowOutlined
} from '@mui/icons-material';
import useGlobalStore from '../store/globalStore';

// Sidebar width
const DRAWER_WIDTH = 240;

/**
 * Role-based navigation sidebar component
 * 
 * Displays different navigation options based on the user's selected role
 */
const Sidebar: React.FC = () => {
  const theme = useTheme();
  const { userRole, setUserRole, highContrast } = useGlobalStore();
  
  // Define navigation items based on user role
  const getNavigationItems = () => {
    // Common items for all roles
    const commonItems = [
      {
        text: 'Scene Breakdown',
        icon: <MovieOutlined />,
        path: '/scene-breakdown',
        roles: ['Director', '1st AD']
      },
      {
        text: 'Character Map',
        icon: <PeopleOutlined />,
        path: '/character-map',
        roles: ['Director', 'Screenwriter']
      },
      {
        text: 'Location Planner',
        icon: <LocationOnOutlined />,
        path: '/location-planner',
        roles: ['Production Manager', 'Designer']
      },
      {
        text: 'Shooting Day Planner',
        icon: <CalendarMonthOutlined />,
        path: '/shooting-planner',
        roles: ['1st AD']
      },
      {
        text: 'Production Risks',
        icon: <WarningOutlined />,
        path: '/production-risks',
        roles: ['Producer']
      },
      {
        text: 'Props & Equipment',
        icon: <CategoryOutlined />,
        path: '/props-matrix',
        roles: ['Designer', 'Operator']
      },
      {
        text: 'Narrative Playback',
        icon: <PlayArrowOutlined />,
        path: '/narrative-playback',
        roles: ['Director', 'Screenwriter']
      }
    ];
    
    // Filter items based on current role
    return commonItems.filter(item => item.roles.includes(userRole));
  };
  
  // Get role-specific navigation items
  const navigationItems = getNavigationItems();
  
  // Role options for role switcher
  const roleOptions = [
    'Director',
    'Producer',
    '1st AD',
    'Production Manager',
    'Designer',
    'Screenwriter',
    'Operator'
  ];
  
  return (
    <Drawer
      variant="permanent"
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: DRAWER_WIDTH,
          boxSizing: 'border-box',
          backgroundColor: highContrast 
            ? theme.palette.mode === 'dark' ? '#121212' : '#ffffff'
            : theme.palette.background.paper,
        },
      }}
    >
      <Box sx={{ 
        p: 2, 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center',
        backgroundColor: theme.palette.primary.main,
        color: theme.palette.primary.contrastText
      }}>
        <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
          ai_CineHub
        </Typography>
      </Box>
      
      <Box sx={{ p: 2 }}>
        <Typography variant="subtitle2" sx={{ mb: 1, color: theme.palette.text.secondary }}>
          Current Role
        </Typography>
        <Box 
          component="select"
          value={userRole}
          onChange={(e) => setUserRole(e.target.value as any)}
          sx={{
            width: '100%',
            p: 1,
            borderRadius: 1,
            border: `1px solid ${theme.palette.divider}`,
            backgroundColor: theme.palette.background.paper,
            color: theme.palette.text.primary,
            '&:focus': {
              outline: 'none',
              border: `1px solid ${theme.palette.primary.main}`,
            }
          }}
        >
          {roleOptions.map((role) => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </Box>
      </Box>
      
      <Divider />
      
      <List>
        {navigationItems.map((item) => (
          <ListItem 
            key={item.text}
            component="a"
            href={item.path}
            sx={{
              color: highContrast 
                ? theme.palette.mode === 'dark' ? '#ffffff' : '#000000'
                : theme.palette.text.primary,
              '&:hover': {
                backgroundColor: highContrast 
                  ? theme.palette.mode === 'dark' ? '#333333' : '#e0e0e0'
                  : theme.palette.action.hover,
              },
              cursor: 'pointer',
              textDecoration: 'none'
            }}
          >
            <ListItemIcon sx={{ 
              color: highContrast 
                ? theme.palette.mode === 'dark' ? '#ffffff' : '#000000'
                : theme.palette.primary.main 
            }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItem>
        ))}
      </List>
      
      <Box sx={{ flexGrow: 1 }} />
      
      <Box sx={{ p: 2 }}>
        <Typography 
          variant="caption" 
          component="div" 
          sx={{ 
            textAlign: 'center',
            color: theme.palette.text.secondary
          }}
        >
          ai_CineHub v1.0.0
        </Typography>
      </Box>
    </Drawer>
  );
};

export default Sidebar;
