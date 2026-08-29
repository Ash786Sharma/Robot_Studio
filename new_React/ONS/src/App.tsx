import {
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'
import IdeLayout from './features/ideUi/IdeLayout'
import './App.css'


const queryClient = new QueryClient()

function App() {
  return (
    // Provide the client to your App
    <QueryClientProvider client={queryClient}>
      <IdeLayout/>
    </QueryClientProvider>
  )
}

export default App
