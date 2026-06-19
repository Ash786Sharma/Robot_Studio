import React, { useState, useRef } from "react";
import {
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  Typography,
  Box,
  IconButton,
  Menu,
  MenuItem,
  TextField,
  Input,
  colors,
  Divider,
  Tooltip,
  useTheme
} from "@mui/material";
import {
  Folder,
  Description,
  ExpandMore,
  KeyboardArrowRight,
  FiberManualRecord
} from "@mui/icons-material";
import { v4 as uuidv4 } from "uuid";

const INDENTATION = 2; // Adjust spacing for better alignment

const FileTreeMod = ({
  fileStructure,
  setFileStructure,
  onFileClick,
  fileStatuses
}) => {
  const [openFolders, setOpenFolders] = useState({});
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [newName, setNewName] = useState("");
  const [addingItem, setAddingItem] = useState(null); // Store type (file/folder) when adding new item
  const [copiedItem, setCopiedItem] = useState(null);
  const [cutItem, setCutItem] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [deploymentStatus, setDeploymentStatus] = useState("red"); // Initialize with "not deployed"
  const theme = useTheme();

  const getStatusColor = (status) => {
    switch (status) {
      case "green":
        return "green";
      case "blue":
        return "blue";
      case "yellow":
        return "yellow";
      case "red":
        return "red";
      default:
        return "green";
    }
  };

  const handleFolderClick = (e, id) => {
    e.stopPropagation();
    setOpenFolders((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleMenuOpen = (e, item) => {
    e.preventDefault();
    setMenuAnchor(e.currentTarget); // Ensure the anchor element is part of the document layout
    setSelectedItem(item);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setSelectedItem(null);
  };

  // Start rename mode
  const handleRename = (e) => {
    e.stopPropagation();
    if (selectedItem) {
      setEditingId(selectedItem.id);
      setNewName(selectedItem.name);
      handleMenuClose();
    }
  };

  // Save renamed item
  const handleRenameSave = (e) => {
    e.stopPropagation();
    if (!newName.trim()) {
      setEditingId(null);
      return;
    }

    const updatePaths = (items, oldPath, newPath) => {
      return items.map((item) => {
        const updatedItem = { ...item };
        if (item.path.startsWith(oldPath)) {
          updatedItem.path = item.path.replace(oldPath, newPath);
        }
        if (item.children) {
          updatedItem.children = updatePaths(item.children, oldPath, newPath);
        }
        return updatedItem;
      });
    };

    const updateName = (items) =>
      items.map((item) =>
        item.id === editingId
          ? {
              ...item,
              name: newName,
              path: `${item.path.replace(item.name, newName)}`
            }
          : {
              ...item,
              children: item.children ? updateName(item.children) : []
            }
      );

    const selectedItem = findItemById(fileStructure, editingId);
    if (!selectedItem) return;

    const oldPath = selectedItem.path;
    const newPath = oldPath.replace(selectedItem.name, newName);

    let updatedStructure = updateName(fileStructure);
    updatedStructure = updatePaths(updatedStructure, oldPath, newPath);

    setFileStructure(updatedStructure);
    setEditingId(null);
    setNewName("");
  };

  const deepDeletion = (items, idToDelete) => {
    const newItems = items.filter((item) => {
      if (item.id === idToDelete) {
        return false; // Skip the item to delete
      }
      if (item.children) {
        item.children = deepDeletion(item.children, idToDelete); // Recursive call
      }
      return true; // Keep the item
    });
    return newItems;
  };

  // Delete selected item
  const handleDelete = (e) => {
    e.stopPropagation();
    setFileStructure(deepDeletion(fileStructure, selectedItem.id));
    //console.log("Deep deletion result:", fileStructure);

    handleMenuClose();
  };

  const handleCopy = (e) => {
    e.stopPropagation();
    setCopiedItem(selectedItem);
    setCutItem(null);
    handleMenuClose();
  };

  const handleCut = (e) => {
    e.stopPropagation();
    setCutItem(selectedItem);
    setCopiedItem(null);
    handleMenuClose();
  };

  const handlePaste = (e) => {
    e.stopPropagation();
    console.log("Pasting item:", selectedItem, copiedItem, cutItem);

    if (!copiedItem && !cutItem) return;
    if (
      selectedItem.type === "file" &&
      (copiedItem?.type === "folder" || cutItem?.type === "folder")
    ) {
      return;
    }

    const newItem = {
      ...(copiedItem || cutItem),
      id: uuidv4(),
      children: (copiedItem || cutItem)?.children
        ? (copiedItem || cutItem).children.map((child) => ({
            ...child,
            id: uuidv4()
          }))
        : []
    };

    const pasteItem = (items, parentId, itemToPaste) => {
      return items.map((item) => {
        if (item.id === parentId) {
          return { ...item, children: [...(item.children || []), itemToPaste] };
        }
        if (item.children) {
          return {
            ...item,
            children: pasteItem(item.children, parentId, itemToPaste)
          };
        }
        return item;
      });
    };

    let updatedFileStructure = pasteItem(
      fileStructure,
      selectedItem.id,
      newItem
    );

    if (cutItem) {
      const removeItemFromParent = (items, itemId) => {
        return items.map((item) => {
          if (item.children) {
            item.children = item.children.filter(
              (child) => child.id !== itemId
            );
            item.children = removeItemFromParent(item.children, itemId);
          }
          return item;
        });
      };

      updatedFileStructure = removeItemFromParent(
        updatedFileStructure,
        cutItem.id
      );
      setCutItem(null);
    }

    setFileStructure(updatedFileStructure);
    setCopiedItem(null);
    handleMenuClose();
  };

  // Start adding new item
  const handleAddItem = (e, type) => {
    e.stopPropagation();
    setAddingItem({ type, parentId: selectedItem.id });
    handleMenuClose();
  };

  const handleEscape = (e) => {
    e.stopPropagation();
    if (e.key === "Escape") {
      setEditingId(null);
      setAddingItem(null);
      setCopiedItem(null);
      setCutItem(null);
    }
  };

  // Save newly added item
  const handleAddItemSave = (e) => {
    e.stopPropagation();
    if (!newName.trim()) return;

    const parentItem = findItemById(fileStructure, addingItem.parentId);
    const newPath = parentItem
      ? `${parentItem.path}/${newName}`
      : `/${newName}`;

    const newItem = {
      id: uuidv4(),
      name: newName,
      type: addingItem.type,
      path: newPath,
      children: addingItem.type === "folder" ? [] : undefined
    };

    const addNewItem = (items, parentId, newItem) => {
      return items.map((item) => {
        if (item.id === parentId) {
          return { ...item, children: [...(item.children || []), newItem] };
        }
        if (item.children) {
          return {
            ...item,
            children: addNewItem(item.children, parentId, newItem)
          };
        }
        return item;
      });
    };

    const updatedFileStructure = addNewItem(
      fileStructure,
      addingItem.parentId,
      newItem
    );

    setFileStructure(updatedFileStructure);
    setAddingItem(null);
    setNewName("");
  };

  // Helper function to find an item by ID
  const findItemById = (items, id) => {
    for (const item of items) {
      if (item.id === id) return item;
      if (item.children) {
        const found = findItemById(item.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  const RenderFileItem = (
    item,
    depth = 0,
    isLast = false,
    parentIndent = []
  ) => {
    const isFolder = item.type === "folder";
    const isOpen = openFolders[item.id] || false;
    const hasChildren = isFolder && item.children && item.children.length > 0;

    return (
      <React.Fragment key={item.id}>
        <ListItemButton
          onClick={(e) => {
            isFolder && handleFolderClick(e, item.id);
            setSelectedId(item.id);
            if (item.type === "file") {
              //console.log("selected file: ", item.name, item.path);
              onFileClick(item.path, item.name);
            }
          }}
          onContextMenu={(e) => handleMenuOpen(e, item)} // Right-click handler
          onKeyDown={(e) => {
            handleEscape(e);
          }}
          sx={{
            backgroundColor:
              selectedId === item.id
                ? theme.palette.text.tertiary
                : "transparent",
            color:
              selectedId === item.id
                ? theme.palette.text.primary
                : theme.palette.text.secondary,
            opacity: cutItem?.id === item.id ? 0.5 : 1,
            height: 25,
            width: "100%",
            pl: depth * INDENTATION, // Correct indentation scaling
            position: "relative",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            "&:hover": { color: theme.palette.text.primary }
          }}
        >
          {/* Left: Expand Icon + Folder/File Icon + Name or Input Field */}
          <Box sx={{ display: "flex", alignItems: "center", flexGrow: 1 }}>
            {/* Expand/Collapse Icon */}
            {isFolder && (isOpen ? <ExpandMore /> : <KeyboardArrowRight />)}

            {/* Draw vertical sibling lines */}
            {depth > 0 &&
              parentIndent.map((hasSibling, index) => (
                <div
                  key={index}
                  style={{
                    position: "absolute",
                    left: (index + 0.75) * INDENTATION * 8,
                    top: 0,
                    bottom: 0,
                    width: "1px",
                    backgroundColor: hasSibling
                      ? "transparent"
                      : theme.palette.primary.main
                  }}
                />
              ))}

            {/* Folder/File Icon */}
            {isFolder ? (
              <Folder fontSize="small" />
            ) : (
              <Description fontSize="small" />
            )}

            {/* File/Folder Name */}
            {editingId === item.id ? (
              <>
                <Input
                  value={newName}
                  type="text"
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => {
                    e.stopPropagation();
                    e.key === "Enter" && handleRenameSave(e);
                    e.key === "Escape" && setEditingId(null);
                  }}
                  size="small"
                  autoFocus
                  sx={{ m: 1, width: 170, height: 25, fontSize: "0.8rem" }}
                />
              </>
            ) : (
              <Tooltip title={item.path} placement="right-start">
                {" "}
                {/* Add Tooltip here */}
                <Typography
                  variant="body2"
                  sx={{
                    fontSize: "0.8rem",
                    pl: 0.5,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    maxWidth: 260
                  }}
                >
                  {item.name}
                </Typography>
              </Tooltip>
            )}
          </Box>
          <FiberManualRecord
            sx={{
              fontSize: "0.8rem",
              opacity: 0.5,
              color: getStatusColor(deploymentStatus)
            }}
          />
          <FiberManualRecord
            sx={{
              fontSize: "0.8rem",
              opacity: selectedId === item.id ? 1 : 0.8,
              color: getStatusColor(fileStatuses[item.path] || "null"),
              mr: 1
            }}
          />

          {/* Three-Dot Menu 
          <IconButton
            size="small"
            onClick={(e) => handleMenuOpen(e, item)}
            className="menu-button"
            sx={{ opacity: 0, transition: "opacity 0.2s" }}
          >
            <MoreHoriz fontSize="small" />
          </IconButton>*/}
        </ListItemButton>

        {/* Render Children Recursively with Correct Indentation and Connection */}
        {isFolder &&
          (hasChildren || addingItem?.parentId === item.id) && ( // Check if addingItem is for this folder
            <Collapse in={isOpen} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                {addingItem?.parentId === item.id && (
                  <ListItemButton // Render input for addingItem
                    sx={{
                      height: 25,
                      width: "100%",
                      pl: (depth + 1) * INDENTATION,
                      position: "relative",
                      display: "flex",

                      alignItems: "center"
                    }}
                  >
                    {addingItem.type === "folder" ? (
                      <Folder fontSize="small" />
                    ) : (
                      <Description fontSize="small" />
                    )}
                    <Input
                      value={newName}
                      type="text"
                      onChange={(e) => setNewName(e.target.value)}
                      onKeyDown={(e) => {
                        e.stopPropagation();
                        e.key === "Enter" && handleAddItemSave(e);
                        e.key === "Escape" && setAddingItem(null);
                      }}
                      size="small"
                      autoFocus
                      sx={{ m: 1, width: 170, height: 25, fontSize: "0.8rem" }}
                    />
                  </ListItemButton>
                )}
                {item.children.map((child, index) =>
                  RenderFileItem(
                    child,
                    depth + 1,
                    index === item.children.length - 1,
                    [...parentIndent, false]
                  )
                )}
              </List>
            </Collapse>
          )}
      </React.Fragment>
    );
  };

  return (
    <>
      <List>
        {fileStructure.map((item, index) =>
          RenderFileItem(item, 0, index === fileStructure.length - 1)
        )}
      </List>
      {menuAnchor &&
        selectedItem && ( // Use menuAnchor instead of anchorRef.current
          <Menu
            anchorEl={menuAnchor}
            anchorOrigin={{
              vertical: "bottom",
              horizontal: "right"
            }}
            transformOrigin={{
              vertical: "top",
              horizontal: "right"
            }}
            open={Boolean(menuAnchor)}
            onClose={handleMenuClose}
            keepMounted // Prevents re-mounting issues
          >
            <MenuItem onClick={(e) => handleRename(e)}>Rename</MenuItem>
            <Divider />
            <MenuItem onClick={(e) => handleDelete(e)}>Delete</MenuItem>
            <Divider />
            <MenuItem onClick={(e) => handleCopy(e)}>Copy</MenuItem>
            <MenuItem onClick={(e) => handleCut(e)}>Cut</MenuItem>
            {(copiedItem || cutItem) && selectedItem.type === "folder" ? (
              <MenuItem onClick={handlePaste}>Paste</MenuItem>
            ) : null}
            <Divider />
            {selectedItem.type === "folder" && [
              <MenuItem
                key="add-file"
                onClick={(e) => handleAddItem(e, "file")}
              >
                Add File
              </MenuItem>,
              <MenuItem
                key="add-folder"
                onClick={(e) => handleAddItem(e, "folder")}
              >
                Add Folder
              </MenuItem>
            ]}
          </Menu>
        )}
    </>
  );
};

export default FileTreeMod;
