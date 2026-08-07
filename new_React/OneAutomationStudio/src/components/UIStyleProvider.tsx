import React, { createContext, useContext, useMemo } from 'react';
import { ThemeProvider, createTheme, CssBaseline, type PaletteMode } from '@mui/material';
import config from '../assets/ui-style-config.json';
import { useUIStore } from '../store/uiStore';

interface ThemeDefinition {
  mode?: PaletteMode;
  background: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  primary: string;
  text: string;
  textSecondary: string;
  hover: string;
  menuBackground: string;
  toolbarBackground: string;
  inputBackground: string;
  inputBackgroundFocus: string;
  scrollbarTrack: string;
  scrollbarThumb: string;
  scrollbarThumbHover: string;
}

interface StyleConfig {
  fontFamily: string;
  theme: Record<string, ThemeDefinition>;
}

const UIStyleContext = createContext(config as any);

export const useUIStyle = () => useContext(UIStyleContext);

export const UIStyleProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const { theme } = useUIStore();
  const styleConfig = config as StyleConfig;
  const selectedTheme = styleConfig.theme[theme] ?? styleConfig.theme['vs-dark'];
  const themeMode = selectedTheme.mode ?? (theme === 'light' ? 'light' : 'dark');

  const muiTheme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: themeMode,
          background: {
            default: selectedTheme.background,
            paper: selectedTheme.surface,
          },
          primary: {
            main: selectedTheme.primary,
          },
          text: {
            primary: selectedTheme.text,
            secondary: selectedTheme.textSecondary,
          },
        },
        typography: {
          fontFamily: styleConfig.fontFamily,
        },
      }),
    [selectedTheme, styleConfig.fontFamily, themeMode],
  );

  React.useEffect(() => {
    const root = document.documentElement;
    const themeVars: Record<string, string> = {
      '--ui-font-family': styleConfig.fontFamily,
      '--ui-bg': selectedTheme.background,
      '--ui-surface': selectedTheme.surface,
      '--ui-surface-alt': selectedTheme.surfaceAlt,
      '--ui-border': selectedTheme.border,
      '--ui-primary': selectedTheme.primary,
      '--ui-text': selectedTheme.text,
      '--ui-text-secondary': selectedTheme.textSecondary,
      '--ui-hover': selectedTheme.hover,
      '--ui-menu-bg': selectedTheme.menuBackground,
      '--ui-toolbar-bg': selectedTheme.toolbarBackground,
      '--ui-input-bg': selectedTheme.inputBackground,
      '--ui-input-bg-focus': selectedTheme.inputBackgroundFocus,
      '--ui-scrollbar-track': selectedTheme.scrollbarTrack,
      '--ui-scrollbar-thumb': selectedTheme.scrollbarThumb,
      '--ui-scrollbar-thumb-hover': selectedTheme.scrollbarThumbHover,
    };

    Object.entries(themeVars).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });
  }, [selectedTheme, styleConfig.fontFamily]);

  return (
    <UIStyleContext.Provider value={selectedTheme}>
      <ThemeProvider theme={muiTheme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </UIStyleContext.Provider>
  );
};
