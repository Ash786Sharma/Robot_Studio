'use client';

import React, { useState, useEffect } from 'react';
import { AppBar, Button, Container, ButtonGroup, Box, ListItemIcon, Tooltip, Skeleton } from '@mui/material';
import * as Icons from '@mui/icons-material';

const ToolBar = () => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [currentTool, setCurrentTool] = useState([]);
  const [toolIndex, setToolIndex] = useState(null);
  const [toolData, settoolData] = useState({ toolItems: [] })
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {

    const fetchData = async () => {
      try {
        const res = await fetch('/api/toolBar');
        if (!res.ok) {
          throw new Error('Failed to fetch menubar data');
        }
        const data = await res.json();
        settoolData(data);
        setCurrentTool(toolData.toolItems);
        setLoading(false); // Set loading to false after data is fetched
      } catch (error) {
        console.log(error.message);
        setLoading(false); // Set loading to false even if there's an error
      }
    };

    fetchData();

    
  }, []);

  const handleToolOpen = (event, toolItems, index) => {
    setAnchorEl(event.currentTarget);
    setCurrentTool(toolItems);
    setToolIndex(index);
  };

  const handleToolClose = () => {
    setAnchorEl(null);
    setToolIndex(null);
  };

  return (
    <AppBar position="fixed" sx={{ top: 40.3, zIndex: (theme) => theme.zIndex.drawer + 1, backgroundColor: '#1e293b', color: '#94a3b8' }} className=' bg-slate-800 text-slate-400 '>
      <Container maxWidth="xl" sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ flexGrow: 1 }}>
          <ButtonGroup variant='text'>
            {loading ? (// Display skeletons while loading
              <>
                {[...Array(14)].map((_, index) => (
                  <Skeleton key={index} variant="rounded" animation="wave" width={40} height={10} sx={{ marginX: '2px', marginTop: '2px', backgroundColor: '#334155' }} />
                ))}
              </>):(<>{toolData.toolItems.map((toolItem, index) => {
              const IconComponent = Icons[toolItem.icon];
              return (
                <div key={index}>
                  <Button
                    size='small'
                    aria-controls={`tool-${toolItem.label}`}
                    aria-haspopup="true"
                    onClick={(event) => handleToolOpen(event, toolItem.subtool, index)}
                    className='text-slate-400 hover:text-slate-100'
                    sx={{
                      '&:hover': {
                        '& .MuiListItemIcon-root': {
                          color: 'white',
                        },
                      },
                    }}
                  >
                    {IconComponent && (
                      <Tooltip title={toolItem.label}>
                        <ListItemIcon className="mr-0" sx={{ minWidth: 0, color:"inherit" }}>
                          <IconComponent sx={{ margin: 0}} className="size-4" />
                        </ListItemIcon>
                      </Tooltip>
                    )}
                  </Button>
                </div>
              );
            })}</>)}
          </ButtonGroup>
        </Box>
      </Container>
    </AppBar>
  );
};

export default ToolBar;
