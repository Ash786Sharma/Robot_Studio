"use client";

import React, { useState, useEffect } from "react";
import {
  Button,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Paper,
  List,
  ListItem,
  ListItemText,
  TextField,
  IconButton,
  Tab,
  Tabs,
  Typography,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  useTheme
} from "@mui/material";
import { FolderOpenRounded } from "@mui/icons-material";

const CreateProj = ({ onOpen, menuClose }) => {
  // State variables for dialogs
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [robotModels, setRobotModels] = useState([]); // List of robot models fetched from the database
  const [selectedRobotModel, setSelectedRobotModel] = useState(""); // Selected robot model
  const [modelMetadata, setModelMetadata] = useState(null);

  const [loading, setLoading] = useState(false); // Circular progress state
  const [alertMessage, setAlertMessage] = useState(null); // Success/Error message
  const [alertSeverity, setAlertSeverity] = useState("success"); // Alert type

  const theme = useTheme();

  const handleOpenCreateDialog = () => {
    setOpenCreateDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenCreateDialog(false);
    setProjectName("");
    setRobotModels([]);
    setSelectedRobotModel("");
    setModelMetadata(null);
    setAlertMessage(null); // Clear alert message
    menuClose();
  };

  // Fetch available robot models from the database
  const fetchAvailableModels = async () => {
    setLoading(true); // Show loading backdrop
    try {
      const response = await fetch("/api/getRobotModels");
      const models = await response.json();
      setRobotModels(models);
      setAlertMessage("Model Loaded");
      setAlertSeverity("success");
    } catch (error) {
      setAlertMessage("Failed to fetch robot models"); // Error message
      setAlertSeverity("error");
      console.error("Failed to fetch robot models:", error);
    } finally {
      setLoading(false); // Hide loading backdrop
    }
  };

  // Handle selecting a robot model for downloading
  const handleModelSelection = async (modelId) => {
    setLoading(true); // Show loading backdrop
    setSelectedRobotModel(modelId);
    try {
      const response = await fetch(`/api/getRobotModelMetadata/${modelId}`, {
        method: "GET"
      });
      const metadata = await response.json();
      //console.log("metadata",metadata);
      setModelMetadata(metadata);
      //console.log(modelMetadata);
      setAlertMessage("Requested Model found");
      setAlertSeverity("success");
    } catch (error) {
      setAlertMessage("Failed to fetch model metadata"); // Error message
      setAlertSeverity("error");
      console.error("Failed to fetch model metadata:", error);
    } finally {
      setLoading(false); // Hide loading backdrop
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    const formData = new FormData();
    formData.append("projectName", projectName);
    formData.append("robotModel", selectedRobotModel); // Selected robot model
    formData.append("robotName", modelMetadata?.robotName);

    try {
      const response = await fetch("/api/createProject", {
        method: "POST",
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }
      const data = await response.json();
      console.log(data);
      setAlertMessage(data.message);
      setAlertSeverity("success");
      setTimeout(() => {
        handleCloseDialog();
      }, 4000);
    } catch (error) {
      setAlertMessage(`Error creating project: ${error.message}`);
      setAlertSeverity("error");
      console.error("Error creating project:", error);
    } finally {
      setLoading(false);
    }
  };

  // Check if upload button should be enabled
  const isSubmitButtonDisabled = !projectName || !selectedRobotModel;

  useEffect(() => {
    if (onOpen) {
      handleOpenCreateDialog();
      fetchAvailableModels();
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
      {/* Dialog for Create Project */}
      <Dialog
        open={openCreateDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Create Project</DialogTitle>
        <DialogContent>
          <Box mt={2}>
            <TextField
              label="Project Name"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              fullWidth
              margin="dense"
            />
            <Select
              value={selectedRobotModel}
              onChange={(e) => handleModelSelection(e.target.value)}
              fullWidth
              displayEmpty
              disabled={loading}
            >
              <MenuItem value="" disabled>
                Select Robot Model
              </MenuItem>
              {robotModels.map((model) => (
                <MenuItem key={model._id} value={model._id}>
                  {model.robotName}
                </MenuItem>
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
                      style={{ maxWidth: "100%", maxHeight: "300px" }}
                    />
                  )}
                </Grid>
                {/* Right: Robot Metadata */}
                <Grid item xs={12} md={8}>
                  <Paper
                    style={{
                      maxHeight: "300px",
                      overflowY: "auto",
                      padding: "10px"
                    }}
                  >
                    <Typography variant="h6">Model Details</Typography>
                    <List>
                      <ListItem>
                        <ListItemText
                          primary="Robot Name"
                          secondary={modelMetadata?.robotName}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText
                          primary="Robot ID"
                          secondary={modelMetadata?._id}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText
                          primary="Creation Date"
                          secondary={modelMetadata?.creationDate}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="Robot Image" />
                      </ListItem>
                      <ListItem>
                        <ListItemText
                          secondary={`Name: ${modelMetadata?.imageName}`}
                        />
                        <ListItemText
                          secondary={`ID: ${modelMetadata?.robotImageId}`}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="Files" />
                      </ListItem>
                      {modelMetadata?.robotFilesNames?.map((name, index) => (
                        <ListItem key={index}>
                          <ListItemText secondary={`Name: ${name}`} />
                          {modelMetadata?.robotFilesId?.[index] && (
                            <ListItemText
                              secondary={`ID: ${modelMetadata.robotFilesId[index]}`}
                            />
                          )}
                        </ListItem>
                      ))}
                      <ListItem>
                        <ListItemText primary="Projects" />
                      </ListItem>
                      {modelMetadata?.projects?.map((project, index) => (
                        <ListItem key={index}>
                          <ListItemText
                            secondary={`Project ${index + 1}: ${project}`}
                          />
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
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleSubmit}
            color="primary"
            disabled={isSubmitButtonDisabled}
          >
            {loading ? <CircularProgress size={24} /> : "Create"}
          </Button>
          <Button onClick={handleCloseDialog}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default CreateProj;
