import { Button, ButtonGroup } from '@mui/material'
import * as Icons from '@mui/icons-material'

interface ToolBarButtonsProps {
  toolData: { toolItems: Array<{ label: string; icon: string }> }
}

const ToolBarButtons: React.FC<ToolBarButtonsProps> = ({ toolData }) => {
  return (
    <ButtonGroup variant="text" color="inherit" aria-label="toolbar actions" sx={{ width: '100%' }}>
      {toolData.toolItems.map((tool) => {
        const Icon = Icons[tool.icon as keyof typeof Icons]
        return (
          <Button key={tool.label} size="small" sx={{ color: 'text.secondary' }}>
            {Icon ? <Icon fontSize="small" sx={{ mr: 0.5 }} /> : null}
            {tool.label}
          </Button>
        )
      })}
    </ButtonGroup>
  )
}

export default ToolBarButtons
