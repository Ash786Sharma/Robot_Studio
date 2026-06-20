import React, { useState } from 'react';
import { Box, Tabs, Tab, IconButton, Tooltip } from '@mui/material';
import Editor from '@monaco-editor/react';
import CloseIcon from '@mui/icons-material/Close';
import { useEditorStore } from '../../store/editorStore';
import type { EditorTab } from '../../types';

export const CodeEditor: React.FC = () => {
  const { tabs, activeTabId, setActiveTab, removeTab, updateTab } = useEditorStore();
  const [editorValue, setEditorValue] = useState<Record<string, string>>({});

  const activeTab = tabs.find((t) => t.id === activeTabId);

  const handleEditorChange = (value: string | undefined) => {
    if (!activeTab || !value) return;
    setEditorValue((prev) => ({
      ...prev,
      [activeTab.id]: value,
    }));
    updateTab(activeTab.id, {
      content: value,
      isDirty: true,
    });
  };

  const getLanguageFromExtension = (filename: string): string => {
    const ext = filename.split('.').pop()?.toLowerCase();
    const languageMap: Record<string, string> = {
      ts: 'typescript',
      tsx: 'typescript',
      js: 'javascript',
      jsx: 'javascript',
      py: 'python',
      c: 'c',
      cpp: 'cpp',
      java: 'java',
      cs: 'csharp',
      json: 'json',
      xml: 'xml',
      yaml: 'yaml',
      html: 'html',
      css: 'css',
    };
    return languageMap[ext!] || 'plaintext';
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: '#1e1e1e',
      }}
    >
      {tabs.length > 0 ? (
        <>
          <Box sx={{ borderBottom: '1px solid #3e3e42' }}>
            <Tabs
              value={activeTabId || 0}
              onChange={(_event: React.SyntheticEvent, value: number) => setActiveTab(tabs[value]?.id || '')}
              sx={{
                minHeight: 35,
                '& .MuiTab-root': {
                  minHeight: 35,
                  padding: '0 12px',
                  color: '#858585',
                  textTransform: 'none',
                  fontSize: '12px',
                  borderRight: '1px solid #3e3e42',
                  '&.Mui-selected': {
                    color: '#fff',
                    backgroundColor: '#1e1e1e',
                  },
                },
              }}
            >
              {tabs.map((tab: EditorTab) => (
                <Tab
                  key={tab.id}
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <span>{tab.filename}</span>
                      {tab.isDirty && <span>●</span>}
                      <Tooltip title="Close">
                        <IconButton
                          size="small"
                          onClick={(e: React.MouseEvent) => {
                            e.stopPropagation();
                            removeTab(tab.id);
                          }}
                          sx={{
                            padding: '2px',
                            color: '#858585',
                            '&:hover': {
                              color: '#fff',
                            },
                          }}
                        >
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  }
                />
              ))}
            </Tabs>
          </Box>

          {activeTab && (
            <Box sx={{ flex: 1, overflow: 'hidden' }}>
              <Editor
                height="100%"
                language={getLanguageFromExtension(activeTab.filename)}
                value={editorValue[activeTab.id] || activeTab.content}
                onChange={handleEditorChange}
                theme="vs-dark"
                options={{
                  minimap: { enabled: false },
                  fontSize: 13,
                  fontFamily: "'Courier New', monospace",
                  scrollBeyondLastLine: false,
                  wordWrap: 'on',
                }}
              />
            </Box>
          )}
        </>
      ) : (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: '#858585',
          }}
        >
          No files open
        </Box>
      )}
    </Box>
  );
};
