'use client';

import React, { useState } from 'react';
import { Menu, MenuItem, ListItemIcon, ListItemText } from '@mui/material';
import * as Icons from '@mui/icons-material';

const NestedMenuItem = ({ menuItem, parentHandleClose, onMenuItemClick }) => {
  const [submenuAnchorEl, setSubmenuAnchorEl] = useState(null);

  const handleSubmenuOpen = (event) => {
    setSubmenuAnchorEl(event.currentTarget);
  };

  const handleSubmenuClose = () => {
    setSubmenuAnchorEl(null);
  };

  const handleClick = () => {
    onMenuItemClick(menuItem.label);
    if (!menuItem.submenu) parentHandleClose();
  };

  const IconComponent = Icons[menuItem.icon];

  return (
    <>
      <MenuItem
        onMouseEnter={handleSubmenuOpen}
        onMouseLeave={handleSubmenuClose}
        onClick={handleClick}
      >
        {IconComponent && (
          <ListItemIcon className="mr-0" sx={{ minWidth: 0 }}>
            <IconComponent sx={{ margin: 0}}/>
          </ListItemIcon>
        )}
        <ListItemText primary={menuItem.label} sx={{ margin: 0 }} />
        {menuItem.submenu && <span style={{ marginLeft: 'auto' }}>▶</span>}
      </MenuItem>
      {menuItem.submenu && (
        <Menu
          anchorEl={submenuAnchorEl}
          open={Boolean(submenuAnchorEl)}
          onClose={handleSubmenuClose}
          anchorOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'left',
          }}
        >
          {menuItem.submenu.map((subMenuItem, index) => (
            <NestedMenuItem
              key={index}
              menuItem={subMenuItem}
              parentHandleClose={parentHandleClose}
              onMenuItemClick={onMenuItemClick}
            />
          ))}
        </Menu>
      )}
    </>
  );
};

export default NestedMenuItem;
