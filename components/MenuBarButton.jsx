"use client";

import { useState, useEffect } from "react";
import {
  Button,
  Menu,
  ButtonGroup,
  Box,
  ListItemIcon,
  ListItemText,
  Skeleton,
  useTheme
} from "@mui/material";
import * as Icons from "@mui/icons-material";
import NestedMenuItem from "./NestedMenuItem";
import CreateProj from "./CreateProj";
import OpenProj from "./OpenProj";
import UploadDownloadRobotModel from "./UploadDownloadRobotModel";
const MenuBarButton = ({ open3dEditorTab }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [currentMenu, setCurrentMenu] = useState([]);
  const [menuIndex, setMenuIndex] = useState(null);
  const [menuData, setMenuData] = useState({ menuItems: [] });
  const [loading, setLoading] = useState(true);
  const [creatDialog, setCreateDialog] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [uploadDownloadModelDialog, setUploadDownloadModelDialog] =
    useState(false);
  const [uploadDownloadModelTab, setUploadDownloadModelTab] =
    useState("Upload");
  const [menuClose, setMenuClose] = useState(false);
  const theme = useTheme();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/menuBar");
        if (!res.ok) {
          throw new Error("Failed to fetch menubar data");
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

  const handleMenuItemClick = (label) => {
    switch (label) {
      case "createProject":
        setCreateDialog(true);
        break;
      case "openProject":
        setOpenDialog(true);
        break;
      case "saveProject":
        console.log("Save Project clicked");
        // Implement save project logic here
        break;
      case "download":
        console.log("Download clicked");
        // Implement download logic here
        break;
      case "upload":
        console.log("Upload clicked");
        // Implement upload logic here
        break;
      case "uploadRobotModel":
        setUploadDownloadModelTab("Upload");
        setUploadDownloadModelDialog(true);
        break;
      case "downloadRobotModel":
        setUploadDownloadModelTab("Download");
        setUploadDownloadModelDialog(true);
        break;
      case "closeProject":
        console.log("Close Project clicked");
        // Implement close project logic here
        break;
      case "undo":
        console.log("Undo clicked");
        // Implement undo logic here
        break;
      case "redo":
        console.log("Redo clicked");
        // Implement redo logic here
        break;
      case "projectExplorer":
        console.log("Project Explorer clicked");
        // Implement project explorer logic here
        break;
      case "terminal":
        console.log("Terminal clicked");
        // Implement terminal logic here
        break;
      case "3D Editor":
        open3dEditorTab();
        break;
      case "optionsProjectExplorer":
        console.log("Options Project Explorer clicked");
        // Implement options project explorer logic here
        break;
      case "optionsTerminal":
        console.log("Options Terminal clicked");
        // Implement options terminal logic here
        break;
      case "options3DEditor":
        console.log("Options 3D Editor clicked");
        // Implement options 3D editor logic here
        break;
      case "about":
        console.log("About clicked");
        // Implement about logic here
        break;
      case "help":
        console.log("Help clicked");
        // Implement help logic here
        break;
      default:
        console.log(`Unhandled menu item: ${label}`);
    }
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuIndex(null);
    setMenuClose(false);
  };

  useEffect(() => {
    if (menuClose) {
      setCreateDialog(false);
      setOpenDialog(false);
      setUploadDownloadModelDialog(false);
      handleMenuClose();
    }
  }, [menuClose]);

  return (
    <>
      <Box sx={{ flexGrow: 1 }}>
        <ButtonGroup variant="text">
          {loading ? (
            <>
              {[...Array(4)].map((_, index) => (
                <Skeleton
                  key={index}
                  variant="rounded"
                  animation="wave"
                  width={100}
                  height={30}
                  sx={{
                    marginX: "1px",
                    marginTop: "5px",
                    backgroundColor: theme.palette.background.quaternary
                  }}
                />
              ))}
            </>
          ) : (
            menuData.menuItems.map((menuItem, index) => {
              const IconComponent = Icons[menuItem.icon];
              return (
                <div key={index}>
                  <Button
                    size="small"
                    aria-controls={`menu-${menuItem.label}`}
                    aria-haspopup="true"
                    onClick={(event) =>
                      handleMenuOpen(event, menuItem.submenu || [], index)
                    }
                    sx={{
                      color: theme.palette.text.secondary, // Theme-based text color
                      "&:hover": {
                        color: theme.palette.text.primary, // Change color on hover
                        "& .MuiListItemIcon-root": {
                          color: theme.palette.primary.main // Theme primary color for icon
                        }
                      }
                    }}
                  >
                    {IconComponent && (
                      <ListItemIcon
                        sx={{ minWidth: 0, color: "inherit", mr: 1 }}
                      >
                        <IconComponent size="small" sx={{ margin: 0 }} />
                      </ListItemIcon>
                    )}
                    <ListItemText primary={menuItem.label} />
                  </Button>
                  <Menu
                    id={`menu-${menuItem.label}`}
                    anchorEl={menuIndex === index ? anchorEl : null}
                    open={menuIndex === index && Boolean(anchorEl)}
                    onClose={handleMenuClose}
                    anchorOrigin={{
                      vertical: "bottom",
                      horizontal: "left"
                    }}
                    transformOrigin={{
                      vertical: "top",
                      horizontal: "left"
                    }}
                    disableAutoFocusItem
                  >
                    {currentMenu &&
                      currentMenu.map((subMenuItem, subIndex) => (
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
      <CreateProj onOpen={creatDialog} menuClose={() => setMenuClose(true)} />
      <OpenProj onOpen={openDialog} menuClose={() => setMenuClose(true)} />
      <UploadDownloadRobotModel
        onOpen={uploadDownloadModelDialog}
        initialTab={uploadDownloadModelTab}
        menuClose={() => setMenuClose(true)}
      />
    </>
  );
};

export default MenuBarButton;
