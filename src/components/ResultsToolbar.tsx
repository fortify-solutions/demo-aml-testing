import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check } from 'lucide-react'
import type { GroundTruth, LabelConfidence, UnitOfAnalysis, PerformanceView } from '../types'
import { CASE_LEVELS } from '../data/mockData'

interface Props {
  groundTruth: GroundTruth
  onGroundTruthChange: (g: GroundTruth) => void
  labelConfidence: LabelConfidence
  onLabelConfidenceChange: (lc: LabelConfidence) => void
  unitOfAnalysis: UnitOfAnalysis
  onUnitChange: (u: UnitOfAnalysis) => void
  performanceView: PerformanceView
  onPerformanceViewChange: (v: PerformanceView) => void
}

function GroundTruthSelector({ value, onChange }: { value: GroundTruth; onChange: (g: GroundTruth) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const options: { value: GroundTruth; label: string }[] = [
    { value: 'sar', label: 'SAR Filed' },
    ...CASE_LEVELS.map(l => ({ value: `case_level_${l}` as GroundTruth, label: `Case Level ${l}` })),
  ]

  const currentLabel = options.find(o => o.value === value)?.label ?? value

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-lg bg-gray-100 border border-gray-200 px-4 py-2 text-[12px] text-gray-800 hover:bg-gray-200 transition-all cursor-pointer"
      >
        <span className="font-semibold">{currentLabel}</span>
        <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
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
              {value === opt.value && <Check className="w-3 h-3 text-indigo-500" />}
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
    performanceView, onPerformanceViewChange,
  } = props

  const units: UnitOfAnalysis[] = ['alert', 'case', 'entity']
  const labelConfidenceOptions: { value: LabelConfidence; label: string }[] = [
    { value: 'formal_only', label: 'Formal' },
    { value: 'formal_inferred', label: 'Formal + Inferred' },
  ]

  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-3 rounded-xl border border-gray-200 bg-white px-6 py-4 shadow-md">
      {/* Ground Truth */}
      <div className="flex items-center gap-3">
        <span className="text-[11px] uppercase tracking-widest text-gray-400 font-bold">Ground Truth</span>
        <GroundTruthSelector value={groundTruth} onChange={onGroundTruthChange} />
      </div>

      <div className="w-px h-6 bg-gray-200" />

      {/* Label Confidence */}
      <div className="flex items-center gap-3">
        <span className="text-[11px] uppercase tracking-widest text-gray-400 font-bold">Labels</span>
        <div className="flex rounded-lg bg-gray-100 border border-gray-200 p-0.5">
          {labelConfidenceOptions.map(opt => (
            <button
              key={opt.value}
              onClick={() => onLabelConfidenceChange(opt.value)}
              className={`rounded-md px-4 py-2 text-[12px] font-semibold transition-all cursor-pointer ${
                labelConfidence === opt.value
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="w-px h-6 bg-gray-200" />

      {/* Unit of Analysis */}
      <div className="flex items-center gap-3">
        <span className="text-[11px] uppercase tracking-widest text-gray-400 font-bold">Unit</span>
        <div className="flex rounded-lg bg-gray-100 border border-gray-200 p-0.5">
          {units.map(u => (
            <button
              key={u}
              onClick={() => onUnitChange(u)}
              className={`rounded-md px-4 py-2 text-[12px] font-semibold capitalize transition-all cursor-pointer ${
                unitOfAnalysis === u
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {u}
            </button>
          ))}
        </div>
      </div>

      <div className="w-px h-6 bg-gray-200" />

      {/* Performance View */}
      <div className="flex items-center gap-3">
        <span className="text-[11px] uppercase tracking-widest text-gray-400 font-bold">View</span>
        <div className="flex rounded-lg bg-gray-100 border border-gray-200 p-0.5">
          {(['absolute', 'marginal'] as PerformanceView[]).map(v => (
            <button
              key={v}
              onClick={() => onPerformanceViewChange(v)}
              className={`rounded-md px-4 py-2 text-[12px] font-semibold capitalize transition-all cursor-pointer ${
                performanceView === v
                  ? 'bg-[#00A99D] text-white shadow-sm'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
