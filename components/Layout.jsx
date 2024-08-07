'use client';

import React, { useEffect, useState } from 'react';
import { Box } from '@mui/material';
import MenuBar from './MenuBar';
import ToolBar from './ToolBar';
import MainDrawer from './MainDrawer';
import RobotVisual from './RobotVisual';

const Layout = ({ children }) => {
  const [mainDrawerData, setMainDrawerData] = useState({ mainDrawerItems: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/mainDrawer');
        if (!res.ok) {
          throw new Error('Failed to fetch mainDrawer data');
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

  const initializeDrawerState = () => {
    const state = {};
    mainDrawerData.mainDrawerItems.forEach(item => {
      state[item.label] = false;
    });
    return state;
  };

  const [drawerOpen, setDrawerOpen] = useState(initializeDrawerState());

  const handleDrawerToggle = (drawer) => {
    setDrawerOpen((prevState) => {
      const newState = initializeDrawerState();
      newState[drawer] = !prevState[drawer];
      return newState;
    });
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <MenuBar />
      <ToolBar />
      <MainDrawer
        drawerOpen={drawerOpen}
        drawerToggle={handleDrawerToggle}
        drawerData={mainDrawerData}
        loading={loading}
      />
      <Box component="main" sx={{
          flexGrow: 1,
          p: 1,
          ml: Object.values(drawerOpen).includes(true) ? '350px' : '0px', // Adjust margin-left based on drawer state
          mt: 9,
          width: Object.values(drawerOpen).includes(true) ? `calc(100% - 350px)` : '100%', // Adjust width based on drawer state
          height: '635px',
          overflow: 'hidden',
          transition: 'margin 0.3s, width 0.3s',
        }}>
        <RobotVisual />
        {children}
      </Box>
    </Box>
  );
};

export default Layout;
