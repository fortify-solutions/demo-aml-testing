import { motion, AnimatePresence } from 'framer-motion'
import { Target } from 'lucide-react'
import type { PerformanceMetrics, LabelMode } from '../types'

interface Props {
  metrics: PerformanceMetrics
  formalMetrics: PerformanceMetrics
  labelMode: LabelMode
  highlightedMetrics?: Set<string>
}

const METRIC_CONFIG: { key: keyof PerformanceMetrics; label: string; format: (v: number) => string }[] = [
  { key: 'precision', label: 'Precision', format: v => `${(v * 100).toFixed(1)}%` },
  { key: 'recall', label: 'Recall', format: v => `${(v * 100).toFixed(1)}%` },
  { key: 'f1', label: 'F1', format: v => `${(v * 100).toFixed(1)}%` },
  { key: 'alertVolume', label: 'Alert Volume', format: v => v.toLocaleString() },
  { key: 'sarHitRate', label: 'SAR Hit Rate', format: v => `${(v * 100).toFixed(1)}%` },
  { key: 'falsePositiveRate', label: 'False Positive Rate', format: v => `${(v * 100).toFixed(1)}%` },
]

export function AbsolutePerformance({ metrics, formalMetrics, labelMode, highlightedMetrics }: Props) {
  const showDual = labelMode === 'formal_inferred'

  return (
    <div className="rounded-xl border border-(--color-border) bg-(--color-surface) p-5">
      <div className="flex items-center gap-2 mb-4">
        <Target className="w-3.5 h-3.5 text-gray-400" />
        <span className="text-[10px] uppercase tracking-wider text-gray-600 font-semibold">
          Absolute Performance
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <AnimatePresence mode="wait">
          {METRIC_CONFIG.map((mc) => {
            const isHighlighted = highlightedMetrics?.has(mc.key)
            return (
              <motion.div
                key={`${mc.key}-${labelMode}`}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.25 }}
                className={`rounded-xl bg-(--color-card) p-4 stage-glow transition-all ${
                  isHighlighted ? 'border border-violet-500/40' : 'border border-(--color-border)'
                }`}
              >
                <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-2">
                  {mc.label}
                </div>
                <div className="text-[28px] font-mono text-gray-900 leading-none">
                  {mc.format(metrics[mc.key])}
                </div>
                {showDual && (
                  <div className="text-[11px] font-mono text-gray-400 mt-1.5">
                    formal only {mc.format(formalMetrics[mc.key])}
                  </div>
                )}
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </div>
  )
}

export { METRIC_CONFIG }
