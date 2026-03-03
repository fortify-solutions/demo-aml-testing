import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, ChevronDown, Loader2, ArrowRight } from 'lucide-react'
import type { Recommendation, PerformanceMetrics } from '../types'

interface Props {
  recommendations: Recommendation[]
  loading: boolean
  onHoverRecommendation: (affectedMetrics: Set<string> | null) => void
  onApply: (rec: Recommendation) => void
}

const COMPARE_METRICS: { key: keyof PerformanceMetrics; label: string; format: (v: number) => string }[] = [
  { key: 'precision', label: 'Precision', format: v => `${(v * 100).toFixed(1)}%` },
  { key: 'recall', label: 'Recall', format: v => `${(v * 100).toFixed(1)}%` },
  { key: 'f1', label: 'F1', format: v => `${(v * 100).toFixed(1)}%` },
  { key: 'alertVolume', label: 'Alert Vol.', format: v => v.toLocaleString() },
  { key: 'falsePositiveRate', label: 'FP Rate', format: v => `${(v * 100).toFixed(1)}%` },
]

function ConfidenceBadge({ confidence }: { confidence: Recommendation['confidence'] }) {
  const colors = {
    high: 'text-[#16a34a] bg-[#16a34a]/10',
    medium: 'text-amber-600 bg-amber-600/10',
    low: 'text-gray-400 bg-black/[0.06]',
  }
  return (
    <span className={`text-[10px] font-mono uppercase rounded-full px-2 py-0.5 ${colors[confidence]}`}>
      {confidence}
    </span>
  )
}

function RecommendationCard({ rec, onHover, onApply }: {
  rec: Recommendation
  onHover: (metrics: Set<string> | null) => void
  onApply: (rec: Recommendation) => void
}) {
  const [expanded, setExpanded] = useState(false)

  // Determine which metrics change
  const affectedMetrics = new Set<string>()
  for (const mc of COMPARE_METRICS) {
    if (Math.abs(rec.projectedMetrics[mc.key] - rec.currentMetrics[mc.key]) > 0.001) {
      affectedMetrics.add(mc.key)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-(--color-border) bg-(--color-surface) p-4 space-y-3 hover:border-(--color-border-strong) hover:bg-white transition-all"
      onMouseEnter={() => onHover(affectedMetrics)}
      onMouseLeave={() => onHover(null)}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[13px] text-gray-800">{rec.title}</span>
          <ConfidenceBadge confidence={rec.confidence} />
          <span className="text-[10px] font-mono text-gray-500 bg-black/[0.05] rounded-full px-1.5 py-0.5 uppercase">
            {rec.type}
          </span>
        </div>
      </div>

      {/* Proposed change */}
      <div className="text-[12px] text-gray-700">{rec.proposedChange}</div>

      {/* Rationale */}
      <div className="text-[12px] text-gray-500 leading-relaxed">{rec.rationale}</div>

      {/* Evidence (collapsible) */}
      <div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1.5 text-[11px] text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
        >
          <ChevronDown className={`w-3 h-3 transition-transform ${expanded ? 'rotate-180' : ''}`} />
          Evidence Summary
        </button>
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="text-[12px] text-gray-400 leading-relaxed mt-2 pl-4 border-l border-(--color-border)">
                {rec.evidenceSummary}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Before / After comparison */}
      <div className="rounded-lg bg-black/[0.02] border border-(--color-border) overflow-hidden">
        <div className="grid grid-cols-[1fr_80px_80px] gap-0 text-[10px] uppercase tracking-wider text-gray-500 font-semibold px-3 py-1.5 border-b border-(--color-border)">
          <div>Metric</div>
          <div className="text-right">Current</div>
          <div className="text-right">Projected</div>
        </div>
        {COMPARE_METRICS.map(mc => {
          const current = rec.currentMetrics[mc.key]
          const projected = rec.projectedMetrics[mc.key]
          const diff = projected - current
          const isImproved = mc.key === 'falsePositiveRate' ? diff < 0 : diff > 0
          const isChanged = Math.abs(diff) > 0.001
          return (
            <div key={mc.key} className="grid grid-cols-[1fr_80px_80px] gap-0 px-3 py-1 border-b border-black/[0.03] last:border-0">
              <div className="text-[11px] text-gray-500">{mc.label}</div>
              <div className="text-[11px] font-mono text-gray-500 text-right">{mc.format(current)}</div>
              <div className={`text-[11px] font-mono text-right ${
                isChanged ? (isImproved ? 'text-[#16a34a]' : 'text-[#dc2626]') : 'text-gray-500'
              }`}>
                {mc.format(projected)}
              </div>
            </div>
          )
        })}
      </div>

      {/* Apply button */}
      <button
        onClick={() => onApply(rec)}
        className="flex items-center gap-1.5 text-[12px] text-gray-600 border border-(--color-border) rounded-lg px-3 py-1.5 hover:border-(--color-border-strong) hover:text-gray-900 transition-all cursor-pointer"
      >
        Apply in Rule Builder
        <ArrowRight className="w-3 h-3" />
      </button>
    </motion.div>
  )
}

export function RecommendationsPanel({ recommendations, loading, onHoverRecommendation, onApply }: Props) {
  return (
    <div className="rounded-xl border border-(--color-border-strong) bg-white p-5 stage-glow-violet">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-3.5 h-3.5 text-violet-500/70" />
        <span className="text-[10px] uppercase tracking-wider text-gray-600 font-semibold">
          Recommendations
        </span>
        {loading && <Loader2 className="w-3.5 h-3.5 text-gray-400 animate-spin" />}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="rounded-xl bg-black/[0.03] animate-pulse h-[160px]" />
          ))}
        </div>
      ) : recommendations.length === 0 ? (
        <div className="text-center py-12 text-[13px] text-gray-300">
          No recommendations — rule performance looks good across all dimensions.
        </div>
      ) : (
        <div className="space-y-3">
          {recommendations.map(rec => (
            <RecommendationCard
              key={rec.id}
              rec={rec}
              onHover={onHoverRecommendation}
              onApply={onApply}
            />
          ))}
        </div>
      )}
    </div>
  )
}
