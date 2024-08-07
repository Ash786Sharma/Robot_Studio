'use client';

import React, { useState, useEffect, useRef } from 'react';
import { AppBar, Toolbar, Button, Menu, Container, ButtonGroup, Typography, Box, ListItemIcon, ListItemText, Skeleton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, IconButton, Input } from '@mui/material';
import { SmartToyRounded , FolderOpenRounded} from '@mui/icons-material';
import * as Icons from '@mui/icons-material';
import NestedMenuItem from './NestedMenuItem';

const MenuBar = () => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [currentMenu, setCurrentMenu] = useState([]);
  const [menuIndex, setMenuIndex] = useState(null);
  const [menuData, setMenuData] = useState({ menuItems: [] });
  const [loading, setLoading] = useState(true);

  // State variables for dialogs
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [openOpenDialog, setOpenOpenDialog] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [projectPath, setProjectPath] = useState('');
  const [urdfFolder, setUrdfFolder] = useState('');
  const [selectedProject, setSelectedProject] = useState('');

  // Refs for hidden file inputs
  const projectPathInputRef = useRef(null);
  const urdfFolderInputRef = useRef(null);
  const selectedProjectInputRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/menuBar');
        if (!res.ok) {
          throw new Error('Failed to fetch menubar data');
        }
        const data = await res.json();
        setMenuData(data);
        setCurrentMenu(data.menuItems);
        setLoading(false);
      } catch (error) {
        console.log(error.message);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleMenuOpen = (event, menuItems, index) => {
    setAnchorEl(event.currentTarget);
    setCurrentMenu(menuItems);
    setMenuIndex(index);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuIndex(null);
  };

  const handleOpenCreateDialog = () => {
    setOpenCreateDialog(true);
    handleMenuClose();
  };

  const handleOpenOpenDialog = () => {
    setOpenOpenDialog(true);
    handleMenuClose();
  };

  const handleCloseDialog = () => {
    setOpenCreateDialog(false);
    setOpenOpenDialog(false);
    setProjectName('');
    setProjectPath('');
    setUrdfFolder('');
    setSelectedProject('');
  };

  const handleMenuItemClick = (label) => {
    if (label === 'Create Project') {
      handleOpenCreateDialog();
    } else if (label === 'Open Project') {
      handleOpenOpenDialog();
    }
  };

  const handleBrowsefolder = async (setter) => {
    try {
      const directoryHandle = await window.showDirectoryPicker();
      console.log(directoryHandle);
      setter(directoryHandle.name);
      // setter(directoryHandle.kind); // Use this to get the type (file or directory)
    } catch (err) {
      console.error('Failed to select directory:', err);
    }
  };
  const handleBrowsefile = async (setter) => {
    try {
      const fileHandle = await window.showOpenFilePicker();
      console.log(fileHandle);
      setter(fileHandle.name);
      // setter(directoryHandle.kind); // Use this to get the type (file or directory)
    } catch (err) {
      console.error('Failed to select directory:', err);
    }
  };

  const handleFileChange = (setter) => (event) => {
    if (event.target.files.length>0) {
      console.log(event.target.files[0]);
      console.log(event.target.files[0].webkitRelativePath.split('/')[0]);
      setter(event.target.files[0].webkitRelativePath.split('/')[0]); // Depending on your environment, you might need to use a different attribute
    }
  };

  return (
    <>
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1, backgroundColor: '#0f172a', color: '#64748b' }} className=' bg-slate-900 text-slate-500 drop-shadow-lg'>
        <Container maxWidth="xl" sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <SmartToyRounded className='m-2' />
          <Typography
            variant="h6"
            noWrap
            component="a"
            href="#app-bar-with-responsive-menu"
            sx={{
              mr: 2,
              display: { xs: 'none', md: 'flex' },
              fontFamily: 'monospace',
              fontWeight: 700,
              letterSpacing: '.3rem',
              color: 'inherit',
              textDecoration: 'none',
            }}
          >
            ROBOT STUDIO
          </Typography>
          <Box sx={{ flexGrow: 1 }}>
            <ButtonGroup variant='text'>
              {loading ? (
                <>
                  {[...Array(4)].map((_, index) => (
                    <Skeleton key={index} variant="rounded" animation="wave" width={100} height={30} sx={{ marginX: '1px', marginTop: '5px', backgroundColor: '#334155' }} />
                  ))}
                </>
              ) : (
                menuData.menuItems.map((menuItem, index) => {
                  const IconComponent = Icons[menuItem.icon];
                  return (
                    <div key={index}>
                      <Button
                        size='small'
                        aria-controls={`menu-${menuItem.label}`}
                        aria-haspopup="true"
                        onClick={(event) => handleMenuOpen(event, menuItem.submenu || [], index)}
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
                          <ListItemIcon className="mr-1" sx={{ minWidth: 0, color:"inherit" }}>
                            <IconComponent sx={{ margin: 0}} />
                          </ListItemIcon>
                        )}
                        <ListItemText primary={menuItem.label} sx={{ margin: 0 }} />
                      </Button>
                      <Menu
                        id={`menu-${menuItem.label}`}
                        anchorEl={menuIndex === index ? anchorEl : null}
                        open={menuIndex === index && Boolean(anchorEl)}
                        onClose={handleMenuClose}
                        anchorOrigin={{
                          vertical: 'bottom',
                          horizontal: 'left',
                        }}
                        transformOrigin={{
                          vertical: 'top',
                          horizontal: 'left',
                        }}
                        disableAutoFocusItem
                      >
                        {currentMenu && currentMenu.map((subMenuItem, subIndex) => (
                          <NestedMenuItem
                            key={subIndex}
                            menuItem={subMenuItem}
                            parentHandleClose={handleMenuClose}
                            onMenuItemClick={handleMenuItemClick}
                          />
                        ))}
                      </Menu>
                    </div>
                  );
                })
              )}
            </ButtonGroup>
          </Box>
        </Container>
      </AppBar>

      {/* Dialog for Create Project */}
      <Dialog open={openCreateDialog} onClose={handleCloseDialog}>
        <DialogTitle>Create Project</DialogTitle>
        <DialogContent>
          <TextField
            label="Project Name"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            fullWidth
            margin="dense"
          />
          <Box display="flex" alignItems="center" marginTop={2}>
            <TextField
              label="Project Path"
              value={projectPath}
              onChange={(e) => setProjectPath(e.target.value)}
              fullWidth
            />
            <IconButton onClick={()=>handleBrowsefolder(setProjectPath)}>
              <FolderOpenRounded />
            </IconButton>
          </Box>
          <Box display="flex" alignItems="center" marginTop={2}>
            <TextField
              label="URDF Folder"
              value={urdfFolder}
              onChange={(e) => setUrdfFolder(e.target.value)}
              fullWidth
            />
            
            <IconButton onClick={()=>handleBrowsefile(setUrdfFolder)} >
              <FolderOpenRounded />
            </IconButton>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleCloseDialog}>Create</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog for Open Project */}
      <Dialog open={openOpenDialog} onClose={handleCloseDialog}>
        <DialogTitle>Open Project</DialogTitle>
        <DialogContent>
        <TextField
              label="Project Path"
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              fullWidth
              margin="dense"
            />
            
            <IconButton >
              <FolderOpenRounded onClick={()=>handleBrowsefile(setSelectedProject)} />
            </IconButton>

        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleCloseDialog}>Open</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default MenuBar;
