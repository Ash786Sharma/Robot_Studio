import React from 'react';
import { Menu, MenuItem } from '@mui/material';
import { useUIStore } from '../../store/uiStore';
import { useEditorStore } from '../../store/editorStore';

export const MenuBar: React.FC = () => {
  const [fileAnchor, setFileAnchor] = React.useState<null | HTMLElement>(null);
  const [editAnchor, setEditAnchor] = React.useState<null | HTMLElement>(null);
  const [viewAnchor, setViewAnchor] = React.useState<null | HTMLElement>(null);

  const { toggleTerminal, toggleSidebar, setViewMode } = useUIStore();
  const { closeAllTabs, tabs } = useEditorStore();

  const handleFileMenuOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    setFileAnchor(event.currentTarget);
  };

  const handleEditMenuOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    setEditAnchor(event.currentTarget);
  };

  const handleViewMenuOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    setViewAnchor(event.currentTarget);
  };

  const handleMenuClose = () => {
    setFileAnchor(null);
    setEditAnchor(null);
    setViewAnchor(null);
  };

  return (
    <div className="menu-bar">
      <button className="menu-item" onClick={handleFileMenuOpen}>
        File
      </button>
      <Menu
        anchorEl={fileAnchor}
        open={Boolean(fileAnchor)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleMenuClose}>New File</MenuItem>
        <MenuItem onClick={handleMenuClose}>Open Folder</MenuItem>
        <MenuItem onClick={handleMenuClose}>Save</MenuItem>
        <MenuItem onClick={handleMenuClose}>Save All</MenuItem>
        <MenuItem onClick={handleMenuClose}>Exit</MenuItem>
      </Menu>

      <button className="menu-item" onClick={handleEditMenuOpen}>
        Edit
      </button>
      <Menu
        anchorEl={editAnchor}
        open={Boolean(editAnchor)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleMenuClose}>Undo</MenuItem>
        <MenuItem onClick={handleMenuClose}>Redo</MenuItem>
        <MenuItem onClick={handleMenuClose}>Cut</MenuItem>
        <MenuItem onClick={handleMenuClose}>Copy</MenuItem>
        <MenuItem onClick={handleMenuClose}>Paste</MenuItem>
      </Menu>

      <button className="menu-item" onClick={handleViewMenuOpen}>
        View
      </button>
      <Menu
        anchorEl={viewAnchor}
        open={Boolean(viewAnchor)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => { toggleSidebar(); handleMenuClose(); }}>
          Toggle Explorer
        </MenuItem>
        <MenuItem onClick={() => { toggleTerminal(); handleMenuClose(); }}>
          Toggle Terminal
        </MenuItem>
        <MenuItem onClick={() => { setViewMode({ layout: 'text', activePanel: 'editor' }); handleMenuClose(); }}>
          Text Editor
        </MenuItem>
        <MenuItem onClick={() => { setViewMode({ layout: 'graphical', activePanel: 'graph' }); handleMenuClose(); }}>
          Graph Editor
        </MenuItem>
        <MenuItem onClick={() => { setViewMode({ layout: '3d', activePanel: '3d' }); handleMenuClose(); }}>
          3D View
        </MenuItem>
        <MenuItem onClick={() => { setViewMode({ layout: 'split', activePanel: 'editor' }); handleMenuClose(); }}>
          Split View
        </MenuItem>
      </Menu>
    </div>
  );
};
