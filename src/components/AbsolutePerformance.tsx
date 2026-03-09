import { motion, AnimatePresence } from 'framer-motion'
import { Target } from 'lucide-react'
import type { PerformanceMetrics, PerformanceMetricsCI, LabelMode, NumericMetricKey } from '../types'

interface Props {
  metrics: PerformanceMetrics
  formalMetrics: PerformanceMetrics
  labelMode: LabelMode
  highlightedMetrics?: Set<string>
}

const METRIC_CONFIG: { key: NumericMetricKey; label: string; format: (v: number) => string; isRate: boolean }[] = [
  { key: 'precision', label: 'Precision', format: v => `${(v * 100).toFixed(1)}%`, isRate: true },
  { key: 'recall', label: 'Recall', format: v => `${(v * 100).toFixed(1)}%`, isRate: true },
  { key: 'f1', label: 'F1', format: v => `${(v * 100).toFixed(1)}%`, isRate: true },
  { key: 'alertVolume', label: 'Alert Volume', format: v => v.toLocaleString(), isRate: false },
  { key: 'sarHitRate', label: 'SAR Hit Rate', format: v => `${(v * 100).toFixed(1)}%`, isRate: true },
  { key: 'falsePositiveRate', label: 'False Positive Rate', format: v => `${(v * 100).toFixed(1)}%`, isRate: true },
]

/** Visual credible interval bar showing the posterior range */
function CredibleIntervalBar({ value, ci, isRate }: {
  value: number
  ci: [number, number]
  isRate: boolean
}) {
  if (isRate) {
    // Map 0–1 to visual range
    const lo = ci[0] * 100
    const hi = ci[1] * 100
    const point = value * 100
    // Scale to 0–100% width
    const rangeMin = Math.max(0, lo - 5)
    const rangeMax = Math.min(100, hi + 5)
    const span = rangeMax - rangeMin || 1
    const barLeft = ((lo - rangeMin) / span) * 100
    const barRight = ((hi - rangeMin) / span) * 100
    const pointPos = ((point - rangeMin) / span) * 100

    return (
      <div className="mt-2.5 space-y-1">
        <div className="relative h-1.5 rounded-full bg-black/[0.04]">
          {/* CI range bar */}
          <div
            className="absolute h-full rounded-full bg-[#00A99D]/20"
            style={{ left: `${barLeft}%`, width: `${barRight - barLeft}%` }}
          />
          {/* Point estimate */}
          <div
            className="absolute top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[#00A99D]"
            style={{ left: `${pointPos}%` }}
          />
        </div>
        <div className="flex justify-between text-[9px] font-mono text-gray-400">
          <span>{lo.toFixed(1)}%</span>
          <span className="text-[8px] text-gray-300">90% credible interval</span>
          <span>{hi.toFixed(1)}%</span>
        </div>
      </div>
    )
  }

  // Volume — show as ± range
  const lo = ci[0]
  const hi = ci[1]
  return (
    <div className="mt-2 text-[10px] font-mono text-gray-400">
      <span className="text-[8px] text-gray-300 mr-1">90% CI</span>
      {lo.toLocaleString()} – {hi.toLocaleString()}
    </div>
  )
}

export function AbsolutePerformance({ metrics, formalMetrics, labelMode, highlightedMetrics }: Props) {
  const showDual = labelMode === 'formal_inferred'
  const ci = metrics.ci

  return (
    <div className="rounded-xl border border-(--color-border) bg-(--color-surface) p-5">
      <div className="flex items-center gap-2 mb-4">
        <Target className="w-3.5 h-3.5 text-gray-400" />
        <span className="text-[10px] uppercase tracking-wider text-gray-600 font-semibold">
          Absolute Performance
        </span>
        {ci && (
          <span className="text-[9px] text-gray-400 font-normal ml-1">
            — posterior estimates with 90% credible intervals
          </span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <AnimatePresence mode="wait">
          {METRIC_CONFIG.map((mc) => {
            const isHighlighted = highlightedMetrics?.has(mc.key)
            const ciKey = mc.key as keyof PerformanceMetricsCI
            const metricCI = ci?.[ciKey]

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
                {metricCI && (
                  <CredibleIntervalBar
                    value={metrics[mc.key]}
                    ci={metricCI}
                    isRate={mc.isRate}
                  />
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
