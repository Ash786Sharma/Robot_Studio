"use client";
import React, { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import Cookies from "js-cookie";
import FileTreeMod from "./FileTreeMod";
import { Box, CircularProgress } from "@mui/material";

const Explorer = ({ onFileClick, fileStatuses }) => {
  const defaultFolder = {
    id: uuidv4(),
    type: "file",
    name: "Welcome",
    path: uuidv4(),
    children: []
  };

  const [fileTree, setFileTree] = useState([]);
  const [projectName, setProjectName] = useState(null); // Track project name from cookie
  const [loding, setLoading] = useState(false);

  // Fetch project file structure
  const fetchFileStructure = async (project) => {
    try {
      const response = await fetch("/api/files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectName: project })
      });
      const data = await response.json();

      if (data.fileStructure) {
        setFileTree(data.fileStructure);
        setLoading(false);
      } else {
        console.error("File structure not found, using default.");
        setFileTree([defaultFolder]);
        setLoading(false);
      }
    } catch (error) {
      console.error("Error fetching file structure:", error);
      setFileTree([defaultFolder]);
      setLoading(false);
    }
  };

  // Sync file structure with API
  const syncFileStructure = async (updatedStructure) => {
    try {
      const response = await fetch("/api/updateFileTree", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileStructure: updatedStructure })
      });
      if (!response.ok) {
        console.error("Failed to sync file structure");
      }
    } catch (error) {
      console.error("Error syncing file structure:", error);
    }
  };

  // Effect to sync file structure when fileTree changes
  useEffect(() => {
    if (fileTree.length > 0 && projectName) {
      //console.log("change in files");

      // Ensure fileTree has data and project name is available
      syncFileStructure(fileTree);
    }
  }, [fileTree, projectName]); // Run effect when fileTree or projectName changes

  // Read cookie and fetch file structure when needed
  useEffect(() => {
    setLoading(true);
    const cookieData = Cookies.get("openProject");

    if (cookieData) {
      try {
        const parsedData = JSON.parse(cookieData);
        const newProjectName = parsedData?.projectName;

        if (newProjectName && newProjectName !== projectName) {
          setProjectName(newProjectName); // Update state
          fetchFileStructure(newProjectName);
        }
      } catch (error) {
        console.error("Error parsing cookie:", error);
        setLoading(false);
      }
    } else if (fileTree.length === 0) {
      setFileTree([defaultFolder]); // No cookie, set default
      setLoading(false);
    }
  }, [projectName]); // Runs when `projectName` changes

  return (
    <>
      {loding ? (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "5vh" // Full viewport height to center
          }}
        >
          <CircularProgress size={24} /> {/* Smaller size */}
        </Box>
      ) : (
        <FileTreeMod
          fileStructure={fileTree}
          setFileStructure={setFileTree}
          onFileClick={onFileClick}
          fileStatuses={fileStatuses}
        />
      )}
    </>
  );
};

export default Explorer;
