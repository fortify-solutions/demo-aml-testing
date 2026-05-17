import type { ReactNode } from 'react'

type Tone = 'green' | 'yellow' | 'red' | 'blue' | 'gray' | 'purple'
type Variant = 'success' | 'warning' | 'danger' | 'info' | 'neutral'
type Size = 'xs' | 'sm' | 'md'

interface Props {
  children: ReactNode
  variant?: Variant
  color?: Tone
  size?: Size
  className?: string
}

const VARIANT_TO_TONE: Record<Variant, Tone> = {
  success: 'green',
  warning: 'yellow',
  danger: 'red',
  info: 'blue',
  neutral: 'gray',
}

const SIZE: Record<Size, string> = {
  xs: 'px-1.5 py-0 text-[10px] min-h-[18px]',
  sm: 'px-1.5 py-0 text-[10px] min-h-[20px]',
  md: 'px-2 py-0 text-[11px] min-h-[24px]',
}

export function Pill({ children, variant, color, size = 'sm', className = '' }: Props) {
  const tone: Tone = color ?? (variant ? VARIANT_TO_TONE[variant] : 'gray')
  return (
    <span
      className={`inline-flex items-center rounded-sm border whitespace-nowrap font-medium tracking-[0.01em] ${SIZE[size]} ${className}`}
      style={{
        backgroundColor: `var(--status-${tone}-bg)`,
        color: `var(--status-${tone}-fg)`,
        borderColor: `var(--status-${tone}-border)`,
      }}
    >
      {children}
    </span>
  )
}
