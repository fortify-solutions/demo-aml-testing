import { motion } from 'framer-motion'
import { Tag } from 'lucide-react'
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts'
import type { LabelMode } from '../types'

interface VolumeEntry {
  date: string
  alerts: number
  sars: number
  inferred: number
}

interface Props {
  formal: number
  inferred: number
  total: number
  labelMode: LabelMode
  volumeData?: VolumeEntry[]
}

function LabelSparkline({ data, total }: { data: VolumeEntry[]; total: number }) {
  const chartData = data.map(d => ({
    date: d.date,
    sars: d.sars,
  }))

  return (
    <div className="flex items-center gap-5">
      {/* Sparkline */}
      <div className="flex-1" style={{ height: 56 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="sarGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00A99D" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#00A99D" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="sars"
              stroke="#00A99D"
              strokeWidth={1.5}
              fill="url(#sarGrad)"
              dot={false}
              isAnimationActive
            />
            <Tooltip
              contentStyle={{
                fontSize: 10,
                padding: '3px 8px',
                borderRadius: 6,
                border: '1px solid #e5e7eb',
                background: 'white',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              }}
              labelFormatter={(label: string) => new Date(label).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              formatter={(value: number) => [value, 'SARs']}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Summary */}
      <div className="shrink-0 text-right">
        <div className="text-[22px] font-semibold text-gray-800 leading-none">
          {total.toLocaleString()}
        </div>
        <div className="text-[10px] text-gray-500 mt-1">formal labels</div>
      </div>
    </div>
  )
}

export function LabelCompositionBar({ formal, inferred, total, labelMode, volumeData }: Props) {
  const formalPct = (formal / total) * 100
  const inferredPct = (inferred / total) * 100
  const isFormalOnly = labelMode === 'formal'

  return (
    <div className="rounded-xl border border-(--color-border) bg-(--color-surface) p-5 panel-shadow">
      <div className="flex items-center gap-2 mb-3">
        <Tag className="w-3.5 h-3.5 text-gray-500" />
        <span className="text-[10px] uppercase tracking-wider text-gray-600 font-semibold">
          Label Composition
        </span>
      </div>

      {isFormalOnly && volumeData && volumeData.length > 0 ? (
        <LabelSparkline data={volumeData} total={formal} />
      ) : (
        <>
          <div className="h-2.5 rounded-full overflow-hidden bg-black/[0.06] flex">
            <motion.div
              className="h-full rounded-l-full"
              style={{ backgroundColor: '#00A99D' }}
              initial={{ width: 0 }}
              animate={{ width: `${formalPct}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
            <motion.div
              className="h-full rounded-r-full"
              style={{
                backgroundColor: '#8b5cf6',
                opacity: isFormalOnly ? 0.3 : 1,
              }}
              initial={{ width: 0 }}
              animate={{ width: `${inferredPct}%` }}
              transition={{ duration: 0.5, ease: 'easeOut', delay: 0.1 }}
            />
          </div>

          {/* Strikethrough overlay for formal-only mode */}
          {isFormalOnly && (
            <div className="relative -mt-[7px] ml-auto" style={{ width: `${inferredPct}%`, marginLeft: `${formalPct}%` }}>
              <div className="h-[1px] bg-black/15 absolute top-[3px] left-0 right-0" />
            </div>
          )}

          <div className="flex items-center gap-5 mt-3">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#00A99D' }} />
              <span className="text-[11px] font-mono text-gray-500">
                Formal: {formal.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: '#8b5cf6', opacity: isFormalOnly ? 0.3 : 1 }}
              />
              <span className={`text-[11px] font-mono ${isFormalOnly ? 'text-gray-400 line-through' : 'text-gray-500'}`}>
                Inferred: {inferred.toLocaleString()}
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
