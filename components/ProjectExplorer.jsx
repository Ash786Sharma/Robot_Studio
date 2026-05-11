// ProjectExplorer.js
import React, { useEffect, useState } from "react";
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  useTheme,
  Divider
} from "@mui/material";
import { Close } from "@mui/icons-material";
import Explorer from "./Explorer";
import KinematicProperty from "./KinematicProperty";
import JogControls from "./JogControls";

const ProjectExplorer = ({
  open,
  drawerName,
  onClose,
  onFileClick,
  fileStatuses
}) => {
  const theme = useTheme();

  return (
    <Drawer
      anchor="left"
      variant="persistent"
      open={open}
      sx={{ position: "relative" }}
      PaperProps={{
        sx: {
          width: 350,
          height: "calc(100% - 93px)",
          left: "50px",
          top: "68px",
          backgroundColor: theme.palette.background.tertiary,
          color: theme.palette.text.secondary,
          transition: "width 0.2s ease",
          overflowY: "auto",
          overflowX: "hidden",
          scrollbarWidth: "thin"
        }
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "8px"
        }}
      >
        <Typography variant="h6">{drawerName}</Typography>
        <IconButton onClick={onClose}>
          <Close />
        </IconButton>
      </Box>
      <Divider />
      {drawerName === "Project Explorer" && (
        <Box sx={{ width: 350 }}>
          <Box sx={{ height: "100%", padding: 0 }}>
            <Explorer onFileClick={onFileClick} fileStatuses={fileStatuses} />
          </Box>
        </Box>
      )}

      {drawerName === "Kinematic Property" && <KinematicProperty />}

      {drawerName === "JOG Controls" && <JogControls />}
    </Drawer>
  );
};

export default ProjectExplorer;
