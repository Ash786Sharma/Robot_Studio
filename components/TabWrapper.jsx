"use client";

import { useState } from "react";
import {
  Tabs,
  Tab,
  Box,
  Button,
  tabsClasses,
  useTheme,
  Breadcrumbs,
  Link,
  Typography
} from "@mui/material";
import { ReactFlowProvider } from "@xyflow/react";
import CloseIcon from "@mui/icons-material/Close";
import Editor from "./Editor";
import RobotVisual from "./RobotVisual";
import { styled } from "@mui/material/styles";
import GraphEditor from "./GraphEditor";

const TabWrapper = ({
  tabs,
  setTabs,
  activeTab,
  setActiveTab,
  onSaveFile,
  setFileStatuses,
  editorLoading,
  themeMode
}) => {
  const theme = useTheme();

  const CloseButton = styled(CloseIcon)({
    fontSize: "20px",
    cursor: "pointer",
    marginLeft: "4px",
    padding: "2px", // Add padding to increase hit area
    color: theme.palette.text.secondary,
    "&:hover": {
      color: theme.palette.text.primary
    }
  });

  const handleTabChange = (e, newValue) => {
    setActiveTab(newValue);
  };

  const handleTabClose = (id) => {
    const filteredTabs = tabs.filter((tab) => tab.id !== id);
    setTabs(filteredTabs);
    if (filteredTabs.length > 0) {
      setActiveTab(filteredTabs[filteredTabs.length - 1].id);
    } else {
      setActiveTab(null);
    }
  };

  const handleEditorChange = (id, newValue) => {
    setTabs(
      tabs.map((tab) => (tab.id === id ? { ...tab, content: newValue } : tab))
    );
    //update file status
    const currentTab = tabs.find((tab) => tab.id === id);
    if (currentTab && currentTab.content !== newValue) {
      setFileStatuses((prev) => ({ ...prev, [id]: "yellow" }));
    } else {
      setFileStatuses((prev) => ({ ...prev, [id]: "green" }));
    }
  };

  const handleSave = (id, content) => {
    onSaveFile(id, content);
    setFileStatuses((prev) => ({ ...prev, [id]: "green" }));
  };

  return (
    <Box
      sx={{
        flexGrow: 1,
        display: "flex",
        flexDirection: "column",
        height: "100%"
      }}
    >
      <Tabs
        value={activeTab}
        onChange={handleTabChange}
        variant="scrollable"
        scrollButtons="auto"
        sx={{
          [`& .${tabsClasses.scrollButtons}`]: {
            "&.Mui-disabled": { opacity: 0.3 }
          },
          "& .MuiTabs-indicator": {
            height: "2px",
            backgroundColor: theme.palette.primary.main,
            top: 0
          },
          backgroundColor: theme.palette.background.secondary,
          borderBottom: `1px solid ${theme.palette.background.quaternary}`,
          minHeight: "35px",
          height: "35px"
        }}
      >
        {tabs.map((tab) => (
          <Tab
            key={tab.id}
            value={tab.id}
            sx={{
              "&.Mui-selected": {
                color: theme.palette.text.primary,
                backgroundColor: theme.palette.background.quaternary
              },
              "&:hover": {
                backgroundColor: theme.palette.background.quaternary,
                color: theme.palette.text.primary
              },
              textTransform: "none",
              minHeight: "35px",
              height: "35px",
              color: theme.palette.text.secondary,
              fontSize: "0.85rem",
              fontWeight: "400",
              padding: "0 12px",
              transition: "background 0.2s"
            }}
            label={
              <Box sx={{ display: "flex", alignItems: "center" }}>
                {tab.label}
                <CloseButton
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTabClose(tab.id);
                  }}
                />
              </Box>
            }
          />
        ))}
      </Tabs>

      {tabs.map((tab) =>
        activeTab === tab.id ? (
          tab.type === "rprg" ? (
            <Box
              key={tab.id}
              sx={{
                flexGrow: 1,
                display: "flex",
                flexDirection: "column"
              }}
            >
              <Breadcrumbs
                aria-label="breadcrumb"
                sx={{
                  backgroundColor: theme.palette.background.secondary
                }}
              >
                <Typography
                  sx={{
                    m: 0.5,
                    pl: 1.5,

                    fontSize: "14px",
                    color: theme.palette.text.secondary,
                    "&:hover": { color: theme.palette.text.primary }
                  }}
                >
                  {tab.id}
                </Typography>
              </Breadcrumbs>
              <Editor
                key={tab.id}
                value={tab.content}
                onChange={(newValue) => handleEditorChange(tab.id, newValue)}
                onSaveFile={() => handleSave(tab.id, tab.content)}
                editorLoading={editorLoading}
                themeMode={themeMode}
              />
            </Box>
          ) : tab.type === "3d editor" ? (
            <RobotVisual key={tab.id} />
          ) : tab.type === "rgprg" ? (
            <ReactFlowProvider key={tab.id}>
              <GraphEditor
                content={tab.content}
                onChange={(newValue) => handleEditorChange(tab.id, newValue)}
                onSaveFile={() => handleSave(tab.id, tab.content)}
              />
            </ReactFlowProvider>
          ) : null
        ) : null
      )}
    </Box>
  );
};

export default TabWrapper;
