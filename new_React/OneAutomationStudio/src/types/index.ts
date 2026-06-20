export interface Project {
  id: string;
  name: string;
  type: 'robot' | 'plc' | 'hmi';
  description: string;
  createdAt: Date;
  updatedAt: Date;
  path: string;
}

export interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  path: string;
  children?: FileNode[];
  content?: string;
  language?: string;
  isOpen?: boolean;
}

export interface EditorTab {
  id: string;
  filename: string;
  language: string;
  content: string;
  fileId: string;
  isDirty: boolean;
  isActive: boolean;
}

export interface EditorState {
  activeTabId: string | null;
  tabs: EditorTab[];
  splitLayout: 'single' | 'horizontal' | 'vertical';
}

export interface ExplorerState {
  selectedFileId: string | null;
  expandedFolders: Set<string>;
  searchQuery: string;
}

export interface TerminalSession {
  id: string;
  name: string;
  content: string;
  isActive: boolean;
}

export interface GraphNode {
  id: string;
  label: string;
  type: string;
  data: Record<string, any>;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type?: string;
}

export interface RobotModel {
  id: string;
  name: string;
  type: string;
  dofCount: number;
  manufacturer: string;
  description: string;
  modelUrl?: string;
  thumbnail?: string;
}

export interface ViewMode {
  layout: 'text' | 'graphical' | 'split' | '3d';
  activePanel: 'editor' | 'graph' | '3d' | 'simulator';
}

export interface UIState {
  sidebarOpen: boolean;
  terminalOpen: boolean;
  explorerOpen: boolean;
  terminalHeight: number;
  sidebarWidth: number;
}
