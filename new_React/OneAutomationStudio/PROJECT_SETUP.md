# One Automation Studio - Web IDE Frontend

A comprehensive web-based IDE frontend for robot, PLC, and HMI programming built with modern web technologies.

## Features

### Core IDE Features
- **Menu Bar** - File, Edit, View, and other menu operations
- **Tool Bar** - Quick access buttons for common operations
- **File Explorer** - Tree-view file navigation with search
- **Code Editor** - Monaco editor with multi-language support
- **Terminal** - Integrated terminal for command execution
- **Resizable Panels** - Flexible layout with resizable sections

### Programming & Visualization
- **Text Code Editing** - Full-featured code editor with syntax highlighting
- **Graphical Programming** - Visual program editor using React Flow
- **3D Visualization** - Three.js and React Three Fiber for 3D robot visualization
- **Split View** - View multiple panels simultaneously

### Technologies Used
- **Frontend Framework**: React 19 with TypeScript
- **Build Tool**: Vite
- **UI Components**: Material-UI (MUI)
- **State Management**: Zustand
- **Data Fetching**: TanStack Query
- **Code Editor**: Monaco Editor
- **Visual Programming**: React Flow
- **3D Graphics**: Three.js, React Three Fiber
- **HTTP Client**: Axios

## Project Structure

```
src/
├── components/           # React components
│   ├── MenuBar/        # Menu bar component
│   ├── ToolBar/        # Toolbar component
│   ├── Explorer/       # File explorer
│   ├── Editor/         # Code editor
│   ├── Terminal/       # Terminal
│   ├── 3DView/         # 3D visualization
│   └── GraphEditor/    # Visual programming
├── store/              # Zustand stores
│   ├── editorStore.ts
│   ├── explorerStore.ts
│   ├── uiStore.ts
│   └── projectStore.ts
├── services/           # API services
│   ├── api.ts
│   └── queries.ts
├── hooks/              # Custom React hooks
│   ├── useEditorTabs.ts
│   └── useFileExplorer.ts
├── layouts/            # Layout components
│   ├── IDELayout.tsx
│   └── ResizePanel.tsx
├── types/              # TypeScript types
├── utils/              # Utility functions
│   ├── helpers.ts
│   └── constants.ts
├── theme.ts            # MUI theme configuration
├── App.tsx             # Main app component
└── main.tsx            # Entry point
```

## Getting Started

### Installation

```bash
cd new_React/OneAutomationStudio
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build

```bash
npm run build
```

### Preview

```bash
npm run preview
```

## Usage

### Opening Files
- Click on files in the Explorer to open them in the editor
- Use Ctrl+O to open a file dialog

### Editor Commands
- **Ctrl+S**: Save current file
- **Ctrl+Shift+S**: Save all files
- **Ctrl+N**: New file
- **Ctrl+W**: Close tab
- **Ctrl+F**: Find
- **Ctrl+H**: Replace
- **Ctrl+/**: Toggle comment

### View Modes
Switch between different view modes:
- **Text**: Code editing mode (default)
- **Graphical**: Visual programming mode
- **Split**: Side-by-side text and 3D view
- **3D**: 3D robot visualization

### Terminal
- Toggle terminal with Ctrl+`
- Execute commands and view output
- Multiple terminal tabs supported

## Customization

### Theme
Edit `src/theme.ts` to customize colors and styling.

### Keyboard Shortcuts
Modify shortcuts in `src/utils/constants.ts`.

### API Configuration
Set `REACT_APP_API_URL` environment variable or modify `src/services/api.ts`.

## Dependencies

### Main Dependencies
- react: 19.2.6
- react-dom: 19.2.6
- @mui/material: Latest
- @mui/icons-material: Latest
- zustand: State management
- @tanstack/react-query: Data fetching
- monaco-editor: Code editor
- reactflow: Visual programming
- three: 3D graphics
- @react-three/fiber: React renderer for three.js
- axios: HTTP client

### Dev Dependencies
- TypeScript: Type checking
- Vite: Build tool
- ESLint: Code linting
- Various type definitions

## Architecture

### State Management
The app uses Zustand for global state management:
- **editorStore**: Manages editor tabs and active file
- **explorerStore**: Manages file tree and selection
- **uiStore**: Manages UI state (sidebar, terminal visibility)
- **projectStore**: Manages current project and robot models

### API Integration
TanStack Query provides:
- Server state management
- Automatic caching and synchronization
- Background refetching
- Optimistic updates

### Component Structure
- **Layout Components**: IDELayout and ResizePanel handle overall structure
- **Feature Components**: MenuBar, Explorer, Editor, Terminal, etc. are independently functional
- **Hooks**: Custom hooks (useEditorTabs, useFileExplorer) encapsulate logic

## Next Steps

1. **Connect Backend API**: Update API endpoints in `src/services/queries.ts`
2. **Implement File Operations**: Add save, load, and file management features
3. **Add Robot Model Support**: Integrate robot model loading and visualization
4. **Implement Project Management**: Add project creation, saving, and loading
5. **Add Debugging Support**: Implement debugging features and breakpoints
6. **Performance Optimization**: Add code splitting and lazy loading

## Contributing

See the main repository for contribution guidelines.

## License

MIT
