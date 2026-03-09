import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import type { PerformanceMetrics, NumericMetricKey } from '../types'
import { CHART_COLORS } from '../theme'

interface Props {
  baseline: PerformanceMetrics
  marginal: PerformanceMetrics
  absolute: PerformanceMetrics
  levelLabel: string
  peerCount: number
}

const RATE_METRICS: { key: NumericMetricKey; label: string }[] = [
  { key: 'recall', label: 'Recall' },
  { key: 'precision', label: 'Precision' },
  { key: 'f1', label: 'F1' },
  { key: 'sarHitRate', label: 'SAR Hit Rate' },
]

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string; dataKey: string }>; label?: string }) {
  if (!active || !payload) return null
  const baseline = payload.find(p => p.dataKey === 'baseline')
  const marginal = payload.find(p => p.dataKey === 'marginal')
  return (
    <div className="bg-white border border-(--color-border) rounded-lg px-3 py-2 shadow-xl">
      <div className="text-[10px] text-gray-500 mb-1.5 font-medium">{label}</div>
      {baseline && (
        <div className="flex items-center gap-2 text-[11px]">
          <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 opacity-40" />
          <span className="text-gray-500">Peer group:</span>
          <span className="font-mono text-gray-700">{(baseline.value * 100).toFixed(1)}%</span>
        </div>
      )}
      {marginal && (
        <div className="flex items-center gap-2 text-[11px]">
          <div className="w-1.5 h-1.5 rounded-full bg-violet-500" />
          <span className="text-gray-500">This rule:</span>
          <span className="font-mono text-gray-700">+{(marginal.value * 100).toFixed(1)}pp</span>
        </div>
      )}
      {baseline && marginal && (
        <div className="flex items-center gap-2 text-[11px] border-t border-black/[0.06] mt-1 pt-1">
          <div className="w-1.5 h-1.5 rounded-full bg-transparent" />
          <span className="text-gray-500">Combined:</span>
          <span className="font-mono text-gray-800">{((baseline.value + marginal.value) * 100).toFixed(1)}%</span>
        </div>
      )}
    </div>
  )
}

export function MarginalContributionChart({ baseline, marginal }: Props) {
  const data = RATE_METRICS.map(mc => ({
    label: mc.label,
    baseline: baseline[mc.key],
    marginal: marginal[mc.key],
    combined: baseline[mc.key] + marginal[mc.key],
  }))

  return (
    <div className="rounded-xl bg-(--color-card) border border-(--color-border) p-4">
      <div className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-3">
        Marginal Contribution Breakdown
      </div>

      <div className="flex items-center gap-4 mb-3">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: CHART_COLORS.indigo, opacity: 0.35 }} />
          <span className="text-[10px] text-gray-500">Peer group alone</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: CHART_COLORS.violet }} />
          <span className="text-[10px] text-gray-500">This rule adds</span>
        </div>
      </div>

      <div className="h-[160px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 0, right: 40, bottom: 0, left: 0 }}
            barSize={18}
          >
            <XAxis
              type="number"
              domain={[0, 'auto']}
              tickFormatter={(v: number) => `${(v * 100).toFixed(0)}%`}
              tick={{ fill: CHART_COLORS.axis, fontSize: 10 }}
              axisLine={{ stroke: CHART_COLORS.grid }}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="label"
              tick={{ fill: CHART_COLORS.axis, fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={80}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.02)' }} />
            <Bar dataKey="baseline" stackId="stack" radius={[4, 0, 0, 4]}>
              {data.map((_, i) => (
                <Cell key={i} fill={CHART_COLORS.indigo} fillOpacity={0.35} />
              ))}
            </Bar>
            <Bar dataKey="marginal" stackId="stack" radius={[0, 4, 4, 0]}>
              {data.map((_, i) => (
                <Cell key={i} fill={CHART_COLORS.violet} fillOpacity={0.9} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
