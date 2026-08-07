import React from 'react';
import { Divider, Menu, MenuItem } from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import BuildIcon from '@mui/icons-material/Build';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import BugReportIcon from '@mui/icons-material/BugReport';
import FolderIcon from '@mui/icons-material/Folder';
import SearchIcon from '@mui/icons-material/Search';
import GitHubIcon from '@mui/icons-material/GitHub';
import SettingsIcon from '@mui/icons-material/Settings';
import { useUIStore, type UIStore } from '../store/uiStore';

type UIStateKey = 'sidebarOpen' | 'terminalOpen' | 'explorerOpen';

type UIDisplayMode = 'text' | 'icon' | 'both';

type UIConfigItem = {
  id: string;
  label?: string;
  title?: string;
  icon?: string;
  display?: UIDisplayMode;
  action?: string;
  payload?: string;
  type?: 'separator';
  separatorAfter?: boolean;
  state?: UIStateKey;
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
  GitHub: GitHubIcon,
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

const getStateValue = (state: UIStateKey | undefined, store: UIStore) => {
  if (!state) {
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

const getSelectedValue = (item: UIConfigItem, store: UIStore) => {
  if (item.action === 'setTheme' && item.payload) {
    return item.payload === store.theme;
  }

  return getStateValue(item.state, store);
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

const useMenuAnchors = () => {
  const [anchors, setAnchors] = React.useState<Record<string, HTMLElement | null>>({});

  const setAnchor = (id: string, anchor: HTMLElement | null) => {
    setAnchors((current) => ({ ...current, [id]: anchor }));
  };

  const closeAnchor = (id: string) => {
    setAnchors((current) => ({ ...current, [id]: null }));
  };

  const closeAll = () => {
    setAnchors({});
  };

  return { anchors, setAnchor, closeAnchor, closeAll };
};

const renderMenuItems = (
  items: UIConfigItem[],
  actionHandlers: Record<string, ActionHandler>,
  store: UIStore,
  closeMenu: () => void,
  menuState: ReturnType<typeof useMenuAnchors>,
) =>
  items.flatMap((item) => {
    const nodes: React.ReactNode[] = [];

    if (item.type === 'separator') {
      nodes.push(<Divider key={item.id} sx={{ my: 0.5, borderColor: 'var(--ui-border)' }} />);
      return nodes;
    }

    if (item.items && item.items.length > 0) {
      const isOpen = Boolean(menuState.anchors[item.id]);

      nodes.push(
        <React.Fragment key={item.id}>
          <MenuItem
            onMouseEnter={(event) => {
              menuState.setAnchor(item.id, event.currentTarget);
            }}
            onClick={(event) => {
              menuState.setAnchor(item.id, event.currentTarget);
            }}
            selected={getSelectedValue(item, store)}
            aria-haspopup="true"
          >
            {renderItemContent(item)}
          </MenuItem>
          <Menu
            anchorEl={menuState.anchors[item.id]}
            open={isOpen}
            onClose={() => menuState.closeAnchor(item.id)}
            anchorOrigin={{ horizontal: 'right', vertical: 'top' }}
            transformOrigin={{ horizontal: 'left', vertical: 'top' }}
            onMouseLeave={() => menuState.closeAnchor(item.id)}
          >
            {renderMenuItems(item.items, actionHandlers, store, closeMenu, menuState)}
          </Menu>
        </React.Fragment>,
      );
    } else {
      nodes.push(
        <MenuItem
          key={item.id}
          selected={getSelectedValue(item, store)}
          onClick={() => {
            if (item.action) {
              actionHandlers[item.action]?.(item.payload);
            }
            closeMenu();
          }}
        >
          {renderItemContent(item)}
        </MenuItem>,
      );
    }

    if (item.separatorAfter) {
      nodes.push(<Divider key={`${item.id}-divider`} sx={{ my: 0.5, borderColor: 'var(--ui-border)' }} />);
    }

    return nodes;
  });

const menuConfig: { menuBar: UIConfigItem[] } = {
  menuBar: [
    {
      id: 'file',
      label: 'File',
      items: [
        { id: 'newFile', label: 'New File', action: 'noop' },
        { id: 'openFolder', label: 'Open Folder', action: 'noop' },
        {
          id: 'openRecent',
          label: 'Open Recent',
          items: [
            { id: 'recentProject1', label: 'Project 1', action: 'noop' },
            { id: 'recentProject2', label: 'Project 2', action: 'noop' },
          ],
        },
        { id: 'save', label: 'Save', action: 'noop' },
        { id: 'saveAll', label: 'Save All', action: 'noop', separatorAfter: true },
        { id: 'exit', label: 'Exit', action: 'noop' },
      ],
    },
    {
      id: 'edit',
      label: 'Edit',
      items: [
        { id: 'undo', label: 'Undo', action: 'noop' },
        { id: 'redo', label: 'Redo', action: 'noop' },
        { id: 'cut', label: 'Cut', action: 'noop' },
        { id: 'copy', label: 'Copy', action: 'noop' },
        { id: 'paste', label: 'Paste', action: 'noop' },
      ],
    },
    {
      id: 'view',
      label: 'View',
      items: [
        { id: 'toggleExplorer', label: 'Toggle Explorer', action: 'toggleExplorer', state: 'explorerOpen' },
        { id: 'toggleTerminal', label: 'Toggle Terminal', action: 'toggleTerminal', state: 'terminalOpen' },
        {
          id: 'theme',
          label: 'Theme',
          items: [
            { id: 'theme-vs-dark', label: 'VS Dark', action: 'setTheme', payload: 'vs-dark' },
            { id: 'theme-vs-light', label: 'VS Light', action: 'setTheme', payload: 'vs-light' },
            { id: 'theme-quiet-light', label: 'Quiet Light', action: 'setTheme', payload: 'quiet-light' },
            { id: 'theme-high-contrast', label: 'High Contrast', action: 'setTheme', payload: 'high-contrast' },
          ],
        },
        { id: 'textEditor', label: 'Text Editor', action: 'viewText' },
        { id: 'graphEditor', label: 'Graph Editor', action: 'viewGraphical' },
        { id: '3dView', label: '3D View', action: 'view3D' },
        { id: 'splitView', label: 'Split View', action: 'viewSplit' },
      ],
    },
  ],
};

type MenuRendererProps = {
  variant?: 'menu';
};

export const MenuRenderer: React.FC<MenuRendererProps> = () => {
  const store = useUIStore();
  const actionHandlers = getActionHandlers(store);
  const menuState = useMenuAnchors();

  return (
    <>
      {menuConfig.menuBar.map((group) => {
        const anchor = menuState.anchors[group.id];
        return (
          <React.Fragment key={group.id}>
            <button className="menu-item" onClick={(event) => menuState.setAnchor(group.id, event.currentTarget)}>
              {group.label}
            </button>
            <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={menuState.closeAll}>
              {group.items ? renderMenuItems(group.items, actionHandlers, store, menuState.closeAll, menuState) : null}
            </Menu>
          </React.Fragment>
        );
      })}
    </>
  );
};
