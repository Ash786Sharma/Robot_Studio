// Keyboard shortcuts for the IDE
export const SHORTCUTS = {
  SAVE: 'Ctrl+S',
  SAVE_ALL: 'Ctrl+Shift+S',
  OPEN_FILE: 'Ctrl+O',
  NEW_FILE: 'Ctrl+N',
  CLOSE_TAB: 'Ctrl+W',
  RUN: 'F5',
  DEBUG: 'F6',
  TERMINAL: 'Ctrl+`',
  COMMAND_PALETTE: 'Ctrl+Shift+P',
  FIND: 'Ctrl+F',
  REPLACE: 'Ctrl+H',
  COMMENT: 'Ctrl+/',
};

// File type configurations
export const FILE_TYPES = {
  TYPESCRIPT: 'typescript',
  JAVASCRIPT: 'javascript',
  PYTHON: 'python',
  C: 'c',
  CPP: 'cpp',
  JAVA: 'java',
  JSON: 'json',
  XML: 'xml',
  YAML: 'yaml',
  HTML: 'html',
  CSS: 'css',
};

// Project types
export const PROJECT_TYPES = {
  ROBOT: 'robot',
  PLC: 'plc',
  HMI: 'hmi',
} as const;

// View modes
export const VIEW_MODES = {
  TEXT: 'text',
  GRAPHICAL: 'graphical',
  SPLIT: 'split',
  '3D': '3d',
} as const;

// UI sizes
export const UI_SIZES = {
  SIDEBAR_WIDTH_MIN: 200,
  SIDEBAR_WIDTH_MAX: 500,
  SIDEBAR_WIDTH_DEFAULT: 250,
  TERMINAL_HEIGHT_MIN: 100,
  TERMINAL_HEIGHT_MAX: 400,
  TERMINAL_HEIGHT_DEFAULT: 200,
  MENU_BAR_HEIGHT: 40,
  TOOL_BAR_HEIGHT: 40,
};

// Colors
export const COLORS = {
  PRIMARY: '#0e639c',
  SECONDARY: '#e2a04a',
  BACKGROUND: '#1e1e1e',
  FOREGROUND: '#d4d4d4',
  SIDEBAR_BG: '#252526',
  EDITOR_BG: '#1e1e1e',
  TERMINAL_BG: '#1e1e1e',
  BORDER: '#3e3e42',
  ERROR: '#e81828',
  WARNING: '#e2a04a',
  SUCCESS: '#4ae290',
  INFO: '#4a90e2',
};
