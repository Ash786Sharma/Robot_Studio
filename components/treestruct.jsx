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
  Input
} from "@mui/material";
import {
  Folder,
  Description,
  ExpandMore,
  KeyboardArrowRight,
  MoreHoriz
} from "@mui/icons-material";
import { v4 as uuidv4 } from "uuid";

const INDENTATION = 2; // Adjust spacing for better alignment

const FileTreeMod = ({ fileStructure, setFileStructure }) => {
  const [openFolders, setOpenFolders] = useState({});
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [newName, setNewName] = useState("");
  const [addingItem, setAddingItem] = useState(null); // Store type (file/folder) when adding new item

  const handleFolderClick = (e, id) => {
    e.stopPropagation();
    setOpenFolders((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleMenuOpen = (e, item) => {
    e.stopPropagation();
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

    const updateName = (items) =>
      items.map((item) =>
        item.id === editingId
          ? { ...item, name: newName }
          : {
              ...item,
              children: item.children ? updateName(item.children) : []
            }
      );

    setFileStructure([...updateName(fileStructure)]); // Create a new reference
    setEditingId(null);
    setNewName(""); // Reset name after saving
    // Reset selected item after rename to clear hover effect
    setSelectedItem(null);
  };

  // Delete selected item
  const handleDelete = (e) => {
    e.stopPropagation();
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

    setFileStructure(deepDeletion(fileStructure, selectedItem.id));
    //console.log("Deep deletion result:", fileStructure);

    handleMenuClose();
  };

  // Start adding new item
  const handleAddItem = (e, type) => {
    e.stopPropagation();
    setAddingItem({ type, parentId: selectedItem.id });
    handleMenuClose();
  };

  // Save newly added item
  const handleAddItemSave = (e) => {
    e.stopPropagation();
    if (!newName.trim()) return;

    const newItem = {
      id: uuidv4(),
      name: newName,
      type: addingItem.type,
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
          }; // Recursive call
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
          }}
          sx={{
            height: 25,
            width: "100%",
            pl: depth * INDENTATION, // Correct indentation scaling
            position: "relative",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            "&:hover .menu-button": { opacity: 1 }
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
                    backgroundColor: hasSibling ? "transparent" : "#ccc"
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
                  }}
                  size="small"
                  autoFocus
                  sx={{ width: 220, height: 25, fontSize: "0.8rem" }}
                />
              </>
            ) : (
              <Typography
                variant="body2"
                sx={{
                  fontSize: "0.8rem",
                  pl: 0.5,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  maxWidth: 220
                }}
              >
                {item.name}
              </Typography>
            )}
          </Box>

          {/* Three-Dot Menu */}
          <IconButton
            size="small"
            onClick={(e) => handleMenuOpen(e, item)}
            className="menu-button"
            sx={{ opacity: 0, transition: "opacity 0.2s" }}
          >
            <MoreHoriz fontSize="small" />
          </IconButton>
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
                      justifyContent: "space-between",
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
                      }}
                      size="small"
                      autoFocus
                      sx={{ width: 220, height: 25, fontSize: "0.8rem" }}
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
            <MenuItem onClick={(e) => handleDelete(e)}>Delete</MenuItem>
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
