import { createTheme } from '@mui/material/styles'

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#6d45d8'
    },
    secondary: {
      main: '#00bcd4'
    },
    background: {
      default: '#111827',
      paper: '#1f2937'
    }
  },
  typography: {
    fontFamily: ['Inter', 'Segoe UI', 'sans-serif'].join(',')
  }
})

export default theme
