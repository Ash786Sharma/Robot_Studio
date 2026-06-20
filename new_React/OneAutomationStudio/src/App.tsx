import { useEffect } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { darkTheme } from './theme';
import { IDELayout } from './layouts/IDELayout';
import { useUIStore } from './store/uiStore';
import { useExplorerStore } from './store/explorerStore';
import './App.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  const { theme } = useUIStore();
  const { setFiles } = useExplorerStore();

  // Initialize with sample file structure
  useEffect(() => {
    const sampleFiles = [
      {
        id: 'folder-1',
        name: 'src',
        type: 'folder' as const,
        path: '/src',
        children: [
          {
            id: 'file-1',
            name: 'main.ts',
            type: 'file' as const,
            path: '/src/main.ts',
            language: 'typescript',
            content: '// Main program',
          },
          {
            id: 'file-2',
            name: 'config.json',
            type: 'file' as const,
            path: '/src/config.json',
            language: 'json',
            content: '{}',
          },
        ],
      },
      {
        id: 'folder-2',
        name: 'models',
        type: 'folder' as const,
        path: '/models',
        children: [
          {
            id: 'file-3',
            name: 'robot.urdf',
            type: 'file' as const,
            path: '/models/robot.urdf',
            language: 'xml',
            content: '<!-- Robot URDF -->',
          },
        ],
      },
    ];
    setFiles(sampleFiles);
  }, [setFiles]);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme === 'dark' ? darkTheme : darkTheme}>
        <CssBaseline />
        <IDELayout />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
