import { useEffect } from 'react';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { IDELayout } from './layouts/IDELayout';
import { useExplorerStore } from './store/explorerStore';
import { UIStyleProvider } from './components/UIStyleProvider';
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
  const { setFiles, expandFolder } = useExplorerStore();

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
            content: `export class RobotProgram {
  constructor() {
    this.initialize();
  }

  initialize() {
    console.log('Robot Studio ready');
  }
}
`,
          },
          {
            id: 'file-2',
            name: 'config.json',
            type: 'file' as const,
            path: '/src/config.json',
            language: 'json',
            content: '{\n  "robot": "UR5",\n  "mode": "teach"\n}',
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
            content: `<robot name="UR5">
  <link name="base_link" />
  <joint name="shoulder" type="revolute" />
</robot>`,
          },
        ],
      },
    ];
    setFiles(sampleFiles);
    sampleFiles.forEach((folder) => expandFolder(folder.id));
  }, [expandFolder, setFiles]);

  return (
    <QueryClientProvider client={queryClient}>
      <UIStyleProvider>
        <IDELayout />
      </UIStyleProvider>
    </QueryClientProvider>
  );
}

export default App;
