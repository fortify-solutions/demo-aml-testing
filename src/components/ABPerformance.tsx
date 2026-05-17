import { motion, AnimatePresence } from 'framer-motion'
import { GitCompare } from 'lucide-react'
import type { ABMetrics, ASelection, LabelMode, NumericMetricKey, PerformanceMetricsCI, Rule } from '../types'
import { MARGINAL_PEER_COUNTS } from '../data/mockData'
import { useCopy } from '../domain-context'
import { ASelector } from './ASelector'

interface Props {
  ab: ABMetrics
  rule: Rule
  aSelection: ASelection
  onASelectionChange: (s: ASelection) => void
  labelMode: LabelMode
  highlightedMetrics?: Set<string>
}

function buildMetricConfig(hitRateName: string): { key: NumericMetricKey; label: string; format: (v: number) => string; isRate: boolean; lowerIsBetter?: boolean }[] {
  return [
    { key: 'precision', label: 'Precision', format: v => `${(v * 100).toFixed(1)}%`, isRate: true },
    { key: 'recall', label: 'Recall', format: v => `${(v * 100).toFixed(1)}%`, isRate: true },
    { key: 'f1', label: 'F1', format: v => `${(v * 100).toFixed(1)}%`, isRate: true },
    { key: 'alertVolume', label: 'Alert Volume', format: v => v.toLocaleString(), isRate: false },
    { key: 'sarHitRate', label: hitRateName, format: v => `${(v * 100).toFixed(1)}%`, isRate: true },
    { key: 'falsePositiveRate', label: 'False Positive Rate', format: v => `${(v * 100).toFixed(1)}%`, isRate: true, lowerIsBetter: true },
  ]
}

function formatDelta(val: number, key: NumericMetricKey, lowerIsBetter?: boolean): { text: string; color: string } {
  if (key === 'alertVolume') {
    if (Math.abs(val) < 0.5) return { text: '0', color: 'text-gray-500' }
    const sign = val > 0 ? '+' : ''
    return { text: `${sign}${val.toLocaleString()}`, color: 'text-gray-600' }
  }
  const pp = val * 100
  if (Math.abs(pp) < 0.05) return { text: '0.0pp', color: 'text-gray-500' }
  const sign = pp > 0 ? '+' : ''
  const isGood = lowerIsBetter ? pp < 0 : pp > 0
  return {
    text: `${sign}${pp.toFixed(1)}pp`,
    color: isGood ? 'text-[#16a34a]' : 'text-[#dc2626]',
  }
}

/** Slim bell-curve density bar for credible intervals (only shown in formal_inferred mode) */
function buildBellCurvePath(width: number, height: number, meanPct: number, samples = 60): string {
  const meanX = (meanPct / 100) * width
  const sigma = width * 0.28
  const points: [number, number][] = []
  for (let i = 0; i <= samples; i++) {
    const x = (i / samples) * width
    const z = (x - meanX) / sigma
    const y = Math.exp(-0.5 * z * z)
    points.push([x, height - y * height])
  }
  let d = `M 0 ${height}`
  for (const [x, y] of points) d += ` L ${x.toFixed(1)} ${y.toFixed(1)}`
  d += ` L ${width} ${height} Z`
  return d
}

