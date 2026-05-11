import { createTheme } from "@mui/material/styles";

// VS Code Dark Theme
export const darkTheme = createTheme({
  palette: {
    mode: "dark",
    background: {
      primary: "#101010",
      secondary: "#1f1f1f",
      tertiary: "#252526",
      quaternary: "#353536",
      default: "#353536"
    },
    text: {
      primary: "#ffffff",
      secondary: "#d4d4d4",
      tertiary: "#7f848e"
    },
    primary: {
      main: "#ffff"
    },
    secondary: {
      main: "#d4d4d4"
    },
    success: {
      main: "#32CD32"
    },
    error: {
      main: "#f44747"
    },
    warning: {
      main: "#ffcc00"
    },
    info: {
      main: "#ffffff"
    },
    action: {
      active: "#ffffff"
    }
  }
});

// VS Code Light Theme
export const lightTheme = createTheme({
  palette: {
    mode: "light",
    background: {
      primary: "#ffffff",
      secondary: "#dfdfdf",
      tertiary: "#bfbfbf",
      quaternary: "#7f7f7f",
      default: "#7f7f7f"
    },
    text: {
      primary: "#1f1f1f",
      secondary: "#2f2f2f",
      tertiary: "#666666"
    },
    primary: {
      main: "#1e1e1e"
    },
    secondary: {
      main: "#252526"
    },
    success: {
      main: "#32CD32"
    },
    error: {
      main: "#f44747"
    },
    warning: {
      main: "#ffcc00"
    },
    info: {
      main: "#1f1f1f"
    },
    action: {
      active: "#1f1f1f"
    }
  }
});
