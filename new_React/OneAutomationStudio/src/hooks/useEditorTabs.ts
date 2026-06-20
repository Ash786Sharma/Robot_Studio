import { useCallback } from 'react';
import { useEditorStore } from '../store/editorStore';
import type { EditorTab } from '../types';

export const useEditorTabs = () => {
  const {
    tabs,
    activeTabId,
    addTab,
    removeTab,
    setActiveTab,
    updateTab,
    closeAllTabs,
    closeOtherTabs,
  } = useEditorStore();

  const openFile = useCallback(
    (fileId: string, filename: string, content: string, language: string) => {
      const newTab: EditorTab = {
        id: `tab-${Date.now()}`,
        filename,
        language,
        content,
        fileId,
        isDirty: false,
        isActive: true,
      };
      addTab(newTab);
    },
    [addTab]
  );

  const closeTab = useCallback(
    (tabId: string) => {
      removeTab(tabId);
    },
    [removeTab]
  );

  const closeAllOpenTabs = useCallback(() => {
    closeAllTabs();
  }, [closeAllTabs]);

  const closeOtherOpenTabs = useCallback(
    (tabId: string) => {
      closeOtherTabs(tabId);
    },
    [closeOtherTabs]
  );

  return {
    tabs,
    activeTabId,
    openFile,
    closeTab,
    setActiveTab,
    updateTab,
    closeAllOpenTabs,
    closeOtherOpenTabs,
  };
};
