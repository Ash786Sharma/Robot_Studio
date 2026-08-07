# Developer Guide

This document explains the structure of OneAutomationStudio, how the current UI works, which libraries are used, and how contributors can extend or integrate new features.

---

## 1. What this project is

OneAutomationStudio is a React + TypeScript front-end built to feel like a VS Code-like IDE for robot programming workflows. It provides a modular workspace with:
- a file explorer,
- a Monaco code editor,
- a toolbar and menu system,
- graph and 3D visualization panels,
- a terminal-like area.

The app is not just a visual mockup. It is organized so that you can gradually turn it into a real robot programming environment.

---

## 2. Main architecture

The app is split into four major layers:

1. UI components
   - Reusable interface pieces such as the editor, explorer, menu bar, and toolbar.

2. State stores
   - Zustand stores control the app’s shared state.

3. Services
   - API calls and data fetching live here.

4. Types and utilities
   - Shared interfaces and helper logic live in the types and utils folders.

This separation keeps the project maintainable as more features are added.

---

## 3. Folder structure

```text
src/
  App.tsx
  main.tsx
  index.css
  App.css
  theme.ts
  components/
    3DView/
    Editor/
    Explorer/
    GraphEditor/
    MenuBar/
    Terminal/
    ToolBar/
  hooks/
  layouts/
  services/
  store/
  types/
  utils/
```

### Key folders
- components: all visible UI blocks
- layouts: the main IDE shell and layout logic
- store: global state with Zustand
- services: backend or API communication
- types: shared TypeScript models

---

## 4. How the app works

### 4.1 Entry point
The application starts in [src/main.tsx](src/main.tsx), which renders the root component.

### 4.2 Root application component
The root component in [src/App.tsx](src/App.tsx) does three things:
- sets up the theme,
- initializes sample project data,
- renders the main IDE layout.

### 4.3 Main layout shell
The layout shell lives in [src/layouts/IDELayout.tsx](src/layouts/IDELayout.tsx).

It creates the overall structure:
- top bar,
- toolbar,
- explorer panel,
- editor/view area,
- terminal panel,
- bottom status bar.

This is the main place to add new panels or change the app’s visual structure.

### 4.4 File explorer
The explorer UI is defined in [src/components/Explorer/index.tsx](src/components/Explorer/index.tsx).

It pulls data from [src/store/explorerStore.ts](src/store/explorerStore.ts), which stores:
- file tree data,
- selected file,
- expanded folders,
- search input.

When a file is clicked, the app opens it in the editor.

### 4.5 Editor
The editor is implemented in [src/components/Editor/index.tsx](src/components/Editor/index.tsx).

It uses Monaco Editor through the `@monaco-editor/react` package. The editor state is managed by [src/store/editorStore.ts](src/store/editorStore.ts), which controls:
- open tabs,
- the active tab,
- dirty state,
- tab closing and switching.

### 4.6 View modes
The app supports multiple view modes such as:
- text editor,
- graph editor,
- 3D view,
- split view.

The current mode is stored in [src/store/uiStore.ts](src/store/uiStore.ts).

---

## 5. Libraries and how they are used

### React
React is the core rendering library. It is used to build all UI elements as components.

### TypeScript
TypeScript adds type safety and helps prevent runtime mistakes caused by incorrect props or invalid data shapes.

### Vite
Vite is used for fast local development and production builds.

### Material UI (MUI)
MUI provides practical UI building blocks such as buttons, panels, menus, text fields, toolbars, and icons. It keeps the interface consistent and visually close to a modern IDE.

### Zustand
Zustand is used for simple and lightweight global state management. It is ideal for this app because the UI has a moderate number of shared states such as explorer state, editor tabs, and view mode.

### Monaco Editor
Monaco is the heart of the text editor experience. It provides syntax highlighting, line numbers, code editing, and a familiar coding environment.

### React Flow
React Flow powers the graph editor. It enables nodes and edges, which is useful for robot workflow or behavior editor views.

### React Three Fiber / Drei / Three.js
These libraries power the 3D visualization panel. They are ideal for rendering robot-like shapes, joints, links, and scenes.

### React Query
React Query is used for handling API data fetching in a clean way. Even though the current app is mostly local-state driven, it is ready for backend integration.

### Axios
Axios is used for making HTTP requests to backend services.

