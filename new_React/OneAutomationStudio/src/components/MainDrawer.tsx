import { Box, List, ListItemButton, ListItemIcon, ListItemText, Paper, Typography } from '@mui/material'
import * as Icons from '@mui/icons-material'
import useAppStore, { DrawerNode } from '../store/useAppStore'

interface MainDrawerProps {
  drawerData: DrawerNode[]
}

const MainDrawer: React.FC<MainDrawerProps> = ({ drawerData }) => {
  const setDrawerData = useAppStore((state) => state.setDrawerData)

  return (
    <Paper sx={{ width: 280, bgcolor: 'background.paper', borderRadius: 0, borderRight: '1px solid rgba(255,255,255,0.08)', overflow: 'auto' }} elevation={0}>
      <Box sx={{ px: 2, py: 1, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <Typography variant="subtitle2" color="text.secondary">
          Explorer
        </Typography>
      </Box>
      <List>
        {drawerData.length === 0 ? (
          <ListItemText sx={{ px: 2, py: 1 }} primary="No project loaded" secondary="Open a project to show files" />
        ) : (
          drawerData.map((node) => {
            const Icon = node.icon ? (Icons[node.icon as keyof typeof Icons] as React.ElementType) : null
            return (
              <ListItemButton key={node.id}>
                {Icon ? (
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <Icon fontSize="small" />
                  </ListItemIcon>
                ) : null}
                <ListItemText primary={node.label} />
              </ListItemButton>
            )
          })
        )}
      </List>
    </Paper>
  )
}

export default MainDrawer
