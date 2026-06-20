import { createTheme } from '@mui/material/styles';

export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#0e639c',
    },
    secondary: {
      main: '#e2a04a',
    },
    background: {
      default: '#1e1e1e',
      paper: '#252526',
    },
    text: {
      primary: '#d4d4d4',
      secondary: '#858585',
    },
  },
  typography: {
    fontFamily: "'Segoe UI', 'Helvetica Neue', sans-serif",
    fontSize: 12,
    body2: {
      fontSize: '12px',
    },
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#1e1e1e',
          borderBottom: '1px solid #3e3e42',
        },
      },
    },
  },
});

export const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#0e639c',
    },
    secondary: {
      main: '#e2a04a',
    },
    background: {
      default: '#ffffff',
      paper: '#f5f5f5',
    },
  },
});
