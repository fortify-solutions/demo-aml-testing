import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Table2, ChevronDown } from 'lucide-react'
import type { StratificationDimension, NumericMetricKey, PerformanceMetrics } from '../types'
import { STRATIFICATION_DIMENSIONS } from '../data/mockData'

interface Props {
  data: Record<string, { label: string; count: number; metrics: PerformanceMetrics }[]>
}

const METRIC_COLS = [
  { key: 'precision', label: 'Precision', format: (v: number) => `${(v * 100).toFixed(1)}%` },
  { key: 'recall', label: 'Recall', format: (v: number) => `${(v * 100).toFixed(1)}%` },
  { key: 'f1', label: 'F1', format: (v: number) => `${(v * 100).toFixed(1)}%` },
  { key: 'alertVolume', label: 'Alerts', format: (v: number) => v.toLocaleString() },
  { key: 'sarHitRate', label: 'SAR Rate', format: (v: number) => `${(v * 100).toFixed(1)}%` },
  { key: 'falsePositiveRate', label: 'FP Rate', format: (v: number) => `${(v * 100).toFixed(1)}%` },
] as const

export function PerformanceDataTable({ data: stratifiedData }: Props) {
  const [expanded, setExpanded] = useState(false)
  const [dimension, setDimension] = useState<StratificationDimension>('overall')

  const data = stratifiedData[dimension] ?? stratifiedData.overall

  return (
    <div className="rounded-xl border border-(--color-border) bg-(--color-surface) overflow-hidden panel-shadow">
      {/* Toggle header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-5 py-3 hover:bg-black/[0.02] transition-colors cursor-pointer"
      >
        <Table2 className="w-3.5 h-3.5 text-gray-500" />
        <span className="text-[10px] uppercase tracking-wider text-gray-600 font-semibold">
          Performance Data
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-gray-500 transition-transform ml-auto ${expanded ? 'rotate-180' : ''}`} />
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
            {/* Stratification selector */}
            <div className="px-5 pb-3 flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Stratify by</span>
              <div className="flex rounded-lg bg-black/[0.03] border border-(--color-border) p-0.5">
                {STRATIFICATION_DIMENSIONS.map(dim => (
                  <button
                    key={dim.id}
                    onClick={() => setDimension(dim.id as StratificationDimension)}
                    className={`rounded-md px-2.5 py-1 text-[10px] font-medium transition-all cursor-pointer ${
                      dimension === dim.id
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {dim.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Data table */}
            <div className="border-t border-(--color-border)">
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="border-b border-(--color-border) bg-black/[0.02]">
                    <th className="text-left px-5 py-2 text-[10px] uppercase tracking-wider text-gray-500 font-semibold">
                      {dimension === 'overall' ? '' : STRATIFICATION_DIMENSIONS.find(d => d.id === dimension)?.label}
                    </th>
                    <th className="text-right px-3 py-2 text-[10px] uppercase tracking-wider text-gray-500 font-semibold">
                      Count
                    </th>
                    {METRIC_COLS.map(col => (
                      <th key={col.key} className="text-right px-3 py-2 text-[10px] uppercase tracking-wider text-gray-500 font-semibold">
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence mode="wait">
                    {data.map((row, i) => (
                      <motion.tr
                        key={`${dimension}-${row.label}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15, delay: i * 0.03 }}
                        className="border-b border-black/[0.03] last:border-0 hover:bg-black/[0.02] transition-colors"
                      >
                        <td className="px-5 py-2 text-gray-700 font-medium">{row.label}</td>
                        <td className="px-3 py-2 text-right font-mono text-gray-500">{row.count.toLocaleString()}</td>
                        {METRIC_COLS.map(col => {
                          const val = row.metrics[col.key as NumericMetricKey]
                          return (
                            <td key={col.key} className="px-3 py-2 text-right font-mono text-gray-700">
                              {col.format(val)}
                            </td>
                          )
                        })}
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
