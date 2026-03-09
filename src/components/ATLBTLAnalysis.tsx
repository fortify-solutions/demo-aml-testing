import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sliders, ArrowUp, ArrowDown, ChevronDown } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import type { PopulationSegment, LabelMode, Rule } from '../types'
import { CHART_COLORS } from '../theme'

interface Props {
  atl: PopulationSegment
  btl: PopulationSegment
  labelMode: LabelMode
  rule: Rule
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string; color: string }>; label?: string }) {
  if (!active || !payload) return null
  return (
    <div className="bg-white border border-(--color-border) rounded-lg px-3 py-2 shadow-xl">
      <div className="text-[10px] text-gray-500 mb-1 font-mono">{label}</div>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2 text-[11px]">
          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-gray-600">{entry.name}:</span>
          <span className="font-mono text-gray-700">{entry.value}</span>
        </div>
      ))}
    </div>
  )
}

/** Build a human-readable threshold description from the rule's parameters */
function buildThresholdDescription(rule: Rule): { conditions: { label: string; value: string }[]; window: string } {
  const thresholdParams = rule.parameters.filter(p => p.type === 'threshold')
  const conditions = thresholdParams.map(p => {
    const val = typeof p.currentValue === 'number'
      ? p.unit?.includes('USD') ? `$${p.currentValue.toLocaleString()}` : p.currentValue.toLocaleString()
      : String(p.currentValue)
    return {
      label: p.description,
      value: p.unit ? `${val} ${p.unit.replace('USD', '').trim()}`.trim() : val,
    }
  })

  const hours = rule.lookbackWindowHours
  const window = hours >= 168 ? `${Math.round(hours / 168)}w` :
    hours >= 24 ? `${Math.round(hours / 24)}d` :
      `${hours}h`

  return { conditions, window: `${window} rolling window` }
}

function SegmentColumn({ segment, side, labelMode }: { segment: PopulationSegment; side: 'left' | 'right'; labelMode: LabelMode }) {
  const isATL = side === 'left'
  const showInferred = labelMode === 'formal_inferred'
  const isSparse = !isATL && segment.sarRate === 0 && labelMode === 'formal'

  return (
    <div className="flex-1 space-y-4">
      {/* Segment header with icon */}
      <div className="flex items-center gap-2">
        <div className={`w-5 h-5 rounded-md flex items-center justify-center ${
          isATL ? 'bg-indigo-50 text-indigo-500' : 'bg-gray-100 text-gray-400'
        }`}>
          {isATL ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wider text-gray-600 font-semibold">
            {isATL ? 'Above the Line' : 'Below the Line'}
          </div>
          <div className="text-[9px] text-gray-500">
            {isATL ? 'Entities that triggered the rule' : 'Entities that did not trigger'}
          </div>
        </div>
      </div>

      <div className="text-[22px] font-mono text-gray-900">
        {segment.count.toLocaleString()}
        <span className="text-[11px] text-gray-500 ml-1.5">{isATL ? 'alerts' : 'entities'}</span>
      </div>

      {/* SAR Rate */}
      <div className={`rounded-xl p-3 stage-glow ${
        isSparse
          ? 'bg-(--color-card) border border-(--color-border)'
          : 'bg-(--color-card) border border-(--color-border-strong)'
      }`}>
        <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">SAR Rate</div>
        <div className="text-[22px] font-mono text-gray-900 leading-none">
          {(segment.sarRate * 100).toFixed(1)}%
        </div>
        {isSparse && (
          <div className="text-[10px] text-gray-500 mt-1">No historical labels — inferred only</div>
        )}
      </div>

      {/* Inferred SAR Rate */}
      {showInferred && (
        <div className="rounded-xl bg-(--color-card) border border-(--color-border) p-3">
          <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Inferred SAR Rate</div>
          <div className="text-[18px] font-mono text-gray-700 leading-none">
            {(segment.inferredSarRate * 100).toFixed(1)}%
          </div>
        </div>
      )}

      {/* Secondary metrics */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <div className="text-[10px] text-gray-500 mb-0.5">Median Txn Value</div>
          <div className="text-[13px] font-mono text-gray-700">${segment.medianTransactionValue.toLocaleString()}</div>
        </div>
        <div>
          <div className="text-[10px] text-gray-500 mb-0.5">Median Score</div>
          <div className="text-[13px] font-mono text-gray-700">{segment.medianAlertScore.toFixed(1)}</div>
        </div>
      </div>

      {/* Distribution */}
      <div className="h-[140px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={segment.distributionBins} margin={{ top: 5, right: 0, bottom: 0, left: 0 }}>
            <CartesianGrid stroke={CHART_COLORS.grid} strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="bin"
              tick={{ fill: CHART_COLORS.axis, fontSize: 9 }}
              axisLine={{ stroke: CHART_COLORS.grid }}
              tickLine={false}
            />
            <YAxis hide />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="count" name="Count" fill={isATL ? CHART_COLORS.indigo : CHART_COLORS.violetLighter} radius={[2, 2, 0, 0]} opacity={0.6} />
            <Bar dataKey="sarCount" name="SAR Hits" fill={isATL ? CHART_COLORS.violet : CHART_COLORS.violetLight} radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export function ATLBTLAnalysis({ atl, btl, labelMode, rule }: Props) {
  const [expanded, setExpanded] = useState(false)
  const threshold = buildThresholdDescription(rule)

  return (
    <div className="rounded-xl border border-(--color-border) bg-(--color-surface) overflow-hidden panel-shadow">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-5 py-3 hover:bg-black/[0.02] transition-colors cursor-pointer"
      >
        <Sliders className="w-3.5 h-3.5 text-gray-500" />
        <span className="text-[10px] uppercase tracking-wider text-gray-600 font-semibold">
          ATL / BTL Analysis
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-gray-500 transition-transform ml-auto ${expanded ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5">
              {/* Threshold definition banner */}
              <div className="rounded-lg bg-indigo-50/60 border border-indigo-100 px-4 py-3 mb-5">
                <div className="text-[10px] uppercase tracking-wider text-[#00A99D] font-semibold mb-2">
                  Rule Threshold — {rule.name}
                </div>
                <div className="space-y-1.5">
                  {threshold.conditions.map((c, i) => (
                    <div key={i} className="flex items-baseline gap-2">
                      <span className="text-[12px] font-mono font-semibold text-indigo-600">{c.value}</span>
                      <span className="text-[11px] text-gray-500">{c.label}</span>
                    </div>
                  ))}
                  <div className="flex items-baseline gap-2">
                    <span className="text-[12px] font-mono font-semibold text-indigo-600">{threshold.window}</span>
                    <span className="text-[11px] text-gray-500">Evaluation period</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-0">
                <SegmentColumn segment={atl} side="left" labelMode={labelMode} />

                {/* Threshold divider */}
                <div className="relative mx-5 flex items-center justify-center" style={{ width: '1px' }}>
                  <div className="absolute inset-0 bg-indigo-200/50" />
                  <div className="absolute text-[9px] uppercase tracking-wider text-[#00A99D]/70 whitespace-nowrap bg-(--color-surface) px-1 py-2 font-semibold" style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}>
                    Threshold
                  </div>
                </div>

                <SegmentColumn segment={btl} side="right" labelMode={labelMode} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
