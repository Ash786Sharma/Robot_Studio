import React, { useState } from 'react';
import { Box, TextField, Typography, Tabs, Tab, IconButton, Tooltip } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SettingsIcon from '@mui/icons-material/Settings';

interface TerminalTab {
  id: string;
  name: string;
  content: string;
}

export const Terminal: React.FC = () => {
  const [tabs, setTabs] = useState<TerminalTab[]>([
    { id: '1', name: 'Terminal', content: '$ ' },
  ]);
  const [activeTabId, setActiveTabId] = useState('1');
  const [input, setInput] = useState('');

  const activeTab = tabs.find((t) => t.id === activeTabId);

  const handleInput = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      if (activeTab) {
        const newContent = activeTab.content + input + '\n$ ';
        setTabs((prev) =>
          prev.map((t) =>
            t.id === activeTabId ? { ...t, content: newContent } : t
          )
        );
        setInput('');
      }
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: '#1e1e1e',
        color: '#d4d4d4',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          borderBottom: '1px solid #3e3e42',
          paddingRight: 1,
        }}
      >
        <Tabs
          value={activeTabId}
          onChange={(_event, value: string) => setActiveTabId(value)}
          sx={{
            flex: 1,
            minHeight: 35,
            '& .MuiTab-root': {
              minHeight: 35,
              padding: '0 12px',
              color: '#858585',
              textTransform: 'none',
              fontSize: '12px',
              borderRight: '1px solid #3e3e42',
            },
          }}
        >
          {tabs.map((tab) => (
            <Tab
              key={tab.id}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <span>{tab.name}</span>
                  <Tooltip title="Close">
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        setTabs((prev) => prev.filter((t) => t.id !== tab.id));
                      }}
                      sx={{ padding: '2px', color: '#858585' }}
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              }
              value={tab.id}
            />
          ))}
        </Tabs>
        <Tooltip title="Terminal Settings">
          <IconButton size="small" sx={{ color: '#858585' }}>
            <SettingsIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      <Box
        sx={{
          flex: 1,
          overflow: 'auto',
          padding: '12px',
          fontFamily: "'Courier New', monospace",
          fontSize: '12px',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}
      >
        {activeTab && (
          <>
            <Typography
              component="div"
              sx={{
                color: '#d4d4d4',
                marginBottom: 1,
              }}
            >
              {activeTab.content}
            </Typography>
          </>
        )}
      </Box>

      <Box sx={{ padding: '8px 12px', borderTop: '1px solid #3e3e42' }}>
        <TextField
          fullWidth
          size="small"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleInput}
          placeholder="$ "
          sx={{
            '& .MuiInputBase-input': {
              color: '#d4d4d4',
              fontFamily: "'Courier New', monospace",
              fontSize: '12px',
              padding: '6px',
            },
            '& .MuiOutlinedInput-root': {
              borderColor: '#3e3e42',
            },
          }}
        />
      </Box>
    </Box>
  );
};
