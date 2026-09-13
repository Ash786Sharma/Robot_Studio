import {
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'
import IdeLayout from '@/features/ide-shell/components/IdeLayout'
import { AuthGate } from '@/features/auth/components/AuthGate'


const queryClient = new QueryClient()

function App() {
  return (
    // Provide the client to your App
    <QueryClientProvider client={queryClient}>
      <AuthGate>
        <IdeLayout/>
      </AuthGate>
    </QueryClientProvider>
  )
}

export default App
