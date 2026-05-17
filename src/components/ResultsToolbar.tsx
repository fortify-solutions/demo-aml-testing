import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check } from 'lucide-react'
import type { GroundTruth, LabelConfidence, UnitOfAnalysis } from '../types'
import { useCopy } from '../domain-context'

interface Props {
  groundTruth: GroundTruth
  onGroundTruthChange: (g: GroundTruth) => void
  labelConfidence: LabelConfidence
  onLabelConfidenceChange: (lc: LabelConfidence) => void
  unitOfAnalysis: UnitOfAnalysis
  onUnitChange: (u: UnitOfAnalysis) => void
}

function GroundTruthSelector({ value, onChange }: { value: GroundTruth; onChange: (g: GroundTruth) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const copy = useCopy()

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const options = copy.groundTruthOptions.map(o => ({ value: o.value as GroundTruth, label: o.label }))

  const currentLabel = options.find(o => o.value === value)?.label ?? value

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-sm bg-white border border-(--color-border-strong) px-3 py-1.5 text-[12px] text-(--color-text-primary) hover:bg-(--color-surface-hover) transition-colors cursor-pointer"
      >
        <span className="font-medium">{currentLabel}</span>
        <ChevronDown className="w-3.5 h-3.5 text-(--color-text-secondary)" />
      </button>
      {open && (
        <div className="absolute z-50 top-full left-0 mt-1 rounded-lg bg-white border border-(--color-border) shadow-xl overflow-hidden min-w-[160px]">
          {options.map(opt => (
            <button
              key={opt.value}
              onClick={() => { onChange(opt.value); setOpen(false) }}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] text-gray-700 hover:bg-black/[0.04] transition-colors cursor-pointer"
            >
              <span className="flex-1 text-left">{opt.label}</span>
              {value === opt.value && <Check className="w-3 h-3 text-(--color-accent)" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export function ResultsToolbar(props: Props) {
  const {
    groundTruth, onGroundTruthChange,
    labelConfidence, onLabelConfidenceChange,
    unitOfAnalysis, onUnitChange,
  } = props

  const units: UnitOfAnalysis[] = ['alert', 'case', 'entity']
  const labelConfidenceOptions: { value: LabelConfidence; label: string }[] = [
    { value: 'formal_only', label: 'Formal' },
    { value: 'formal_inferred', label: 'Formal + Inferred' },
  ]

  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-3 rounded-md border border-(--color-border-subtle) bg-(--color-panel) px-4 py-3 panel-shadow">
      {/* Ground Truth */}
      <div className="flex items-center gap-2.5">
        <span className="text-[10px] uppercase tracking-[0.08em] text-(--color-text-secondary) font-semibold">Ground Truth</span>
        <GroundTruthSelector value={groundTruth} onChange={onGroundTruthChange} />
      </div>

      <div className="w-px h-5 bg-(--color-border-subtle)" />

      {/* Label Confidence */}
      <div className="flex items-center gap-2.5">
        <span className="text-[10px] uppercase tracking-[0.08em] text-(--color-text-secondary) font-semibold">Labels</span>
        <div className="flex rounded-sm bg-gray-50 border border-(--color-border-subtle) p-0.5">
          {labelConfidenceOptions.map(opt => (
            <button
              key={opt.value}
              onClick={() => onLabelConfidenceChange(opt.value)}
              className={`rounded-sm px-3 py-1.5 text-[12px] font-medium transition-colors cursor-pointer ${
                labelConfidence === opt.value
                  ? 'bg-white text-(--color-text-primary) shadow-sm border border-(--color-border-subtle)'
                  : 'text-(--color-text-secondary) hover:text-(--color-text-primary)'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="w-px h-5 bg-(--color-border-subtle)" />

      {/* Unit of Analysis */}
      <div className="flex items-center gap-2.5">
        <span className="text-[10px] uppercase tracking-[0.08em] text-(--color-text-secondary) font-semibold">Unit</span>
        <div className="flex rounded-sm bg-gray-50 border border-(--color-border-subtle) p-0.5">
          {units.map(u => (
            <button
              key={u}
              onClick={() => onUnitChange(u)}
              className={`rounded-sm px-3 py-1.5 text-[12px] font-medium capitalize transition-colors cursor-pointer ${
                unitOfAnalysis === u
                  ? 'bg-white text-(--color-text-primary) shadow-sm border border-(--color-border-subtle)'
                  : 'text-(--color-text-secondary) hover:text-(--color-text-primary)'
              }`}
            >
              {u}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
