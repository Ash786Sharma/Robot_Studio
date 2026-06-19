"use client";

import React, { useEffect, useState } from "react";
import { Box, Typography, useTheme } from "@mui/material";
import MenuBar from "./MenuBar";
import ToolBar from "./ToolBar";
import MainDrawer from "./MainDrawer";
import TabWrapper from "./TabWrapper";

const Layout = ({ themeMode, setThemeMode }) => {
  const theme = useTheme();
  const [mainDrawerData, setMainDrawerData] = useState({ mainDrawerItems: [] });
  const [loading, setLoading] = useState(true);
  const [selectedDrawerContent, setSelectedDrawerContent] = useState(null); // Track selected content
  const [openTabs, setOpenTabs] = useState([]);
  const [activeTab, setActiveTab] = useState(null);
  const [fileStatuses, setFileStatuses] = useState({});
  const [editorLoading, setEditorLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/mainDrawer");
        if (!res.ok) {
          throw new Error("Failed to fetch mainDrawer data");
        }
        const data = await res.json();
        setMainDrawerData(data);
        setLoading(false);
      } catch (error) {
        console.log(error.message);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleDrawerClose = () => {
    setSelectedDrawerContent(null);
  };

  const handleDrawerSelection = (contentLabel) => {
    setSelectedDrawerContent(contentLabel);
  };

  const calculateDrawerWidth = () => {
    return selectedDrawerContent ? 43.75 : 0; // Adjust based on drawer width
  };

  const handleFileClick = async (filePath, fileName) => {
    try {
      //console.log("File Clicked", fileName, filePath);
      setEditorLoading(true);
      const existingTab = openTabs.find((tab) => tab.id === filePath);
      const fileType = filePath.endsWith(".rprg") ? "rprg" : "rgprg";

      if (existingTab) {
        // Tab already open
        setActiveTab(filePath); // Just switch to the existing tab
        setEditorLoading(false);
        return; // Prevent re-fetching
      }
      if (fileName === "Welcome") {
        const newTab = {
          id: filePath,
          label: fileName,
          type: "rprg",
          content:
            "//WELCOME TO ROBOT STUDIO BY ASHWANI SHARMA !!\n//OPEN THE PROJECT FOR GETTING STARTED."
        };
        setOpenTabs([...openTabs, newTab]);
        setActiveTab(filePath);
        setFileStatuses((prev) => ({ ...prev, [filePath]: "green" }));
        setEditorLoading(false);
        return;
      }

      if (fileName === "3D Editor") {
        const newTab = {
          id: filePath,
          label: fileName,
          type: "3d editor"
        };
        setOpenTabs([...openTabs, newTab]);
        setActiveTab(filePath);
        setEditorLoading(false);
        return;
      }

      const response = await fetch("/api/readFile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filePath })
      });
      const data = await response.json();

      if (data.content || data.content === "") {
        //console.log("File Content", data.content);

        const newTab = {
          id: filePath,
          label: fileName,
          type: fileType,
          content: data.content
        };
        setOpenTabs([...openTabs, newTab]);
        setActiveTab(filePath);
        setFileStatuses((prev) => ({ ...prev, [filePath]: "green" }));
        setEditorLoading(false);
      }
    } catch (error) {
      console.error("Error fetching file content:", error);
    }
  };

  const handleSaveFile = async (filePath, content) => {
    try {
      setEditorLoading(true);
      await fetch("/api/writeFile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filePath, content })
      });
      //console.log("File saved successfully");
      setEditorLoading(false);
    } catch (error) {
      console.error("Error saving file:", error);
    }
  };
  const open3dEditor = () => {
    handleFileClick("Robot_Visual", "3D Editor");
    //handleFileClick("graphicalEditorTab", "Graphical Editor");
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <MenuBar
        themeMode={themeMode}
        setThemeMode={setThemeMode}
        open3dEditorTab={open3dEditor}
      />
      <ToolBar />

      <Box sx={{ display: "flex", flexGrow: 1, overflow: "hidden" }}>
        <MainDrawer
          drawerData={mainDrawerData}
          loading={loading}
          onSelectContent={handleDrawerSelection} // Pass the selection handler
          selectedContent={selectedDrawerContent} // Pass the selected content
          onClose={handleDrawerClose}
          onFileClick={handleFileClick} // Pass handleFileClick to MainDrawer
          fileStatuses={fileStatuses}
        />

        <Box
          sx={{
            flexGrow: 1,
            transition: "margin 0.2s ease, width 0.2s ease",
            ml: calculateDrawerWidth(),
            mt: 8.5,
            p: 0,
            backgroundColor: theme.palette.background.paper,
            overflow: "auto"
          }}
        >
          <TabWrapper
            tabs={openTabs}
            setTabs={setOpenTabs}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onSaveFile={handleSaveFile}
            setFileStatuses={setFileStatuses}
            editorLoading={editorLoading}
            themeMode={themeMode}
          />
        </Box>
      </Box>
      <Box
        sx={{
          display: "flex",
          flexGrow: 1,
          overflow: "hidden",
          backgroundColor: "blue",
          maxHeight: "25px",
          minHeight: "25px"
        }}
      >
        <Typography>Footer</Typography>
      </Box>
    </Box>
  );
};

export default Layout;
