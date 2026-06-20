import React from 'react';
import SaveIcon from '@mui/icons-material/Save';
import BuildIcon from '@mui/icons-material/Build';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import BugReportIcon from '@mui/icons-material/BugReport';
import FolderIcon from '@mui/icons-material/Folder';
import SearchIcon from '@mui/icons-material/Search';
import GitHubIcon from '@mui/icons-material/GitHub';
import SettingsIcon from '@mui/icons-material/Settings';
import { useEditorStore } from '../../store/editorStore';
import { useUIStore } from '../../store/uiStore';

export const ToolBar: React.FC = () => {
  const { toggleTerminal, toggleSidebar } = useUIStore();

  return (
    <div className="toolbar">
      <button className="toolbar-button" title="Save (Ctrl+S)">
        <SaveIcon fontSize="small" />
      </button>
      <button className="toolbar-button" title="Save All (Ctrl+Shift+S)">
        <SaveIcon fontSize="small" />
      </button>

      <div className="toolbar-separator" />

      <button className="toolbar-button" title="Build">
        <BuildIcon fontSize="small" />
      </button>
      <button className="toolbar-button" title="Run (F5)">
        <PlayArrowIcon fontSize="small" />
      </button>
      <button className="toolbar-button" title="Debug">
        <BugReportIcon fontSize="small" />
      </button>

      <div className="toolbar-separator" />

      <button className="toolbar-button" title="Explorer" onClick={() => toggleSidebar()}>
        <FolderIcon fontSize="small" />
      </button>
      <button className="toolbar-button" title="Search">
        <SearchIcon fontSize="small" />
      </button>

      <div className="toolbar-separator" />

      <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
        <button className="toolbar-button" title="Source Control">
          <GitHubIcon fontSize="small" />
        </button>
        <button className="toolbar-button" title="Settings">
          <SettingsIcon fontSize="small" />
        </button>
      </div>
    </div>
  );
};
