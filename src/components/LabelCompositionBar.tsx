import { motion } from 'framer-motion'
import { Tag } from 'lucide-react'
import type { LabelMode } from '../types'

interface Props {
  formal: number
  inferred: number
  total: number
  labelMode: LabelMode
}

export function LabelCompositionBar({ formal, inferred, total, labelMode }: Props) {
  const formalPct = (formal / total) * 100
  const inferredPct = (inferred / total) * 100
  const isFormalOnly = labelMode === 'formal'

  return (
    <div className="rounded-xl border border-(--color-border) bg-(--color-surface) p-5">
      <div className="flex items-center gap-2 mb-3">
        <Tag className="w-3.5 h-3.5 text-gray-400" />
        <span className="text-[10px] uppercase tracking-wider text-gray-600 font-semibold">
          Label Composition
        </span>
      </div>

      <div className="h-2.5 rounded-full overflow-hidden bg-black/[0.06] flex">
        <motion.div
          className="h-full rounded-l-full"
          style={{ backgroundColor: '#6366f1' }}
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
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#6366f1' }} />
          <span className="text-[11px] font-mono text-gray-500">
            Formal: {formal.toLocaleString()}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: '#8b5cf6', opacity: isFormalOnly ? 0.3 : 1 }}
          />
          <span className={`text-[11px] font-mono ${isFormalOnly ? 'text-gray-300 line-through' : 'text-gray-500'}`}>
            Inferred: {inferred.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  )
}