---

## 6. How to modify the UI

### Add a new panel
If you want to add a new main panel, such as a diagnostics view or robot log viewer:

1. Create a new component inside [src/components](src/components).
2. Render it in [src/layouts/IDELayout.tsx](src/layouts/IDELayout.tsx).
3. Add a new view option if needed in [src/types/index.ts](src/types/index.ts).
4. Connect it to the menu bar or toolbar.

Example pattern:
```tsx
switch (viewMode.layout) {
  case 'text':
    return <CodeEditor />;
  case 'custom-view':
    return <MyCustomPanel />;
  default:
    return <CodeEditor />;
}
```

### Add a new toolbar action
To add a button to the toolbar:

1. Edit [src/components/ToolBar/index.tsx](src/components/ToolBar/index.tsx).
2. Add a new button.
3. Hook it up to a store action or handler.

### Add a new menu item
To add a menu option:

1. Edit [src/components/MenuBar/index.tsx](src/components/MenuBar/index.tsx).
2. Add a new menu entry.
3. Connect it to the desired functionality.

---

## 7. How to add a new file type or language

The editor currently maps file extensions to Monaco languages in [src/components/Editor/index.tsx](src/components/Editor/index.tsx).

To support a new file type:

1. Add the extension in the mapping object.
2. Use the correct language identifier.
3. If needed, add example sample files in [src/App.tsx](src/App.tsx).

Example:
```ts
const languageMap: Record<string, string> = {
  urdf: 'xml',
  yaml: 'yaml',
  launch: 'plaintext',
};
```

---

## 8. How to integrate backend services

The app has a service layer under [src/services](src/services).

### Recommended pattern
- create API calls in [src/services/api.ts](src/services/api.ts)
- create reusable hooks in [src/services/queries.ts](src/services/queries.ts)
- use them inside components or stores

Example:
```ts
export const fetchProjects = async () => {
  const response = await axios.get('/api/projects');
  return response.data;
};
```

This keeps UI components clean and makes the app easier to scale.

---

## 9. State management conventions

The app uses Zustand stores. Contributors should follow a simple pattern:
- UI components should render state,
- stores should own shared state,
- services should handle backend communication,
- helpers should contain reusable logic.

### Main stores
- [src/store/uiStore.ts](src/store/uiStore.ts): layout, theme, terminal, sidebar
- [src/store/explorerStore.ts](src/store/explorerStore.ts): file tree and file selection
- [src/store/editorStore.ts](src/store/editorStore.ts): open tabs and editor activity
- [src/store/projectStore.ts](src/store/projectStore.ts): project-level state

---

## 10. Styling approach

The UI uses a mix of:
- MUI styling,
- custom CSS in [src/App.css](src/App.css),
- global CSS in [src/index.css](src/index.css).

If you want to change the look and feel:
- update the theme in [src/theme.ts](src/theme.ts),
- tweak layout styles in [src/App.css](src/App.css),
- adjust global base styles in [src/index.css](src/index.css).

---

## 11. Development workflow

### Install dependencies
```bash
npm install
```

### Run development server
```bash
npm run dev
```

### Build the app
```bash
npm run build
```

### Lint the app
```bash
npm run lint
```

---

## 12. Contribution guidelines

When contributing, please keep the following in mind:
- keep components focused and reusable,
- avoid hard-coding too much logic inside UI components,
- use the existing Zustand stores for shared state,
- keep the architecture modular,
- prefer small, well-scoped changes.

### Good contribution pattern
- UI component renders the interface,
- store manages shared state,
- service handles API communication,
- utility functions hold shared logic.

### Before submitting changes
- run the build,
- check for TypeScript errors,
- verify the UI manually in the browser,
- keep the change scoped to the feature or bug being fixed.

---

## 13. Suggested next improvements

Possible future enhancements:
- real project import/export,
- saved workspace layout,
- robot model browser integration,
- URDF/ROS-specific editing tools,
- terminal command execution,
- live robot status panels,
- drag-and-drop file management.

---

## 14. Summary

OneAutomationStudio already provides a strong foundation for a VS Code-like robot programming IDE. The code is modular, state-driven, and built with modern React tools. Contributors can extend it by adding new panels, new file types, new UI actions, or backend integrations while keeping the architecture clean and maintainable.
