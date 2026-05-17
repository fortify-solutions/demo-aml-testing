import { BarChart2 } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { motion, AnimatePresence } from 'framer-motion'
import type { LabelMode, TaxonomyLevel } from '../types'
import { CHART_COLORS } from '../theme'
import { useCopy } from '../domain-context'

interface VolumeEntry {
  date: string
  alerts: number
  sars: number
  inferred: number
}

interface Props {
  data: Record<TaxonomyLevel, VolumeEntry[]>
  selectedLevel: TaxonomyLevel
  levelLabel: string
  labelMode: LabelMode
}


function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string; color: string }>; label?: string }) {
  if (!active || !payload) return null
  return (
    <div className="bg-white border border-(--color-border) rounded-lg px-3 py-2 shadow-xl">
      <div className="text-[10px] text-gray-500 mb-1 font-mono">{label}</div>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2 text-[11px]">
          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-gray-500">{entry.name}:</span>
          <span className="font-mono text-gray-700">{entry.value}</span>
        </div>
      ))}
    </div>
  )
}

export function VolumeChart({ data, selectedLevel, levelLabel, labelMode }: Props) {
  const showInferred = labelMode === 'formal_inferred'
  const copy = useCopy()
  // Compose A (peer-group baseline) and B (with-this-rule) series at the selected scope
  const peerData = data[selectedLevel]
  const ruleData = data['global']
  const len = Math.min(peerData.length, ruleData.length)
  const activeData = Array.from({ length: len }).map((_, i) => {
    const a = peerData[i]
    const r = ruleData[i]
    return {
      date: a.date,
      a_alerts: a.alerts,
      b_alerts: a.alerts + r.alerts,
      a_sars: a.sars,
      b_sars: a.sars + r.sars,
      a_inferred: a.inferred,
      b_inferred: a.inferred + r.inferred,
    }
  })

  const tickFormatter = (value: string, index: number) => {
    if (index % 7 !== 0) return ''
    return value.slice(5)
  }

  return (
    <div className="rounded-md border border-(--color-border-subtle) bg-(--color-panel) p-4 panel-shadow">
      <div className="flex items-center gap-2 mb-1">
        <BarChart2 className="w-3.5 h-3.5 text-gray-500" />
        <span className="text-[11px] uppercase tracking-wider text-gray-600 font-semibold">
          Alert Volume — A vs B
        </span>
        <span className="text-[9px] font-mono text-gray-500 bg-gray-50 border border-(--color-border-subtle) rounded px-1.5 py-0.5">
          {copy.levelLabels[selectedLevel]}{levelLabel ? ` — ${levelLabel}` : ''}
        </span>
      </div>
      <p className="text-[10px] text-gray-500 mb-4">
        Portfolio alerts without this rule (A) vs with it (B), across the backtest period
      </p>

      <AnimatePresence mode="wait">
        <motion.div
          key={selectedLevel}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.2 }}
          className="h-[240px]"
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={activeData} margin={{ top: 5, right: 5, bottom: 20, left: 5 }}>
              <defs>
                <linearGradient id="gradA" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={CHART_COLORS.axis} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={CHART_COLORS.axis} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradB" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={CHART_COLORS.indigo} stopOpacity={0.30} />
                  <stop offset="95%" stopColor={CHART_COLORS.indigo} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradBSars" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={CHART_COLORS.violet} stopOpacity={0.20} />
                  <stop offset="95%" stopColor={CHART_COLORS.violet} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={CHART_COLORS.grid} strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fill: CHART_COLORS.axis, fontSize: 11 }}
                tickFormatter={tickFormatter}
                angle={-35}
                textAnchor="end"
                axisLine={{ stroke: CHART_COLORS.grid }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: CHART_COLORS.axis, fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={40}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="a_alerts"
                name="A · Alerts"
                stroke={CHART_COLORS.axis}
                fill="url(#gradA)"
                strokeWidth={1.5}
              />
              <Area
                type="monotone"
                dataKey="b_alerts"
                name="B · Alerts"
                stroke={CHART_COLORS.indigo}
                fill="url(#gradB)"
                strokeWidth={1.5}
              />
              <Area
                type="monotone"
                dataKey="b_sars"
                name={`B · ${copy.confirmedLabelPlural}`}
                stroke={CHART_COLORS.violet}
                fill="url(#gradBSars)"
                strokeWidth={1.5}
              />
              {showInferred && (
                <Area
                  type="monotone"
                  dataKey="b_inferred"
                  name="B · Inferred"
                  stroke={CHART_COLORS.violetLight}
                  fillOpacity={0}
                  strokeDasharray="4 3"
                  strokeWidth={1.2}
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
