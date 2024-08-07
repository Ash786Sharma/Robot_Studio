import React, { useEffect, useState } from 'react';
import { Drawer, Box, List, ListItemIcon, ListItemButton, Tooltip, Skeleton } from '@mui/material';
import * as Icons from '@mui/icons-material';
import Zoom from '@mui/material/Zoom';
import ProjectExplorer from './ProjectExplorer';

const MainDrawer = ({ drawerOpen, drawerToggle, drawerData, loading }) => {
  useEffect(() => {
    // You no longer need to setMainDrawerData here as it's passed from Layout
  }, [drawerData]);

  return (
    <div>
      <Drawer
        variant="permanent"
        sx={{
          width: 50,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: 50,
            minWidth: 50,
            maxWidth: 50,
            boxSizing: 'border-box',
            backgroundColor: '#1e293b',
            color: '#94a3b8',
            overflow: 'hidden',
          },
        }}
      >
        <Box sx={{ mt: 5, pt: 3 }}>
          <List>
            {loading ? (
              // Display skeletons while loading
              [...Array(4)].map((_, index) => (
                <Skeleton key={index} variant="rectangular" animation="wave" width={40} height={40} sx={{ margin: '0 5px', marginBottom: "1px", backgroundColor: '#334155' }} />
              ))
            ) : (
              drawerData.mainDrawerItems.map((mainDrawerItem, index) => {
                const IconComponent = Icons[mainDrawerItem.icon];
                return (
                  <div key={index}>
                    <ListItemButton key={mainDrawerItem.label} onClick={() => drawerToggle(mainDrawerItem.label)}>
                      {IconComponent && (
                        <Tooltip
                          TransitionComponent={Zoom}
                          arrow
                          title={mainDrawerItem.label}
                          placement="right"
                          sx={{ margin: 0 }}
                          slotProps={{
                            popper: {
                              modifiers: [
                                {
                                  name: 'offset',
                                  options: {
                                    offset: [0, -15],
                                  },
                                },
                              ],
                            },
                          }}
                        >
                          <ListItemIcon className='text-slate-400 hover:text-slate-100' sx={{ '&:hover': { '& .MuiListItemIcon-root': { color: 'white' }, }, }}>
                            <IconComponent sx={{ margin: 0 }} />
                          </ListItemIcon>
                        </Tooltip>
                      )}
                    </ListItemButton>
                  </div>
                );
              })
            )}
          </List>
        </Box>
      </Drawer>
      {!loading && drawerData.mainDrawerItems.map((mainDrawerItem, index) => (
        <ProjectExplorer
          key={mainDrawerItem.label}
          open={drawerOpen[mainDrawerItem.label]}
          toggleDrawer={() => drawerToggle(mainDrawerItem.label)}
          drawerName={mainDrawerItem.label}
          zIndex={0}
        />
      ))}
    </div>
  );
};

export default MainDrawer;
