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

/** Build an SVG path for a Gaussian-like bell curve */
function buildBellCurvePath(width: number, height: number, meanPct: number, samples = 60): string {
  // meanPct is 0–100, position of the peak within the SVG
  const meanX = (meanPct / 100) * width
  // sigma controls how wide the bell is — use ~30% of width so tails reach edges
  const sigma = width * 0.28
  const points: [number, number][] = []

  for (let i = 0; i <= samples; i++) {
    const x = (i / samples) * width
    const z = (x - meanX) / sigma
    const y = Math.exp(-0.5 * z * z)
    points.push([x, height - y * height])
  }

  // Build path: move to bottom-left, line up through curve, back to bottom-right
  let d = `M 0 ${height}`
  for (const [x, y] of points) {
    d += ` L ${x.toFixed(1)} ${y.toFixed(1)}`
  }
  d += ` L ${width} ${height} Z`
  return d
}

/** Visual credible interval showing the posterior as a bell-curve density shape */
function CredibleIntervalBar({ value, ci, isRate, metricKey }: {
  value: number
  ci: [number, number]
  isRate: boolean
  metricKey: string
}) {
  if (isRate) {
    const lo = ci[0] * 100
    const hi = ci[1] * 100
    const point = value * 100
    // Visual range with padding
    const rangeMin = Math.max(0, lo - 5)
    const rangeMax = Math.min(100, hi + 5)
    const span = rangeMax - rangeMin || 1
    const pointPos = ((point - rangeMin) / span) * 100

    // SVG dimensions
    const svgW = 200
    const svgH = 28
    const meanX = (pointPos / 100) * svgW
    const bellPath = buildBellCurvePath(svgW, svgH, pointPos)

    // CI bar positions for the tick marks
    const loPos = ((lo - rangeMin) / span) * 100
    const hiPos = ((hi - rangeMin) / span) * 100

    return (
      <div className="mt-2.5 space-y-0.5">
        <div className="relative">
          <svg
            viewBox={`0 0 ${svgW} ${svgH}`}
            preserveAspectRatio="none"
            className="w-full"
            style={{ height: 28 }}
          >
            <defs>
              <linearGradient id={`bellGrad-${metricKey}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#005f58" stopOpacity="0.85" />
                <stop offset="40%" stopColor="#00897e" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#00A99D" stopOpacity="0.08" />
              </linearGradient>
            </defs>
            {/* Bell curve fill */}
            <path d={bellPath} fill={`url(#bellGrad-${metricKey})`} />
            {/* Point estimate line */}
            <line
              x1={meanX}
              y1={0}
              x2={meanX}
              y2={svgH}
              stroke="#004d47"
              strokeWidth="1.5"
              strokeOpacity="0.7"
            />
            {/* CI boundary ticks */}
            <line
              x1={(loPos / 100) * svgW}
              y1={svgH - 2}
              x2={(loPos / 100) * svgW}
              y2={svgH}
              stroke="#00A99D"
              strokeWidth="1"
              strokeOpacity="0.5"
            />
            <line
              x1={(hiPos / 100) * svgW}
              y1={svgH - 2}
              x2={(hiPos / 100) * svgW}
              y2={svgH}
              stroke="#00A99D"
              strokeWidth="1"
              strokeOpacity="0.5"
            />
          </svg>
        </div>
        <div className="flex justify-between text-[9px] font-mono text-gray-500">
          <span>{lo.toFixed(1)}%</span>
          <span className="text-[9px] text-gray-500">90% credible interval</span>
          <span>{hi.toFixed(1)}%</span>
        </div>
      </div>
    )
  }

  // Volume — show as ± range
  const lo = ci[0]
  const hi = ci[1]
  return (
    <div className="mt-2 text-[10px] font-mono text-gray-500">
      <span className="text-[9px] text-gray-500 mr-1">90% CI</span>
      {lo.toLocaleString()} – {hi.toLocaleString()}
    </div>
  )
}

export function AbsolutePerformance({ metrics, formalMetrics, labelMode, highlightedMetrics }: Props) {
  const showDual = labelMode === 'formal_inferred'
  const ci = metrics.ci

  return (
    <div className="rounded-xl border border-(--color-border) bg-(--color-surface) p-5 panel-shadow">
      <div className="flex items-center gap-2 mb-4">
        <Target className="w-3.5 h-3.5 text-gray-500" />
        <span className="text-[10px] uppercase tracking-wider text-gray-600 font-semibold">
          Absolute Performance
        </span>
        {ci && (
          <span className="text-[9px] text-gray-500 font-normal ml-1">
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
                  <div className="text-[11px] font-mono text-gray-500 mt-1.5">
                    formal only {mc.format(formalMetrics[mc.key])}
                  </div>
                )}
                {metricCI && (
                  <CredibleIntervalBar
                    value={metrics[mc.key]}
                    ci={metricCI}
                    isRate={mc.isRate}
                    metricKey={mc.key}
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
