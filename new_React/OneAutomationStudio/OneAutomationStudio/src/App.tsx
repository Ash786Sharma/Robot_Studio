import { ThemeProvider, CssBaseline } from '@mui/material'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import Layout from './components/Layout'
import theme from './theme'
import './App.css'

const queryClient = new QueryClient()

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <QueryClientProvider client={queryClient}>
        <Layout />
      </QueryClientProvider>
    </ThemeProvider>
  )
}

export default App
