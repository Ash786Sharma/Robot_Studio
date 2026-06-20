import { Button, ButtonGroup } from '@mui/material'
import * as Icons from '@mui/icons-material'

interface MenuBarButtonProps {
  menuData: { menuItems: Array<{ label: string; icon: string; action?: string }> }
}

const MenuBarButton: React.FC<MenuBarButtonProps> = ({ menuData }) => {
  return (
    <ButtonGroup variant="text" color="inherit" aria-label="menu actions">
      {menuData.menuItems.map((item) => {
        const Icon = Icons[item.icon as keyof typeof Icons]
        return (
          <Button key={item.label} size="small" sx={{ color: 'text.secondary' }}>
            {Icon ? <Icon fontSize="small" sx={{ mr: 0.5 }} /> : null}
            {item.label}
          </Button>
        )
      })}
    </ButtonGroup>
  )
}

export default MenuBarButton
