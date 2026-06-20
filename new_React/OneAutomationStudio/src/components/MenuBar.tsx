import { AppBar, Container, IconButton, Toolbar, Typography } from '@mui/material'
import { DarkMode, HelpOutline, Menu as MenuIcon } from '@mui/icons-material'
import MenuBarButton from './MenuBarButton'

interface MenuBarProps {
  menuData: { menuItems: Array<{ label: string; icon: string; action?: string }> }
}

const MenuBar: React.FC<MenuBarProps> = ({ menuData }) => {
  return (
    <AppBar position="sticky" color="transparent" elevation={0} sx={{ bgcolor: 'background.paper', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
      <Toolbar sx={{ minHeight: 56, gap: 2 }}>
        <IconButton size="small" edge="start" color="inherit">
          <MenuIcon />
        </IconButton>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          Robot Studio IDE
        </Typography>
        <MenuBarButton menuData={menuData} />
        <IconButton size="small" color="inherit">
          <HelpOutline />
        </IconButton>
        <IconButton size="small" color="inherit">
          <DarkMode />
        </IconButton>
      </Toolbar>
    </AppBar>
  )
}

export default MenuBar
