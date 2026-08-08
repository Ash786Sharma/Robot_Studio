import React from 'react';
import SaveIcon from '@mui/icons-material/Save';
import BuildIcon from '@mui/icons-material/Build';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import BugReportIcon from '@mui/icons-material/BugReport';
import FolderIcon from '@mui/icons-material/Folder';
import SearchIcon from '@mui/icons-material/Search';
import SettingsIcon from '@mui/icons-material/Settings';
import uiConfig from '../assets/ui-config.json';
import { useUIStore, type UIStore } from '../store/uiStore';

type UIStateKey = 'sidebarOpen' | 'terminalOpen' | 'explorerOpen';

type UIDisplayMode = 'text' | 'icon' | 'both';

type UIConfigItem = {
  id: string;
  label?: string;
  title?: string;
  icon?: string;
  display?: UIDisplayMode | string;
  action?: string;
  payload?: string;
  type?: 'separator' | string;
  separatorAfter?: boolean;
  state?: UIStateKey | string;
  items?: UIConfigItem[];
};

type ActionHandler = (payload?: string) => void;

const iconMap: Record<string, React.ComponentType<any>> = {
  Save: SaveIcon,
  Build: BuildIcon,
  PlayArrow: PlayArrowIcon,
  BugReport: BugReportIcon,
  Folder: FolderIcon,
  Search: SearchIcon,
  Settings: SettingsIcon,
};

const getIconComponent = (iconName?: string) => {
  if (!iconName) return null;
  const Icon = iconMap[iconName as keyof typeof iconMap];
  return Icon ? <Icon fontSize="small" /> : null;
};

const renderItemContent = (item: UIConfigItem) => {
  const icon = getIconComponent(item.icon);

  switch (item.display) {
    case 'icon':
      return icon ?? item.label;
    case 'both':
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          {icon}
          {item.label}
        </span>
      );
    default:
      return item.label;
  }
};

const getStateValue = (state: UIStateKey | string | undefined, store: UIStore) => {
  if (!state || typeof state !== 'string') {
    return false;
  }

  return state === 'sidebarOpen'
    ? store.sidebarOpen
    : state === 'terminalOpen'
    ? store.terminalOpen
    : state === 'explorerOpen'
    ? store.explorerOpen
    : false;
};

const getActionHandlers = (store: UIStore): Record<string, ActionHandler> => ({
  noop: () => undefined,
  toggleSidebar: () => store.toggleSidebar(),
  toggleTerminal: () => store.toggleTerminal(),
  toggleExplorer: () => store.toggleExplorer(),
  setTheme: (payload?: string) => {
    if (payload) store.setTheme(payload);
  },
  viewText: () => store.setViewMode({ layout: 'text', activePanel: 'editor' }),
  viewGraphical: () => store.setViewMode({ layout: 'graphical', activePanel: 'graph' }),
  view3D: () => store.setViewMode({ layout: '3d', activePanel: '3d' }),
  viewSplit: () => store.setViewMode({ layout: 'split', activePanel: 'editor' }),
});

const renderToolbarItems = (
  items: UIConfigItem[],
  actionHandlers: Record<string, ActionHandler>,
  store: UIStore,
) =>
  items.flatMap((item) => {
    if (item.type === 'separator') {
      return <div key={item.id} className="toolbar-separator" />;
    }

    const nodes: React.ReactNode[] = [
      <button
        key={item.id}
        className="toolbar-button"
        title={item.title ?? item.label}
        onClick={() => {
          if (item.action) {
            actionHandlers[item.action]?.(item.payload);
          }
        }}
        style={{ color: getStateValue(item.state, store) ? 'var(--ui-text)' : 'var(--ui-text-secondary)' }}
      >
        {renderItemContent(item)}
      </button>,
    ];

    if (item.separatorAfter) {
      nodes.push(<div key={`${item.id}-separator`} className="toolbar-separator" />);
    }

    return nodes;
  });



export const ToolbarRenderer: React.FC = () => {
  const store = useUIStore();
  const actionHandlers = getActionHandlers(store);

  return <>{renderToolbarItems(uiConfig.toolBar, actionHandlers, store)}</>;
};
