"use client";

import { useState } from "react";
import Layout from "../components/Layout";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { darkTheme, lightTheme } from "./theme"; // Import themes

const Home = () => {
  const [themeMode, setThemeMode] = useState("dark"); // Default to dark theme
  const theme = themeMode === "dark" ? darkTheme : lightTheme;
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Layout themeMode={themeMode} setThemeMode={setThemeMode} />
    </ThemeProvider>
  );
};

export default Home;
