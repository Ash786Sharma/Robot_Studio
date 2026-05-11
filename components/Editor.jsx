"use client"; // Ensure this runs only on the client side
import { useEffect } from "react";
import dynamic from "next/dynamic";
import { Box } from "@mui/material";
const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false // Prevents SSR issues
});

const Editor = ({ value, onChange, onSaveFile, editorLoading, themeMode }) => {
  useEffect(() => {
    const handleKeyDown = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "s") {
        event.preventDefault();
        onSaveFile();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onSaveFile]);

  return (
    <MonacoEditor
      height="100%"
      defaultLanguage="javascript"
      value={value}
      onChange={onChange}
      theme={`vs-${themeMode}`}
      loading={editorLoading}
      options={{
        fontSize: 14,
        minimap: { enabled: true }
      }}
    />
  );
};

export default Editor;
