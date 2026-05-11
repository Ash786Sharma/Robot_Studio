import React from "react";
import {
  AppBar,
  Button,
  Container,
  IconButton,
  Typography,
  useTheme
} from "@mui/material";
import { SmartToyRounded, DarkMode, LightMode } from "@mui/icons-material";
import * as Icons from "@mui/icons-material";
import MenuBarButton from "./MenuBarButton";

const MenuBar = ({ themeMode, setThemeMode, open3dEditorTab }) => {
  const theme = useTheme();
  return (
    <>
      <AppBar
        position="fixed"
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          backgroundColor: theme.palette.background.primary, // Use theme text color
          color: theme.palette.text.primary // Use theme text color
        }}
      >
        <Container
          maxWidth="xl"
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}
        >
          <SmartToyRounded sx={{ color: theme.palette.primary.main, m: 1 }} />
          <Typography
            variant="h6"
            noWrap
            component="a"
            href="#app-bar-with-responsive-menu"
            sx={{
              mr: 2,
              display: { xs: "none", md: "flex" },
              fontFamily: "monospace",
              fontWeight: 700,
              letterSpacing: ".3rem",
              color: theme.palette.text.primary, // Use theme text color
              textDecoration: "none"
            }}
          >
            ROBOT STUDIO
          </Typography>
          <MenuBarButton open3dEditorTab={open3dEditorTab} />
          <Typography sx={{ color: theme.palette.text.primary }}>
            {themeMode}
          </Typography>
          <IconButton
            size="small"
            onClick={() =>
              setThemeMode(themeMode === "dark" ? "light" : "dark")
            }
            sx={{ color: "inherit" }}
          >
            {themeMode === "dark" ? (
              <DarkMode sx={{ color: theme.palette.primary.main }} />
            ) : (
              <LightMode sx={{ color: theme.palette.primary.main }} />
            )}
          </IconButton>
        </Container>
      </AppBar>
    </>
  );
};

export default MenuBar;
