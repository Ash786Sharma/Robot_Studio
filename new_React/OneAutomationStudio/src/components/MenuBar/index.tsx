import React from 'react';
import { Typography } from '@mui/material';
import { MenuRenderer } from '../MenuRenderer';

export const MenuBar: React.FC = () => (
  <div className="menu-bar">
    <Typography variant="h6" sx={{ padding: '16px' }}>
      OAS
    </Typography>
    <MenuRenderer />
  </div>
);
