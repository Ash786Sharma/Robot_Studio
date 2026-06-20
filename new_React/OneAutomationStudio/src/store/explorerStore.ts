import { create } from 'zustand';
import type { FileNode } from '../types';

interface ExplorerStore {
  // State
  files: FileNode[];
  selectedFileId: string | null;
  expandedFolders: Set<string>;
  searchQuery: string;

  // Actions
  setFiles: (files: FileNode[]) => void;
  selectFile: (fileId: string | null) => void;
  toggleFolder: (folderId: string) => void;
  expandFolder: (folderId: string) => void;
  collapseFolder: (folderId: string) => void;
  setSearchQuery: (query: string) => void;
  createNewFile: (parentId: string, name: string) => void;
  createNewFolder: (parentId: string, name: string) => void;
  deleteFile: (fileId: string) => void;
  renameFile: (fileId: string, newName: string) => void;
  getFileById: (fileId: string) => FileNode | undefined;
}

export const useExplorerStore = create<ExplorerStore>((set, get) => ({
  files: [],
  selectedFileId: null,
  expandedFolders: new Set(),
  searchQuery: '',

  setFiles: (files) =>
    set(() => ({
      files,
    })),

  selectFile: (fileId) =>
    set(() => ({
      selectedFileId: fileId,
    })),

  toggleFolder: (folderId) =>
    set((state) => {
      const newExpanded = new Set(state.expandedFolders);
      if (newExpanded.has(folderId)) {
        newExpanded.delete(folderId);
      } else {
        newExpanded.add(folderId);
      }
      return { expandedFolders: newExpanded };
    }),

  expandFolder: (folderId) =>
    set((state) => {
      const newExpanded = new Set(state.expandedFolders);
      newExpanded.add(folderId);
      return { expandedFolders: newExpanded };
    }),

  collapseFolder: (folderId) =>
    set((state) => {
      const newExpanded = new Set(state.expandedFolders);
      newExpanded.delete(folderId);
      return { expandedFolders: newExpanded };
    }),

  setSearchQuery: (query) =>
    set(() => ({
      searchQuery: query,
    })),

  createNewFile: () => {
    // Implementation would update files tree
    set((state) => ({ files: [...state.files] }));
  },

  createNewFolder: () => {
    set((state) => ({ files: [...state.files] }));
  },

  deleteFile: (fileId) =>
    set((state) => ({
      files: state.files.filter((f) => f.id !== fileId),
    })),

  renameFile: (fileId, newName) =>
    set((state) => ({
      files: state.files.map((f) =>
        f.id === fileId ? { ...f, name: newName } : f
      ),
    })),

  getFileById: (fileId) => {
    const findFile = (files: FileNode[]): FileNode | undefined => {
      for (const file of files) {
        if (file.id === fileId) return file;
        if (file.children) {
          const found = findFile(file.children);
          if (found) return found;
        }
      }
      return undefined;
    };
    return findFile(get().files);
  },
}));
