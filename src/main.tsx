import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { DomainProvider } from './domain'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <DomainProvider>
      <App />
    </DomainProvider>
  </StrictMode>,
)
