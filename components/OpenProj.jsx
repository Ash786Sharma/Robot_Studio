'use client';

import React, { useState, useEffect } from 'react';
import { Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, IconButton, Tabs, Tab, Select, Box, MenuItem, List, ListItem, ListItemText, Grid, Paper, CircularProgress, Typography } from '@mui/material';
import { FolderOpenRounded } from '@mui/icons-material';
import Alert from '@mui/material/Alert';

const OpenProj = ({ onOpen, menuClose }) => {
  const [openOpenDialog, setOpenOpenDialog] = useState(false);
  const [tabValue, setTabValue] = useState(0);

  const [loading, setLoading] = useState(false);
  const [alertMessage, setAlertMessage] = useState(null);
  const [alertSeverity, setAlertSeverity] = useState('success');

  const [projectFile, setProjectFile] = useState(null);
  const [parsedProjectData, setParsedProjectData] = useState(null);

  const [availableProjects, setAvailableProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [projectMetadata, setProjectMetadata] = useState(null);

  // Fetch available projects from the database on component mount
  const fetchProjects = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/getProjects'); // Replace with actual API route
      const data = await res.json();
      //console.log(data);
      
      setAvailableProjects(data);
      //console.log(availableProjects);
      
      setAlertMessage(`Projects Loaded`);
      setAlertSeverity('success');
      setLoading(false);
    } catch (error) {
      setAlertMessage(`Failed to load projects`);
      setAlertSeverity('error');
      setLoading(false);
    }
  };
 
  // Handle tab change
  const handleTabChange = (_, newValue) => {setTabValue(newValue)
    setAlertMessage(null)
  };

  // Open the dialog
  const handleOpenOpenDialog = () => setOpenOpenDialog(true);

  // Handle project selection from database
  const handleProjectSelection = async (projectId, projectdata, type) => {
    //console.log(projectId, projectdata, type);
    setSelectedProject(type === "local" ? projectdata?.projectId : projectId);
    //console.log(selectedProject);
    
    let project = {
      projectId: type === "local" ? null : projectId,
      projectData: type === "local"? projectdata : null,
    }
    //console.log(project);
    
    setLoading(true);
    try {
      const res = await fetch(`/api/getProjectMetadata`,{
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(project),
      });
      const projectData = await res.json();
      setProjectMetadata(projectData);
      setAlertMessage(`Project details Loaded`);
      setAlertSeverity('success');
      setLoading(false);
    } catch (error) {
      setAlertMessage('Failed to load project details');
      setAlertSeverity('error');
      setLoading(false);
    }
  };

  // Handle file picker for local project file
  const handleBrowseProject = async () => {
    try {
      const [fileHandle] = await window.showOpenFilePicker({
        types: [{ description: 'Project Files', accept: { 'application/octet-stream': ['.rbst'] } }],
      });
      const file = await fileHandle.getFile();
      setProjectFile(file);

      // Read the file content and parse it (assuming JSON for now)
      const fileContent = await file.text(); // For JSON, can use JSON.parse(fileContent)
      const parsedData = await JSON.parse(fileContent);
      setParsedProjectData(parsedData)
      await handleProjectSelection(null, parsedData, 'local');
      setAlertMessage(`Project files selected`);
      setAlertSeverity('success');
      
    } catch (err) {
      console.error('Failed to select project file:', err);
      setAlertMessage('Failed to select project file');
      setAlertSeverity('error');
    }
  };

  // Handle sending project ID to the backend to create the project locally
  const handleOpenProject = async () => {
    let projectId;
    let projectName
    let tabType
    if (tabValue === 0 && selectedProject) {
      projectId = selectedProject;
      projectName = projectMetadata.projectName;
      tabType = 'database';
      //console.log(projectId);
    } else if (tabValue === 1 && parsedProjectData) {
      projectId = parsedProjectData.projectId;
      projectName = parsedProjectData.projectName;
      tabType = 'local';
      //console.log(projectId);
    }
    //console.log(projectId, projectName, tabType);
    
    if (projectId && projectName && tabType) {
      setLoading(true);
      try {
        // Call the API to create the project locally
        //console.log('TabType:', tabType);
        //console.log(JSON.stringify({ projectId, projectName, tabType }));
        
       const res = await fetch(`/api/openProject`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ projectId, projectName, tabType }),
        });
        if (res.status === 200) {
          setAlertSeverity('success');
          setAlertMessage(`${res.message}`);
          setLoading(false);
          handleCloseDialog();
        }else{
          setAlertMessage(`${res.message}`);
          setAlertSeverity('error');
          setLoading(false);
        }
      } catch (error) {
        console.log(error);
        
        setAlertMessage('Failed to open project');
        setAlertSeverity('error');
        setLoading(false);
      }
    }
  };

  // Close dialog
  const handleCloseDialog = () => {
    setOpenOpenDialog(false);
    setSelectedProject('');
    setParsedProjectData(null);
    setAlertMessage(null)
    menuClose();
  };

  useEffect(() => {
    if (onOpen) {
      handleOpenOpenDialog();
      fetchProjects()
    } else {
      handleCloseDialog(); // Close if onOpen becomes false
    }
  }, [onOpen]);

  // Automatically hide alert messages after 4 seconds
  useEffect(() => {
    if (alertMessage) {
      const timeoutId = setTimeout(() => setAlertMessage(null), 4000);
      return () => clearTimeout(timeoutId);
    }
  }, [alertMessage]);

  return (
    <>
      <Dialog open={openOpenDialog} onClose={handleCloseDialog}>
        <DialogTitle>Open Project</DialogTitle>
        <DialogContent>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="Database Project" />
            <Tab label="Local Project" />
          </Tabs>

          {/* Open Database Project Tab */}
          {tabValue === 0 && (
            <Box mt={2}>
              <Select
                value={selectedProject}
                onChange={(e) => {handleProjectSelection(e.target.value, null, 'database')}}
                fullWidth
                displayEmpty
                disabled={loading}
              >
                <MenuItem value="" disabled>Select Project</MenuItem>
                {availableProjects.map((Project) => (
                  <MenuItem key={Project.projectId} value={Project.projectId}>
                    {Project.projectName}
                  </MenuItem>
                ))}
              </Select>

              {projectMetadata && (
                <Grid container spacing={2} mt={2}>
                  <Grid item xs={12} md={4}>
                    {projectMetadata?.imageUrl && (
                      <img
                        src={projectMetadata.imageUrl}
                        alt={`${projectMetadata.robotName} image`}
                        style={{ maxWidth: '100%', maxHeight: '300px' }}
                      />
                    )}
                  </Grid>

                  <Grid item xs={12} md={8}>
                    <Paper style={{ maxHeight: '300px', overflowY: 'auto', padding: '10px' }}>
                      <Typography variant="h6">Project Details</Typography>
                      <List>
                        <ListItem>
                          <ListItemText primary="Project Name: " secondary={projectMetadata?.projectName} />
                        </ListItem>
                        <ListItem>
                          <ListItemText primary="Creation Date: " secondary={new Date(projectMetadata?.creationDate).toLocaleString()} />
                        </ListItem>
                        <ListItem>
                          <ListItemText primary="Robot Name: " secondary={projectMetadata?.robotName} />
                        </ListItem>
                        <ListItem>
                          <ListItemText primary="Robot ID: " secondary={projectMetadata?.robotId} />
                        </ListItem>
                        <ListItem>
                          <ListItemText primary="Updated Date: " secondary={new Date(projectMetadata?.updatedDate).toLocaleString()} />
                        </ListItem>
                        <ListItem>
                          <ListItemText primary="Overall Hash: " secondary={projectMetadata?.overallHash} />
                        </ListItem>
                        <ListItem>
                          <ListItemText primary="Program Files: " />
                        </ListItem>
                        {projectMetadata?.programFiles?.map((file, index) => (
                          <ListItem key={index}>
                           <Grid container spacing={0.5}>
                              <Grid item xs={12}>
                                <ListItemText primary={`${file.name}: `} />
                              </Grid>
                              <Grid item xs={12}>
                                <ListItemText secondary={`File ID: ${file.id}`} />
                              </Grid>
                              <Grid item xs={12}>
                                <ListItemText secondary={`File Hash: ${file.hash}`} />
                              </Grid>
                            </Grid>
                          </ListItem>
                        ))}
                      </List>
                    </Paper>
                  </Grid>
                </Grid>
              )}
              {/* Success/Error Alert */}
              {alertMessage && (
                <Box mt={2}>
                  <Alert severity={alertSeverity}>{alertMessage}</Alert>
                </Box>
              )}
            </Box>
          )}

          {/* Open Local Project Tab */}
          {tabValue === 1 && (
            <Box mt={2}>
              <Box display="flex" alignItems="center" mt={2}>
                <TextField
                  label="Select Project"
                  value={projectFile ? projectFile.name : ''}
                  fullWidth
                  disabled
                />
                <IconButton onClick={handleBrowseProject}>
                  <FolderOpenRounded />
                </IconButton>
              </Box>

              {projectMetadata && (
                <Grid container spacing={2} mt={2}>
                  <Grid item xs={12} md={4}>
                    {projectMetadata?.imageUrl && (
                      <img
                        src={projectMetadata.imageUrl}
                        alt={`${projectMetadata.robotName} image`}
                        style={{ maxWidth: '100%', maxHeight: '300px' }}
                      />
                    )}
                  </Grid>

                  <Grid item xs={12} md={8}>
                    <Paper style={{ maxHeight: '300px', overflowY: 'auto', padding: '10px' }}>
                      <Typography variant="h6">Project Details</Typography>
                      <List>
                        <ListItem>
                          <ListItemText primary="Project Name: " secondary={projectMetadata?.projectName} />
                        </ListItem>
                        <ListItem>
                          <ListItemText primary="Creation Date: " secondary={new Date(projectMetadata?.creationDate).toLocaleString()} />
                        </ListItem>
                        <ListItem>
                          <ListItemText primary="Robot Name: " secondary={projectMetadata?.robotName} />
                        </ListItem>
                        <ListItem>
                          <ListItemText primary="Robot ID: " secondary={projectMetadata?.robotId} />
                        </ListItem>
                        <ListItem>
                          <ListItemText primary="Updated Date: " secondary={new Date(projectMetadata?.updatedDate).toLocaleString()} />
                        </ListItem>
                        <ListItem>
                          <ListItemText primary="Overall Hash: " secondary={projectMetadata?.overallHash} />
                        </ListItem>
                        <ListItem>
                          <ListItemText primary="Program Files: " />
                        </ListItem>
                        {projectMetadata?.programFiles?.map((file, index) => (
                          <ListItem key={index}>
                           <Grid container spacing={0.5}>
                              <Grid item xs={12}>
                                <ListItemText primary={`${file.name}: `} />
                              </Grid>
                              <Grid item xs={12}>
                                <ListItemText secondary={`File ID: ${file.id}`} />
                              </Grid>
                              <Grid item xs={12}>
                                <ListItemText secondary={`File Hash: ${file.hash}`} />
                              </Grid>
                            </Grid>
                          </ListItem>
                        ))}
                      </List>
                    </Paper>
                  </Grid>
                </Grid>
              )}
              {/* Success/Error Alert */}
              {alertMessage && (
                <Box mt={2}>
                  <Alert severity={alertSeverity}>{alertMessage}</Alert>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={handleCloseDialog} color="primary">
            Cancel
          </Button>
          <Button onClick={handleOpenProject} color="primary" disabled={!selectedProject && !parsedProjectData}>
          {loading ? <CircularProgress size={24} /> : 'Open'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default OpenProj;