function CIBar({ value, ci, isRate, metricKey }: { value: number; ci: [number, number]; isRate: boolean; metricKey: string }) {
  if (!isRate) {
    return (
      <div className="mt-1 text-[9px] font-mono text-gray-500">
        <span className="text-gray-400 mr-1">90% CI</span>
        {ci[0].toLocaleString()}–{ci[1].toLocaleString()}
      </div>
    )
  }
  const lo = ci[0] * 100
  const hi = ci[1] * 100
  const point = value * 100
  const rangeMin = Math.max(0, lo - 5)
  const rangeMax = Math.min(100, hi + 5)
  const span = rangeMax - rangeMin || 1
  const pointPos = ((point - rangeMin) / span) * 100
  const svgW = 160
  const svgH = 16
  const meanX = (pointPos / 100) * svgW
  return (
    <svg viewBox={`0 0 ${svgW} ${svgH}`} preserveAspectRatio="none" className="w-full mt-1" style={{ height: 16 }}>
      <defs>
        <linearGradient id={`bg-${metricKey}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.7" />
          <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0.05" />
        </linearGradient>
      </defs>
      <path d={buildBellCurvePath(svgW, svgH, pointPos)} fill={`url(#bg-${metricKey})`} />
      <line x1={meanX} y1={0} x2={meanX} y2={svgH} stroke="var(--color-primary)" strokeWidth={1.2} strokeOpacity={0.7} />
    </svg>
  )
}

function describeMode(aSelection: ASelection, rule: Rule): string {
  switch (aSelection.kind) {
    case 'portfolio_minus': {
      const peerCount = MARGINAL_PEER_COUNTS[aSelection.level]
      const scope = aSelection.level === 'global' ? 'global' : rule.taxonomy[aSelection.level as 'l1' | 'l2' | 'l3']
      return `portfolio ${peerCount > 0 ? `of ${peerCount} ${scope} rules` : `(${scope})`} with vs without this rule`
    }
    case 'prior_version':
      return `this rule (B) vs an earlier version (A) — standalone`
    case 'empty':
      return `this rule on its own (B) vs no rule at all (A)`
    case 'specific_rule':
      return `this rule (B) vs a different existing rule (A) — standalone`
  }
}

export function ABPerformance({ ab, rule, aSelection, onASelectionChange, labelMode, highlightedMetrics }: Props) {
  const copy = useCopy()
  const METRIC_CONFIG = buildMetricConfig(copy.hitRateName)
  const { a, b, delta } = ab
  const showCI = labelMode === 'formal_inferred' && !!b.ci

  return (
    <div className="rounded-md border border-(--color-border-subtle) bg-(--color-panel) p-4 panel-shadow">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <GitCompare className="w-3.5 h-3.5 text-(--color-text-secondary) shrink-0" />
          <span className="text-[11px] uppercase tracking-[0.08em] text-(--color-text-primary) font-semibold">
            A / B Performance
          </span>
          <span className="text-[11px] text-(--color-text-secondary) truncate">
            {describeMode(aSelection, rule)}
          </span>
        </div>

        {/* A selector — popover with 4 modes */}
        <ASelector
          selection={aSelection}
          onChange={onASelectionChange}
          currentRule={rule}
          taxonomy={rule.taxonomy}
        />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={`${aSelection.kind}-${aSelection.kind === 'portfolio_minus' ? aSelection.level : aSelection.kind === 'prior_version' ? aSelection.version : aSelection.kind === 'specific_rule' ? aSelection.ruleId : ''}-${labelMode}`}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.2 }}
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2"
        >
          {METRIC_CONFIG.map(mc => {
            const aVal = a[mc.key]
            const bVal = b[mc.key]
            const dVal = delta[mc.key]
            const dFmt = formatDelta(dVal, mc.key, mc.lowerIsBetter)
            const isHighlighted = highlightedMetrics?.has(mc.key)
            const ciKey = mc.key as keyof PerformanceMetricsCI
            const metricCI = b.ci?.[ciKey]

            return (
              <div
                key={mc.key}
                className={`rounded-md bg-white px-3 py-2.5 transition-colors ${
                  isHighlighted ? 'ring-2 ring-violet-400/40 border border-violet-400/40' : 'border border-(--color-border-subtle)'
                }`}
              >
                <div className="text-[10px] uppercase tracking-[0.08em] text-(--color-text-secondary) mb-1 font-medium leading-tight">
                  {mc.label}
                </div>

                {/* B = hero value */}
                <div className="font-mono text-[20px] leading-tight text-(--color-text-primary) tabular-nums">
                  {mc.format(bVal)}
                </div>

                {/* A = secondary, with arrow + delta inline */}
                <div className="flex items-baseline justify-between gap-2 mt-1">
                  <span className="text-[10px] font-mono tabular-nums text-(--color-text-secondary) truncate">
                    A {mc.format(aVal)}
                  </span>
                  <span className={`text-[10px] font-mono tabular-nums font-semibold whitespace-nowrap ${dFmt.color}`}>
                    {dFmt.text}
                  </span>
                </div>

                {/* CI density (rendered only when inferred labels are on) */}
                {showCI && metricCI && (
                  <CIBar value={bVal} ci={metricCI} isRate={mc.isRate} metricKey={mc.key} />
                )}
              </div>
            )
          })}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
