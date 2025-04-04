import { DefaultTheme as PaperDefaultTheme } from 'react-native-paper';
import { DefaultTheme as NavigationDefaultTheme } from '@react-navigation/native';

// Define custom colors
const colors = {
  // Primary colors
  primary: '#1976D2', // Blue
  primaryLight: '#64B5F6',
  primaryDark: '#0D47A1',
  
  // Secondary colors
  secondary: '#FF5722', // Deep Orange
  secondaryLight: '#FF8A65',
  secondaryDark: '#E64A19',
  
  // Accent colors
  accent: '#FFC107', // Amber
  accentLight: '#FFD54F',
  accentDark: '#FFA000',
  
  // Status colors
  success: '#4CAF50', // Green
  warning: '#FF9800', // Orange
  error: '#F44336', // Red
  info: '#2196F3', // Light Blue
  
  // Neutral colors
  white: '#FFFFFF',
  black: '#000000',
  grey1: '#F5F5F5',
  grey2: '#EEEEEE',
  grey3: '#E0E0E0',
  grey4: '#BDBDBD',
  grey5: '#9E9E9E',
  grey6: '#757575',
  grey7: '#616161',
  grey8: '#424242',
  grey9: '#212121',
  
  // Specific UI colors
  background: '#F9FAFB',
  surface: '#FFFFFF',
  text: '#212121',
  textSecondary: '#757575',
  disabled: '#BDBDBD',
  placeholder: '#9E9E9E',
  backdrop: 'rgba(0, 0, 0, 0.5)',
  divider: '#E0E0E0',
  card: '#FFFFFF',
  
  // Production Specific Colors
  shooting: '#4CAF50', // When shooting is active
  preparation: '#2196F3', // Prep time
  wrap: '#FF9800', // Wrap time
  conflict: '#F44336', // Scheduling conflicts
  completed: '#8BC34A', // Completed tasks
  pending: '#FFC107', // Pending tasks
  canceled: '#9E9E9E', // Canceled items
  
  // Department specific colors (for visual coding)
  deptProduction: '#3F51B5', // Indigo
  deptCamera: '#00BCD4', // Cyan
  deptSound: '#CDDC39', // Lime
  deptLighting: '#FFEB3B', // Yellow
  deptArt: '#9C27B0', // Purple
  deptCostume: '#E91E63', // Pink
  deptHMU: '#FF4081', // Pink A200
  deptCast: '#7C4DFF', // Deep Purple A200
};

// Spacing scale
const spacing = {
  xs: 4,
  s: 8,
  m: 16,
  l: 24,
  xl: 32,
  xxl: 48,
};

// Typography
const fontSizes = {
  caption: 12,
  button: 14,
  body: 16,
  title: 20,
  h1: 28,
  h2: 24,
  h3: 20,
  h4: 18,
  h5: 16,
};

// Combine with Paper theme
export const theme = {
  ...PaperDefaultTheme,
  colors: {
    ...PaperDefaultTheme.colors,
    primary: colors.primary,
    accent: colors.accent,
    background: colors.background,
    surface: colors.surface,
    text: colors.text,
    error: colors.error,
    disabled: colors.disabled,
    placeholder: colors.placeholder,
    backdrop: colors.backdrop,
    notification: colors.error,
    // Custom colors
    ...colors,
  },
  // Custom properties
  spacing,
  fontSizes,
  roundness: 8,
};

// Combine with Navigation theme
export const navigationTheme = {
  ...NavigationDefaultTheme,
  colors: {
    ...NavigationDefaultTheme.colors,
    primary: colors.primary,
    background: colors.background,
    card: colors.card,
    text: colors.text,
    border: colors.divider,
    notification: colors.error,
  },
};

// Dark theme color overrides (to be implemented)
export const darkColors = {
  // Base overrides
  background: '#121212',
  surface: '#1E1E1E',
  text: '#FFFFFF',
  textSecondary: '#BDBDBD',
  divider: '#424242',
  card: '#1E1E1E',
  
  // Additional dark theme colors
  // ... (to be implemented)
};

export default theme; 