import { useState } from 'react'
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from "@mui/material/CssBaseline";
import Layout from '../src/components/Layout'
import { darkTheme, lightTheme } from './theme'
import './App.css'

const App = () => {
  const [themeMode, setThemeMode] = useState("dark"); // Default to dark theme
  const theme = themeMode === "dark" ? darkTheme : lightTheme;
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Layout themeMode={themeMode} setThemeMode={setThemeMode} />
    </ThemeProvider>
  );
};

export default App
