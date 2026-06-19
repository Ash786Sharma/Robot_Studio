"use client";

import React from "react";
import {
  Drawer,
  Box,
  List,
  ListItemIcon,
  ListItemButton,
  Tooltip,
  Skeleton,
  useTheme
} from "@mui/material";
import * as Icons from "@mui/icons-material";
import Zoom from "@mui/material/Zoom";
import ProjectExplorer from "./ProjectExplorer";

const MainDrawer = ({
  drawerData,
  loading,
  onSelectContent,
  selectedContent,
  onClose,
  onFileClick,
  fileStatuses
}) => {
  const theme = useTheme();
  const drawerOpen = !!selectedContent;

  return (
    <div>
      <Drawer
        variant="permanent"
        sx={{
          width: 50,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: 50,
            height: "calc(100% - 25px)",
            minHeight: "calc(100% - 25px)",
            minWidth: 50,
            maxWidth: 50,
            boxSizing: "border-box",
            backgroundColor: theme.palette.background.secondary,
            color: theme.palette.text.secondary,
            overflow: "hidden"
          }
        }}
      >
        <Box sx={{ mt: 5, pt: 3 }}>
          <List>
            {loading
              ? [...Array(4)].map((_, index) => (
                  <Skeleton
                    key={index}
                    variant="rectangular"
                    animation="wave"
                    width={40}
                    height={40}
                    sx={{
                      margin: "0 5px",
                      marginBottom: "1px",
                      backgroundColor: theme.palette.background.quaternary
                    }}
                  />
                ))
              : drawerData.mainDrawerItems.map((mainDrawerItem, index) => {
                  const IconComponent = Icons[mainDrawerItem.icon];
                  return (
                    <div key={index}>
                      <ListItemButton
                        key={mainDrawerItem.label}
                        onClick={() => onSelectContent(mainDrawerItem.label)}
                        sx={{
                          color: theme.palette.text.secondary,
                          "&:hover": {
                            "& .MuiListItemIcon-root": {
                              color: theme.palette.text.primary
                            }
                          }
                        }}
                      >
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
                                    name: "offset",
                                    options: {
                                      offset: [0, -15]
                                    }
                                  }
                                ]
                              }
                            }}
                          >
                            <ListItemIcon sx={{ color: "inherit", mr: 1 }}>
                              <IconComponent sx={{ margin: 0 }} />
                            </ListItemIcon>
                          </Tooltip>
                        )}
                      </ListItemButton>
                    </div>
                  );
                })}
          </List>
        </Box>
      </Drawer>
      {selectedContent && (
        <ProjectExplorer
          open={drawerOpen}
          drawerName={selectedContent}
          onClose={onClose}
          onFileClick={onFileClick}
          fileStatuses={fileStatuses}
        />
      )}
    </div>
  );
};

export default MainDrawer;
