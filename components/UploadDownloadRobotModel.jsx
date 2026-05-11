import React, { useState, useEffect } from 'react';
import {
  Button, Box, Dialog, DialogTitle, DialogContent, DialogActions, Grid, Paper, List, ListItem, ListItemText,
  TextField, IconButton, Tab, Tabs, Typography, Select, MenuItem, CircularProgress, Alert
} from '@mui/material';
import { FolderOpenRounded } from '@mui/icons-material';

const UploadDownloadRobotModel = ({ onOpen, menuClose, initialTab }) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [robotName, setRobotName] = useState('');
  const [robotFiles, setRobotFiles] = useState([]);
  const [robotImage, setRobotImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [availableModels, setAvailableModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState('');
  const [modelMetadata, setModelMetadata] = useState(null);

  const [loading, setLoading] = useState(false);  // Circular progress state
  const [alertMessage, setAlertMessage] = useState(null);  // Success/Error message
  const [alertSeverity, setAlertSeverity] = useState('success'); // Alert type

  // Delete confirmation state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [confirmDeleteText, setConfirmDeleteText] = useState('');

  // Handle dialog open and close
  const handleDialogOpen = () => setDialogOpen(true);
  const handleDialogClose = () => {
    setDialogOpen(false);
    setRobotName('');
    setRobotFiles([]);
    setRobotImage(null);
    setImagePreview(null);
    setAvailableModels([])
    setSelectedModel('')
    setModelMetadata(null);
    setAlertMessage(null); // Clear alert message
    menuClose();
  };

  const handleDeleteConfirmClose = () =>{
    setAlertMessage(null); // Clear alert message
    setDeleteDialogOpen(false)
    setDialogOpen(false)
    menuClose();
  }

  const handleDeleteConfirm = () =>{
    setAlertMessage(null); // Clear alert message
    setDeleteDialogOpen(true)
    setDialogOpen(false)
    //menuClose();
  }


  // Handle tab change
  const handleTabChange = (_, newValue) => setTabValue(newValue);

  // Handle file selection
  const handleBrowseFiles = async (setFunction) => {
    try {
      const files = await window.showOpenFilePicker({
        multiple: true,
        types: [{ description: 'URDF Files', accept: { 'application/octet-stream': ['.urdf', '.dae', '.stl'] } }],
      });
      const fileArray = await Promise.all(files.map(fileHandle => fileHandle.getFile()));
      setFunction(fileArray);
    } catch (err) {
      console.error('Failed to select files:', err);
    }
  };

  const handleBrowseImage = async () => {
    try {
      const [imageFile] = await window.showOpenFilePicker({
        types: [{ description: 'Image Files', accept: { 'image/*': ['.jpg', '.png', '.jpeg'] } }],
      });
      const file = await imageFile.getFile();
      setRobotImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result); // Set preview URL
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Failed to select image:', err);
    }
  };

  // Handle uploading robot model
  const handleUpload = async () => {
    setLoading(true);
    const formData = new FormData();
    formData.append('robotName', robotName);
    robotFiles.forEach((file) => formData.append('robotFiles', file));
    if (robotImage) formData.append('robotImage', robotImage);

    try {
      const response = await fetch('/api/uploadRobotModel', { method: 'POST', body: formData });
      if (!response.ok) throw new Error(`Error: ${response.statusText}`);
      const data = await response.json();
      setAlertMessage(data.message);
      setAlertSeverity('success');
      setTimeout(() => {
        handleDialogClose();
      }, 4000);
    } catch (error) {
      setAlertMessage(`Error uploading robot model: ${error.message}`);
      setAlertSeverity('error');
    } finally {
      setLoading(false);
    }
  };

  // Fetch available robot models from the database
  const fetchAvailableModels = async () => {
    setLoading(true); // Show loading backdrop
    try {
      const response = await fetch('/api/getRobotModels');
      const models = await response.json();
      setAvailableModels(models);
      setAlertMessage('Model Loaded')
      setAlertSeverity('success')
    } catch (error) {
      setAlertMessage('Failed to fetch robot models');  // Error message
      setAlertSeverity('error');
      console.error('Failed to fetch robot models:', error);
    } finally {
      setLoading(false);  // Hide loading backdrop
    }
  };

  // Handle selecting a robot model for downloading
  const handleModelSelection = async (modelId) => {
    setLoading(true); // Show loading backdrop
    setSelectedModel(modelId);
    try {
      const response = await fetch(`/api/getRobotModelMetadata/${modelId}`, { method: 'GET' });
      const metadata = await response.json();
      //console.log("metadata",metadata);
      setModelMetadata(metadata);
      //console.log(modelMetadata);
      setAlertMessage('Requested Model found')
      setAlertSeverity('success')
    } catch (error) {
      setAlertMessage('Failed to fetch model metadata');  // Error message
      setAlertSeverity('error');
      console.error('Failed to fetch model metadata:', error);
    } finally {
      setLoading(false);  // Hide loading backdrop
    }
  };

  // Handle downloading selected robot model files
  const handleDownload = async () => {
    setLoading(true); // Show loading backdrop
    try {
      const response = await fetch(`/api/downloadRobotModel?modelId=${selectedModel}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${modelMetadata.robotName}_files.zip`);
      document.body.appendChild(link);
      link.click();
      setAlertMessage('Robot model downloaded successfully');  // Success message
      setAlertSeverity('success');
    } catch (error) {
      setAlertMessage('Failed to download robot model');  // Error message
      setAlertSeverity('error');
      console.error('Failed to download robot model:', error);
    } finally {
      setLoading(false);  // Hide loading backdrop
    }
  };

  // Check if upload button should be enabled
  const isUploadButtonDisabled = !robotName || robotFiles.length === 0 || !robotImage;

  // Handle deleting selected robot model
  const handleDelete = async () => {
    setLoading(true); // Show loading backdrop
    try {
      const response = await fetch(`/api/getRobotModelMetadata/${selectedModel}`, { method: 'DELETE' });
      if (!response.ok) throw new Error(`Error: ${response.statusText}`);
      const data = await response.json();
      setAlertMessage(data.message);
      setAlertSeverity('success');
      fetchAvailableModels(); // Refresh the model list
      setTimeout(() => {
        handleDeleteConfirmClose()
      }, 4000); // Reset state after deletion
    } catch (error) {
      setAlertMessage(`Error deleting robot model: ${error.message}`);
      setAlertSeverity('error');
    } finally {
      setLoading(false); // Hide loading backdrop
      setTimeout(() => {
        handleDeleteConfirmClose()
      }, 4000); // Close delete dialog
    }
  };

  // Check if confirm delete button should be enabled
  const isConfirmDeleteEnabled = confirmDeleteText === modelMetadata?.robotName;


  useEffect(() => {
    if (onOpen) {
      if (initialTab === 'Upload') setTabValue(0);
      else if (initialTab === 'Download') {setTabValue(1);
        fetchAvailableModels()
      }
      handleDialogOpen();
    } else {
      handleDialogClose();
    }
  }, [onOpen]);

  useEffect(() => {
    if(tabValue === 1){
      fetchAvailableModels()
    }
    
  }, [tabValue])
  

  // Automatically hide alert messages after 4 seconds
  useEffect(() => {
    if (alertMessage) {
      const timeoutId = setTimeout(() => setAlertMessage(null), 4000);
      return () => clearTimeout(timeoutId);
    }
  }, [alertMessage]);

  return (
    <>
      <Dialog open={dialogOpen} onClose={handleDialogClose} maxWidth="md" fullWidth>
        <DialogTitle>Upload/Download Robot Model</DialogTitle>
        <DialogContent>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="Upload Robot Model" />
            <Tab label="Download Robot Model" />
          </Tabs>

          {/* Upload Robot Model Tab */}
          {tabValue === 0 && (
            <Box mt={2}>
              <TextField
                label="Robot Name"
                value={robotName}
                onChange={(e) => setRobotName(e.target.value)}
                fullWidth
                margin="dense"
              />
              <Box display="flex" alignItems="center" mt={2}>
                <TextField
                  label="URDF Files"
                  value={robotFiles.map((file) => file.name).join(', ')}
                  fullWidth
                  disabled
                />
                <IconButton onClick={() => handleBrowseFiles(setRobotFiles)}>
                  <FolderOpenRounded />
                </IconButton>
              </Box>
              <Box display="flex" alignItems="center" mt={2}>
                <TextField
                  label="Robot Image"
                  value={robotImage ? robotImage.name : ''}
                  fullWidth
                  disabled
                />
                <IconButton onClick={handleBrowseImage}>
                  <FolderOpenRounded />
                </IconButton>
              </Box>

              {/* Image Preview */}
              {imagePreview && (
                <Box mt={2} display="flex" justifyContent="center">
                  <img src={imagePreview} alt="Robot Preview" style={{ maxWidth: '100%', maxHeight: '300px' }} />
                </Box>
              )}

              {/* Success/Error Alert */}
              {alertMessage && (
                <Box mt={2}>
                  <Alert severity={alertSeverity}>{alertMessage}</Alert>
                </Box>
              )}
            </Box>
          )}

          {/* Download Robot Model Tab */}
          {tabValue === 1 && (
            <Box mt={2}>
              <Select
                value={selectedModel}
                onChange={(e) => handleModelSelection(e.target.value)}
                fullWidth
                displayEmpty
                disabled={loading}
              >
                <MenuItem value="" disabled>Select Robot Model</MenuItem>
                {availableModels.map((model) => (
                  <MenuItem key={model._id} value={model._id}>{model.robotName}</MenuItem>
                ))}
              </Select>
              {modelMetadata && (
                <Grid container spacing={2} mt={2}>
                {/* Left: Image Preview */}
                <Grid item xs={12} md={4}>
                  {modelMetadata?.imageUrl && (
                    <img
                      src={modelMetadata.imageUrl}
                      alt={`${modelMetadata.robotName} image`}
                      style={{ maxWidth: '100%', maxHeight: '300px' }}
                    />
                  )}
                </Grid>
    
                {/* Right: Robot Metadata */}
                <Grid item xs={12} md={8}>
                  <Paper style={{ maxHeight: '300px', overflowY: 'auto', padding: '10px' }}>
                    <Typography variant="h6">Model Details</Typography>
                    <List>
                      <ListItem>
                        <ListItemText primary="Robot Name" secondary={modelMetadata?.robotName} />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="Robot ID" secondary={modelMetadata?._id} />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="Creation Date" secondary={modelMetadata?.creationDate} />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="Robot Image"/>
                      </ListItem>
                      <ListItem>
                        <ListItemText secondary={`Name: ${modelMetadata?.imageName}`} />
                        <ListItemText secondary={`ID: ${modelMetadata?.robotImageId}`} />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="Files" />
                      </ListItem>
                        {modelMetadata?.robotFilesNames?.map((name, index) => (
                          <ListItem key={index}>
                            <ListItemText secondary={`Name: ${name}`} />
                            {modelMetadata?.robotFilesId?.[index] && (
                              <ListItemText secondary={`ID: ${modelMetadata.robotFilesId[index]}`} />
                            )}
                          </ListItem>
                        ))}
                      <ListItem>
                        <ListItemText primary="Projects" />
                      </ListItem>
                        {modelMetadata?.projects?.map((project, index) => (
                          <ListItem key={index}>
                            <ListItemText secondary={`Project ${index + 1}: ${project}`} />
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
          {tabValue === 0 && (
            <Button onClick={handleUpload} color="primary" disabled={isUploadButtonDisabled}>
              {loading ? <CircularProgress size={24} /> : 'Upload'}
            </Button>
          )}
          {tabValue === 1 && 
          <><Button onClick={handleDeleteConfirm} color="primary" disabled={!selectedModel}>
          Delete </Button>
        <Button onClick={handleDownload} color="primary" disabled={!selectedModel}>
        {loading ? <CircularProgress size={24} /> : 'Download'} </Button></>
          }
          <Button onClick={handleDialogClose} color="secondary">Close</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleDeleteConfirmClose}>
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the model: <strong>{modelMetadata?.robotName}</strong> ? Please type the exact name to confirm.
          </Typography>
          <TextField
            label="Confirm Model Name"
            value={confirmDeleteText}
            onChange={(e) => setConfirmDeleteText(e.target.value)}
            fullWidth
            margin="dense"
          />
          {/* Success/Error Alert */}
          {alertMessage && (
              <Box mt={2}>
                <Alert severity={alertSeverity}>{alertMessage}</Alert>
              </Box>
            )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteConfirmClose} color="secondary">
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
            color="error"
            variant="contained"
            disabled={!isConfirmDeleteEnabled || loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Confirm Delete'}
          </Button> 
          
        </DialogActions>
      </Dialog>
    </>
  );
};

export default UploadDownloadRobotModel;
