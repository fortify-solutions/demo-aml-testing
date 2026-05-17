import type { ReactNode } from 'react'

interface Props {
  label: ReactNode
  value: ReactNode
  subtext?: ReactNode
  valueClassName?: string
  align?: 'left' | 'center' | 'right'
}

const ALIGN: Record<NonNullable<Props['align']>, string> = {
  left: 'items-start text-left',
  center: 'items-center text-center',
  right: 'items-end text-right',
}

export function StatCard({ label, value, subtext, valueClassName = '', align = 'left' }: Props) {
  return (
    <div className={`flex flex-col ${ALIGN[align]}`}>
      <span className="text-[11px] font-medium text-(--color-text-secondary) tracking-[0.08em] uppercase mb-1">
        {label}
      </span>
      <span className={`text-[22px] leading-none font-medium text-(--color-text-primary) tracking-[-0.02em] tabular-nums ${valueClassName}`}>
        {value}
      </span>
      {subtext && (
        <span className="text-[12px] text-(--color-text-secondary) mt-1">
          {subtext}
        </span>
      )}
    </div>
  )
}
