import type { ReactNode } from 'react'

interface Props {
  children: ReactNode
  elevated?: boolean
  padded?: boolean
  className?: string
}

export function Card({ children, elevated = false, padded = true, className = '' }: Props) {
  return (
    <div
      className={`rounded-md border border-(--color-border-subtle) bg-(--color-panel) ${elevated ? 'elevated-shadow' : 'panel-shadow'} ${padded ? 'p-4' : ''} ${className}`}
    >
      {children}
    </div>
  )
}
