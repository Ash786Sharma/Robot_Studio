import Editor, { DiffEditor, type DiffOnMount, type OnMount } from '@monaco-editor/react'
import { useEffect, useRef } from "react"
import { useThemeStore } from "@/core/store/themeStore"
import { useWorkspaceStore } from "@/core/store/workSpaceStore"

const applyIdeTheme = (
  monaco: Parameters<OnMount>[1],
  currentTheme: ReturnType<typeof useThemeStore.getState>["currentTheme"]
) => {
  const styles = getComputedStyle(document.documentElement)
  const getColor = (token: string) => styles.getPropertyValue(token).trim()
  const isLightTheme = currentTheme === "theme-solarized-light"

  monaco.editor.defineTheme("ons-ide", {
    base: isLightTheme ? "vs" : "vs-dark",
    inherit: true,
    rules: [],
    colors: {
      "editor.background": getColor("--ide-surface-bg"),
      "editor.foreground": getColor("--foreground"),
      "editorLineNumber.foreground": getColor("--ide-text-inactive"),
      "editorLineNumber.activeForeground": getColor("--foreground"),
      "editorCursor.foreground": getColor("--primary"),
      "editor.selectionBackground": getColor("--ide-item-active"),
      "editor.inactiveSelectionBackground": getColor("--ide-item-hover"),
      "editor.lineHighlightBackground": getColor("--ide-item-hover"),
      "editorIndentGuide.background1": getColor("--border"),
      "editorIndentGuide.activeBackground1": getColor("--primary"),
      "editorGutter.background": getColor("--ide-surface-bg"),
      "editorWidget.background": getColor("--ide-panel-bg"),
      "editorWidget.border": getColor("--border"),
      "editorHoverWidget.background": getColor("--ide-panel-bg"),
      "editorHoverWidget.border": getColor("--border"),
    },
  })
  monaco.editor.setTheme("ons-ide")
}

interface MonacoEditorPlaceholderProps {
  showChanges?: boolean
  safetyProgram?: boolean
  fileName?: string
  statusId?: string
}

const originalCode = `// Industrial Robot Arm Control Script
function runRobotCycle() {
  const armSpeed = 100;
  const safetyLoopActive = true;
  
  if (safetyLoopActive) {
    ur5.executeTrajectory({ id: 892, acceleration: 1.2 });
    console.log("Trajectory execution started at speed: " + armSpeed);
  }
}`

const modifiedCode = `// Industrial Robot Arm Control Script
function runRobotCycle() {
  const armSpeed = 120;
  const safetyLoopActive = true;
  
  if (safetyLoopActive) {
    ur5.executeTrajectory({ id: 892, acceleration: 1.5 });
    console.log("Trajectory execution normal at speed: " + armSpeed);
  }
}`

export const MonacoEditorPlaceholder = ({ showChanges = false, safetyProgram = false, fileName, statusId = "editor" }: MonacoEditorPlaceholderProps) => {
  const currentTheme = useThemeStore((state) => state.currentTheme)
  const setTabStatus = useWorkspaceStore((state) => state.setTabStatus)
  const monacoRef = useRef<Parameters<OnMount>[1] | null>(null)

  const handleEditorMount: OnMount = (_editor, monaco) => {
    monacoRef.current = monaco
    applyIdeTheme(monaco, currentTheme)
  }

  const handleDiffEditorMount: DiffOnMount = (_editor, monaco) => {
    monacoRef.current = monaco
    applyIdeTheme(monaco, currentTheme)
  }

  useEffect(() => {
    if (monacoRef.current) {
      applyIdeTheme(monacoRef.current, currentTheme)
    }
  }, [currentTheme])

  return (
    <div className={`relative w-full h-full overflow-hidden ${safetyProgram ? "border-t-2 border-red-500/70" : ""}`}>
      {safetyProgram && <div className="absolute right-3 top-2 z-10 rounded border border-red-400/50 bg-red-950/70 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-red-200">Safety Program{fileName ? ` · ${fileName}` : ""}</div>}
      {showChanges ? (
        <DiffEditor
          height="100%"
          language="javascript"
          theme="ons-ide"
          original={originalCode}
          modified={modifiedCode}
          onMount={handleDiffEditorMount}
          options={{
            fontSize: 12,
            minimap: { enabled: false },
            automaticLayout: true,
            fontFamily: "var(--font-mono), monospace",
            renderSideBySide: true,
          }}
        />
      ) : (
        <Editor
          height="100%"
          defaultLanguage="javascript"
          theme="ons-ide"
          value={modifiedCode}
          onMount={handleEditorMount}
          onChange={() => setTabStatus(statusId, { saveStatus: "unsaved", gitStatus: "M" })}
          options={{
            fontSize: 12,
            minimap: { enabled: true },
            automaticLayout: true,
            fontFamily: "var(--font-mono), monospace",
          }}
        />
      )}
    </div>
  )
}