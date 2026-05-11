import React from "react";
import { AppBar, Container, useTheme } from "@mui/material";
import ToolBarButtons from "./ToolBarButtons";

const ToolBar = () => {
  const theme = useTheme();
  return (
    <AppBar
      position="fixed"
      sx={{
        top: 40.3,
        zIndex: (theme) => theme.zIndex.drawer + 1,
        backgroundColor: theme.palette.background.secondary,
        color: theme.palette.text.secondary,
        minHeight: 3.5
      }}
    >
      <Container
        maxWidth="xl"
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          minHeight: 3.5
        }}
      >
        <ToolBarButtons />
      </Container>
    </AppBar>
  );
};

export default ToolBar;
