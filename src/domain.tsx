import { useEffect, useState, type ReactNode } from 'react'
import { DomainContext, type DomainMode, useDomain } from './domain-context'

const STORAGE_KEY = 'demo-aml.domain-mode'

function readInitialMode(): DomainMode {
  if (typeof window === 'undefined') return 'aml'
  const stored = window.localStorage.getItem(STORAGE_KEY)
  return stored === 'fraud' ? 'fraud' : 'aml'
}

export function DomainProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<DomainMode>(readInitialMode)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, mode)
    }
  }, [mode])

  return (
    <DomainContext.Provider value={{ mode, setMode: setModeState }}>
      {children}
      <HiddenDomainToggle />
    </DomainContext.Provider>
  )
}

/** Invisible button in the bottom-right corner. Click to flip AML ↔ Fraud.
 *  Becomes faintly visible on hover; never visible otherwise. */
function HiddenDomainToggle() {
  const { mode, setMode } = useDomain()
  return (
    <button
      aria-label="Toggle demo mode"
      title={`Switch to ${mode === 'aml' ? 'Fraud' : 'AML'} mode`}
      onClick={() => setMode(mode === 'aml' ? 'fraud' : 'aml')}
      className="fixed bottom-2 right-2 z-[100] w-4 h-4 rounded-full opacity-0 hover:opacity-60 transition-opacity cursor-pointer bg-(--color-text-disabled)"
    />
  )
}
