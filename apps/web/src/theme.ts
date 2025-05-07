import { createTheme } from "@mui/material/styles";

// Define your theme colors here (e.g., based on film studio branding)
const theme = createTheme({
  palette: {
    primary: {
      main: "#1976d2", // Example primary color
    },
    secondary: {
      main: "#dc004e", // Example secondary color
    },
    // Consider adding dark mode later
    background: {
      default: "#ffffff", // Ensuring high contrast with default text
      paper: "#f5f5f5",   // Ensuring paper elements have contrast
    },
    text: {
      primary: "#000000", // Black text for high contrast on light backgrounds
      secondary: "#333333",
    }
  },
  typography: {
    // Ensuring default typography has good contrast
    allVariants: {
      color: "#000000"
    }
  }
});

export default theme; 