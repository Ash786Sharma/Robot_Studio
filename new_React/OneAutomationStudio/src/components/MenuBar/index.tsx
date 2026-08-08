import React from 'react';
import { IconButton, Typography } from '@mui/material';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import { MenuRenderer } from '../MenuRenderer';
import { useUIStore } from '../../store/uiStore';

const themeOrder = ['vs-dark', 'vs-light', 'quiet-light', 'high-contrast'] as const;

type ThemeKey = typeof themeOrder[number];

export const MenuBar: React.FC = () => {
  const { theme, setTheme } = useUIStore();

  const toggleTheme = () => {
    const currentIndex = themeOrder.indexOf(theme as ThemeKey);
    const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % themeOrder.length;
    setTheme(themeOrder[nextIndex]);
  };

  const isDarkTheme = theme === 'high-contrast' || theme.includes('dark');

  return (
    <div className="menu-bar">
      <Typography variant="h6" sx={{ pl: '16px', pr: '16px' }}>
        OAS
      </Typography>

      <MenuRenderer />

      <IconButton
        className="theme-toggle-button"
        color="inherit"
        onClick={toggleTheme}
        title="Cycle theme"
        size="small"
      >
        {isDarkTheme ? <Brightness7Icon /> : <Brightness4Icon />}
      </IconButton>
    </div>
  );
};
