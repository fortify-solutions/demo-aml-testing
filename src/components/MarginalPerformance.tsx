import { motion, AnimatePresence } from 'framer-motion'
import { GitBranch } from 'lucide-react'
import type { PerformanceMetrics, TaxonomyLevel, LabelMode } from '../types'
import { MARGINAL_PEER_COUNTS } from '../data/mockData'
import { MarginalContributionChart } from './MarginalContributionChart'

interface Props {
  marginalData: Record<TaxonomyLevel, PerformanceMetrics>
  baselineData: Record<TaxonomyLevel, PerformanceMetrics>
  absoluteData: PerformanceMetrics
  taxonomy: { l1: string; l2: string; l3: string }
  selectedLevel: TaxonomyLevel
  onLevelChange: (level: TaxonomyLevel) => void
  labelMode: LabelMode
}

const METRIC_CONFIG: { key: keyof PerformanceMetrics; label: string; format: (v: number) => string; isRate: boolean; invertColor?: boolean }[] = [
  { key: 'precision', label: 'Precision', format: v => `${(v * 100).toFixed(1)}%`, isRate: true },
  { key: 'recall', label: 'Recall', format: v => `${(v * 100).toFixed(1)}%`, isRate: true },
  { key: 'f1', label: 'F1', format: v => `${(v * 100).toFixed(1)}%`, isRate: true },
  { key: 'alertVolume', label: 'Alert Volume', format: v => v.toLocaleString(), isRate: false },
  { key: 'sarHitRate', label: 'SAR Hit Rate', format: v => `${(v * 100).toFixed(1)}%`, isRate: true },
  { key: 'falsePositiveRate', label: 'False Positive Rate', format: v => `${(v * 100).toFixed(1)}%`, isRate: true, invertColor: true },
]

const LEVEL_LABELS: Record<TaxonomyLevel, string> = {
  l1: 'L1',
  l2: 'L2',
  l3: 'L3',
  global: 'Global',
}

function formatDelta(val: number, key: keyof PerformanceMetrics): { text: string; color: string } {
  if (key === 'alertVolume') {
    const sign = val > 0 ? '+' : ''
    return { text: `${sign}${val.toLocaleString()}`, color: 'text-gray-400' }
  }
  const pp = val * 100
  if (Math.abs(pp) < 0.05) return { text: '0.0pp', color: 'text-gray-400' }
  const sign = pp > 0 ? '+' : ''
  const isGood = key === 'falsePositiveRate' ? pp < 0 : pp > 0
  return {
    text: `${sign}${pp.toFixed(1)}pp`,
    color: isGood ? 'text-[#16a34a]' : 'text-[#dc2626]',
  }
}

function InlineProportionBar({ baseline, marginal, isRate, invertColor }: { baseline: number; marginal: number; isRate: boolean; invertColor?: boolean }) {
  if (!isRate || invertColor) return null
  const total = baseline + marginal
  if (total <= 0) return null

  const baselinePct = Math.min(100, (baseline / Math.max(total, 0.001)) * 100)
  const marginalPct = Math.min(100 - baselinePct, (marginal / Math.max(total, 0.001)) * 100)

  return (
    <div className="mt-3 space-y-1">
      <div className="h-1.5 rounded-full overflow-hidden bg-black/[0.06] flex">
        <div
          className="h-full rounded-l-full"
          style={{ width: `${baselinePct}%`, backgroundColor: '#6366f1', opacity: 0.35 }}
        />
        <div
          className="h-full rounded-r-full"
          style={{
            width: `${marginalPct}%`,
            backgroundColor: invertColor ? '#dc2626' : '#8b5cf6',
            opacity: 0.9,
          }}
        />
      </div>
      <div className="flex justify-between text-[9px] text-gray-400">
        <span>peer group</span>
        <span>+ this rule</span>
      </div>
    </div>
  )
}

export function MarginalPerformance({ marginalData, baselineData, absoluteData, taxonomy, selectedLevel, onLevelChange, labelMode }: Props) {
  const metrics = marginalData[selectedLevel]
  const baseline = baselineData[selectedLevel]
  const levelName = selectedLevel === 'global' ? 'all' : taxonomy[selectedLevel as 'l1' | 'l2' | 'l3']
  const peerCount = MARGINAL_PEER_COUNTS[selectedLevel]

  const levels: TaxonomyLevel[] = ['l1', 'l2', 'l3', 'global']

  return (
    <div className="rounded-xl border border-(--color-border) bg-(--color-surface) p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <GitBranch className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-[10px] uppercase tracking-wider text-gray-600 font-semibold">
            Marginal Performance
          </span>
        </div>

        {/* Taxonomy Toggle */}
        <div className="flex rounded-xl bg-black/[0.03] border border-(--color-border) p-0.5">
          {levels.map(level => (
            <button
              key={level}
              onClick={() => onLevelChange(level)}
              className={`rounded-lg px-2.5 py-1 text-[10px] font-medium transition-all cursor-pointer ${
                selectedLevel === level
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {LEVEL_LABELS[level]}
              {level !== 'global' && (
                <span className="text-gray-300 ml-0.5">
                  — {taxonomy[level as 'l1' | 'l2' | 'l3']}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <p className="text-[10px] text-gray-400 mb-4">
        Showing contribution of this rule if added to {peerCount} {levelName} rules
      </p>

      <AnimatePresence mode="wait">
        <motion.div
          key={`${selectedLevel}-${labelMode}`}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.25 }}
        >
          {/* Enhanced metric cards */}
          <div className="grid grid-cols-3 gap-3">
            {METRIC_CONFIG.map(mc => {
              const marginalVal = metrics[mc.key]
              const baselineVal = baseline[mc.key]
              const delta = formatDelta(marginalVal, mc.key)

              return (
                <div
                  key={mc.key}
                  className="rounded-xl bg-(--color-card) border border-(--color-border-strong) p-4 stage-glow"
                >
                  <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-3">
                    {mc.label}
                  </div>

                  {/* Marginal contribution — hero value */}
                  <div className={`text-[24px] font-mono font-medium leading-none ${delta.color}`}>
                    {mc.isRate ? delta.text : `+${mc.format(marginalVal)}`}
                  </div>

                  {/* Peer group context */}
                  <div className="flex items-baseline gap-1.5 mt-2">
                    <span className="text-[10px] text-gray-300">vs peer group at</span>
                    <span className="text-[12px] font-mono text-gray-500">
                      {mc.format(baselineVal)}
                    </span>
                  </div>

                  {/* Inline proportion bar */}
                  <InlineProportionBar
                    baseline={baselineVal}
                    marginal={Math.abs(marginalVal)}
                    isRate={mc.isRate}
                    invertColor={mc.invertColor}
                  />
                </div>
              )
            })}
          </div>

          {/* Horizontal stacked bar chart */}
          <div className="mt-5">
            <MarginalContributionChart
              baseline={baseline}
              marginal={metrics}
              absolute={absoluteData}
              levelLabel={levelName}
              peerCount={peerCount}
            />
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
