import { Box } from '@mui/material'
import MenuBar from './MenuBar'
import ToolBar from './ToolBar'
import MainDrawer from './MainDrawer'
import EditorPanel from './EditorPanel'
import useAppStore from './store/useAppStore'
import menuDataJson from './assets/menuData.json'
import toolDataJson from './assets/toolData.json'

const Layout = () => {
  const drawerData = useAppStore((state) => state.drawerData)

  return (
    <Box className="app-shell">
      <MenuBar menuData={menuDataJson} />
      <ToolBar toolData={toolDataJson} />
      <Box className="workspace">
        <MainDrawer drawerData={drawerData} />
        <Box className="editor-pane">
          <EditorPanel />
        </Box>
      </Box>
    </Box>
  )
}

export default Layout
