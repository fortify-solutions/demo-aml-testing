import type { ReactNode } from 'react'

interface Props {
  icon?: ReactNode
  children: ReactNode
  description?: ReactNode
  actions?: ReactNode
  className?: string
}

export function SectionTitle({ icon, children, description, actions, className = '' }: Props) {
  return (
    <div className={`flex items-start justify-between gap-3 ${className}`}>
      <div className="flex items-center gap-2 min-w-0">
        {icon && <span className="shrink-0 text-(--color-text-secondary)">{icon}</span>}
        <h2 className="text-[14px] font-semibold tracking-[-0.01em] text-(--color-text-primary) truncate">
          {children}
        </h2>
        {description && (
          <span className="text-[12px] text-(--color-text-secondary) truncate">{description}</span>
        )}
      </div>
      {actions && <div className="shrink-0">{actions}</div>}
    </div>
  )
}
