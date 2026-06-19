"use client";

import React, { useState, useEffect, use } from "react";
import {
  Button,
  ButtonGroup,
  Box,
  ListItemIcon,
  Tooltip,
  Skeleton,
  useTheme,
  colors
} from "@mui/material";
import * as Icons from "@mui/icons-material";
import CreateProj from "./CreateProj";
import OpenProj from "./OpenProj";
import UploadDownloadRobotModel from "./UploadDownloadRobotModel";

const ToolBarButtons = () => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [currentTool, setCurrentTool] = useState("");
  const [toolIndex, setToolIndex] = useState(null);
  const [toolData, setToolData] = useState({ toolItems: [] });
  const [loading, setLoading] = useState(true);
  const [toolOpen, setToolOpen] = useState(false);
  const theme = useTheme();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/toolBar");
        if (!res.ok) {
          throw new Error("Failed to fetch menubar data");
        }
        const data = await res.json();
        setToolData(data);
        //console.log(data.toolItems[0]);

        //setCurrentTool(data.toolItems);
        //console.log(currentTool);
        setLoading(false); // Set loading to false after data is fetched
      } catch (error) {
        console.log(error.message);
        setLoading(false); // Set loading to false even if there's an error
      }
    };

    fetchData();
  }, []);

  const handleToolOpen = (event, toolItem, index) => {
    setAnchorEl(event.currentTarget);
    setCurrentTool(toolItem);
    //console.log(toolItem);
    setToolIndex(index);
    //console.log(index);
  };

  const renderToolComponent = () => {
    switch (currentTool) {
      case "Create Project":
        return (
          <CreateProj onOpen={true} menuClose={() => setCurrentTool("")} />
        );
      case "Open Project":
        return <OpenProj onOpen={true} menuClose={() => setCurrentTool("")} />;
      case "Upload/Download Robot Model":
        return (
          <UploadDownloadRobotModel
            onOpen={true}
            menuClose={() => setCurrentTool("")}
          />
        );
      default:
        return null;
    }
  };

  return (
    <>
      <Box sx={{ flexGrow: 1 }}>
        <ButtonGroup variant="text">
          {loading ? ( // Display skeletons while loading
            <>
              {[...Array(14)].map((_, index) => (
                <Skeleton
                  key={index}
                  variant="rounded"
                  animation="wave"
                  width={40}
                  height={10}
                  sx={{
                    marginX: "2px",
                    marginTop: "2px",
                    backgroundColor: theme.palette.background.quaternary
                  }}
                />
              ))}
            </>
          ) : (
            <>
              {toolData.toolItems.map((toolItem, index) => {
                const IconComponent = Icons[toolItem.icon];
                return (
                  <div key={index}>
                    {IconComponent && (
                      <Tooltip title={toolItem.label}>
                        <Button
                          size="small"
                          aria-controls={`tool-${toolItem.label}`}
                          aria-haspopup="true"
                          onClick={(event) =>
                            handleToolOpen(event, toolItem.label, index)
                          }
                          sx={{
                            color: theme.palette.text.secondary,
                            "&:hover": {
                              "& .MuiListItemIcon-root": {
                                color: theme.palette.text.primary
                              }
                            }
                          }}
                        >
                          <ListItemIcon sx={{ minWidth: 0, color: "inherit" }}>
                            <IconComponent sx={{ margin: 0, fontSize: 20 }} />
                          </ListItemIcon>
                        </Button>
                      </Tooltip>
                    )}
                  </div>
                );
              })}
            </>
          )}
        </ButtonGroup>
      </Box>
      {renderToolComponent()}
    </>
  );
};

export default ToolBarButtons;
