import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@/globals.css'
import App from './App'

// Upstream-only warnings (R3F 9.x still uses THREE.Clock; rapier3d-compat's wasm-bindgen init). Remove once fixed upstream.
const SUPPRESSED_WARNINGS = [
  'THREE.Clock: This module has been deprecated',
  'using deprecated parameters for the initialization function',
]
const originalWarn = console.warn
console.warn = (...args: unknown[]) => {
  const msg = args[0]
  if (typeof msg === 'string' && SUPPRESSED_WARNINGS.some((w) => msg.includes(w))) return
  originalWarn(...args)
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
