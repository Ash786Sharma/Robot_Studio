import { Box, Paper, Tab, Tabs } from '@mui/material'
import { useMemo } from 'react'
import Editor from '@monaco-editor/react'
import useAppStore from '../store/useAppStore'

const EditorPanel = () => {
  const openTabs = useAppStore((state) => state.openTabs)
  const activeTabId = useAppStore((state) => state.activeTabId)
  const setActiveTabId = useAppStore((state) => state.setActiveTabId)

  const activeTab = useMemo(
    () => openTabs.find((tab) => tab.id === activeTabId) ?? openTabs[0],
    [activeTabId, openTabs]
  )

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Paper sx={{ display: 'flex', alignItems: 'center', px: 2, bgcolor: 'background.paper', borderBottom: '1px solid rgba(255,255,255,0.08)' }} elevation={0}>
        <Tabs value={activeTab?.id} onChange={(_, value) => setActiveTabId(value)} textColor="inherit" indicatorColor="primary">
          {openTabs.map((tab) => (
            <Tab key={tab.id} label={tab.label} value={tab.id} sx={{ minHeight: 48 }} />
          ))}
        </Tabs>
      </Paper>
      <Box sx={{ flex: 1, minHeight: 0 }}>
        <Editor
          height="100%"
          defaultLanguage="javascript"
          theme="vs-dark"
          value={activeTab?.content ?? ''}
          options={{ minimap: { enabled: false }, fontSize: 14, automaticLayout: true }}
        />
      </Box>
    </Box>
  )
}

export default EditorPanel
