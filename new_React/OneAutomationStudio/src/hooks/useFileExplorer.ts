import { useCallback } from 'react';
import { useExplorerStore } from '../store/explorerStore';
import type { FileNode } from '../types';

export const useFileExplorer = () => {
  const {
    files,
    selectedFileId,
    expandedFolders,
    searchQuery,
    selectFile,
    toggleFolder,
    setSearchQuery,
    createNewFile,
    createNewFolder,
    deleteFile,
    renameFile,
    getFileById,
  } = useExplorerStore();

  const searchFiles = useCallback(
    (query: string) => {
      setSearchQuery(query);
    },
    [setSearchQuery]
  );

  const filterFiles = useCallback(
    (nodes: FileNode[]): FileNode[] => {
      if (!searchQuery) return nodes;
      return nodes.filter((node) => {
        const matches = node.name.toLowerCase().includes(searchQuery.toLowerCase());
        if (node.children) {
          node.children = filterFiles(node.children);
        }
        return matches || (node.children && node.children.length > 0);
      });
    },
    [searchQuery]
  );

  return {
    files,
    selectedFileId,
    expandedFolders,
    searchQuery,
    selectFile,
    toggleFolder,
    searchFiles,
    createNewFile,
    createNewFolder,
    deleteFile,
    renameFile,
    getFileById,
    filterFiles,
  };
};
