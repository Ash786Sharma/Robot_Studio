import React from 'react';
import { Box, Typography } from '@mui/material';
import { MenuBar } from '../components/MenuBar';
import { ToolBar } from '../components/ToolBar';
import { Explorer } from '../components/Explorer';
import { CodeEditor } from '../components/Editor';
import { Terminal } from '../components/Terminal';
import { View3D } from '../components/3DView';
import { GraphEditor } from '../components/GraphEditor';
import { useEditorStore } from '../store/editorStore';
import { useUIStore } from '../store/uiStore';

export const IDELayout: React.FC = () => {
  const {
    sidebarOpen,
    terminalOpen,
    explorerOpen,
    terminalHeight,
    sidebarWidth,
    viewMode,
    setTerminalHeight,
    setSidebarWidth,
  } = useUIStore();
  const { tabs, activeTabId } = useEditorStore();

  const activeTab = tabs.find((tab) => tab.id === activeTabId);

  const renderEditorContent = () => {
    switch (viewMode.layout) {
      case 'text':
        return <CodeEditor />;
      case 'graphical':
        return <GraphEditor />;
      case '3d':
        return <View3D />;
      case 'split':
        return (
          <Box sx={{ display: 'flex', height: '100%', gap: 1, padding: 1 }}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <CodeEditor />
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <View3D />
            </Box>
          </Box>
        );
      default:
        return <CodeEditor />;
    }
  };

  return (
    <Box
      className="ide-container"
      sx={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#1e1e1e',
        color: '#d4d4d4',
      }}
    >
      {/* Menu Bar */}
      <Box className="ide-header">
        <MenuBar />
      </Box>

      {/* Tool Bar */}
      <Box className="toolbar">
        <ToolBar />
      </Box>

      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 1.5,
          py: 0.5,
          backgroundColor: '#252526',
          borderBottom: '1px solid #3e3e42',
          color: '#858585',
        }}
      >
        <Typography variant="caption" sx={{ fontWeight: 600, color: '#d4d4d4' }}>
          Robot Studio / {activeTab?.filename ?? 'No file selected'}
        </Typography>
        <Typography variant="caption">
          {viewMode.layout === 'text' ? 'Text Editor' : viewMode.layout === 'graphical' ? 'Graph Editor' : viewMode.layout === '3d' ? '3D View' : 'Split View'}
        </Typography>
      </Box>

      {/* Main Content Area */}
      <Box
        className="ide-main-content"
        sx={{
          display: 'flex',
          flex: 1,
          overflow: 'hidden',
          gap: 0,
        }}
      >
        {/* Sidebar */}
        {sidebarOpen && (
          <>
            <Box
              className="ide-sidebar"
              sx={{
                width: sidebarWidth,
                backgroundColor: '#252526',
                borderRight: '1px solid #3e3e42',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {explorerOpen && <Explorer />}
            </Box>
            <Box
              className="ide-resize-handle"
              onMouseDown={(e) => {
                e.preventDefault();
                const startX = e.clientX;
                const startWidth = sidebarWidth;

                const handleMouseMove = (moveEvent: MouseEvent) => {
                  const diff = moveEvent.clientX - startX;
                  const newWidth = Math.max(200, Math.min(500, startWidth + diff));
                  setSidebarWidth(newWidth);
                };

                const handleMouseUp = () => {
                  document.removeEventListener('mousemove', handleMouseMove);
                  document.removeEventListener('mouseup', handleMouseUp);
                };

                document.addEventListener('mousemove', handleMouseMove);
                document.addEventListener('mouseup', handleMouseUp);
              }}
              sx={{
                cursor: 'col-resize',
                width: 4,
                backgroundColor: 'transparent',
                '&:hover': {
                  backgroundColor: '#0e639c',
                },
              }}
            />
          </>
        )}

        {/* Editor Area */}
        <Box
          className="ide-editor-area"
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            backgroundColor: '#1e1e1e',
            minWidth: 0,
          }}
        >
          {/* Editor */}
          <Box
            sx={{
              flex: terminalOpen ? 1 : '1 1 auto',
              overflow: 'hidden',
              minHeight: 0,
            }}
          >
            {renderEditorContent()}
          </Box>

          {/* Terminal */}
          {terminalOpen && (
            <>
              <Box
                className="ide-terminal-resize"
                onMouseDown={(e) => {
                  e.preventDefault();
                  const startY = e.clientY;
                  const startHeight = terminalHeight;

                  const handleMouseMove = (moveEvent: MouseEvent) => {
                    const diff = moveEvent.clientY - startY;
                    const newHeight = Math.max(100, Math.min(400, startHeight - diff));
                    setTerminalHeight(newHeight);
                  };

                  const handleMouseUp = () => {
                    document.removeEventListener('mousemove', handleMouseMove);
                    document.removeEventListener('mouseup', handleMouseUp);
                  };

                  document.addEventListener('mousemove', handleMouseMove);
                  document.addEventListener('mouseup', handleMouseUp);
                }}
                sx={{
                  cursor: 'row-resize',
                  height: 4,
                  backgroundColor: 'transparent',
                  '&:hover': {
                    backgroundColor: '#0e639c',
                  },
                }}
              />
              <Box
                className="ide-terminal-area"
                sx={{
                  height: terminalHeight,
                  backgroundColor: '#1e1e1e',
                  borderTop: '1px solid #3e3e42',
                  overflow: 'hidden',
                }}
              >
                <Terminal />
              </Box>
            </>
          )}
        </Box>
      </Box>

      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 1.5,
          py: 0.5,
          backgroundColor: '#1e1e1e',
          borderTop: '1px solid #3e3e42',
          color: '#858585',
          fontSize: '12px',
        }}
      >
        <Typography variant="caption">main • TypeScript • Ready</Typography>
        <Typography variant="caption">Ln 1, Col 1 • UTF-8</Typography>
      </Box>
    </Box>
  );
};
