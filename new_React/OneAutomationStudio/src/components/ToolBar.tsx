import { AppBar, Container, Toolbar } from '@mui/material'
import ToolBarButtons from './ToolBarButtons'

interface ToolBarProps {
  toolData: { toolItems: Array<{ label: string; icon: string }> }
}

const ToolBar: React.FC<ToolBarProps> = ({ toolData }) => {
  return (
    <AppBar position="sticky" color="transparent" elevation={0} sx={{ bgcolor: 'background.default', borderBottom: '1px solid rgba(255,255,255,0.08)', top: 56 }}>
      <Container maxWidth="xl">
        <Toolbar sx={{ minHeight: 48, px: 0 }}>
          <ToolBarButtons toolData={toolData} />
        </Toolbar>
      </Container>
    </AppBar>
  )
}

export default ToolBar
