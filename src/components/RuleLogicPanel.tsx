import { BookOpen, Zap, Clock, Settings2 } from 'lucide-react'
import type { Rule } from '../types'

/** Human-readable trigger condition derived from rule parameters */
function getTriggerDescription(rule: Rule): string {
  switch (rule.id) {
    case 'rule-001': {
      const velocity = rule.parameters.find(p => p.id === 'p1')
      const floor = rule.parameters.find(p => p.id === 'p2')
      const agg = rule.parameters.find(p => p.id === 'p3')
      return `Flag when ≥ ${velocity?.currentValue} cash deposits of ≥ $${Number(floor?.currentValue).toLocaleString()} each occur within a ${rule.lookbackWindowHours}-hour rolling window (aggregation: ${agg?.currentValue})`
    }
    case 'rule-002': {
      const benef = rule.parameters.find(p => p.id === 'p4')
      return `Flag when an entity sends international transfers to ≥ ${benef?.currentValue} distinct beneficiaries within a ${rule.lookbackWindowHours}-hour window`
    }
    case 'rule-003': {
      const dormancy = rule.parameters.find(p => p.id === 'p6')
      const amount = rule.parameters.find(p => p.id === 'p7')
      return `Flag when an account dormant for ≥ ${dormancy?.currentValue} days is reactivated with a transaction ≥ $${Number(amount?.currentValue).toLocaleString()}`
    }
    case 'rule-004': {
      const senders = rule.parameters.find(p => p.id === 'p8')
      return `Flag when a recipient receives remittances from ≥ ${senders?.currentValue} distinct senders within a ${rule.lookbackWindowHours}-hour window`
    }
    case 'rule-005': {
      const threshold = rule.parameters.find(p => p.id === 'p10')
      const nearPct = rule.parameters.find(p => p.id === 'p11')
      const count = rule.parameters.find(p => p.id === 'p12')
      return `Flag when ≥ ${count?.currentValue} deposits fall between ${(Number(nearPct?.currentValue) * 100).toFixed(0)}–100% of the $${Number(threshold?.currentValue).toLocaleString()} CTR reporting threshold within a ${rule.lookbackWindowHours}-hour window`
    }
    case 'rule-006': {
      const ratio = rule.parameters.find(p => p.id === 'p13')
      const minInflow = rule.parameters.find(p => p.id === 'p14')
      return `Flag when outflow/inflow ratio ≥ ${(Number(ratio?.currentValue) * 100).toFixed(0)}% and cumulative inflow ≥ $${Number(minInflow?.currentValue).toLocaleString()} within a ${rule.lookbackWindowHours}-hour window`
    }
    case 'rule-007': {
      const growth = rule.parameters.find(p => p.id === 'p15')
      const minTxns = rule.parameters.find(p => p.id === 'p16')
      const base = rule.parameters.find(p => p.id === 'p17')
      return `Flag when rolling average growth factor ≥ ${growth?.currentValue}× across ≥ ${minTxns?.currentValue} qualifying transactions (each ≥ $${Number(base?.currentValue).toLocaleString()}) within a ${rule.lookbackWindowHours}-hour window`
    }
    default:
      return rule.description
  }
}

function formatParamValue(value: number | string, unit?: string): string {
  if (typeof value === 'number') {
    if (unit === 'USD') return `$${value.toLocaleString()}`
    if (unit === '%') return `${(value * 100).toFixed(0)}%`
    if (unit === 'ratio') return `${(value * 100).toFixed(0)}%`
    if (unit === '×') return `${value}×`
    return `${value}${unit ? ` ${unit}` : ''}`
  }
  return String(value)
}

export function RuleLogicPanel({ rule }: { rule: Rule }) {
  const thresholdParams = rule.parameters.filter(p => p.type === 'threshold')
  const structuralParams = rule.parameters.filter(p => p.type === 'structural')

  return (
    <div className="rounded-xl border border-(--color-border) bg-(--color-surface) p-4 panel-shadow">
      <div className="flex items-start gap-3">
        <BookOpen className="w-3.5 h-3.5 text-gray-500 mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] uppercase tracking-wider text-gray-600 font-semibold">
              Rule Logic
            </span>
          </div>

          {/* Description */}
          <p className="text-[12px] text-gray-500 mb-2.5">
            {rule.description}
          </p>

          {/* Trigger condition */}
          <div className="rounded-lg bg-black/[0.03] border border-(--color-border) px-3 py-2.5 mb-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Zap className="w-3 h-3 text-[#00A99D]" />
              <span className="text-[10px] uppercase tracking-wider text-[#00A99D] font-semibold">
                Trigger Condition
              </span>
            </div>
            <p className="text-[12px] text-gray-700 leading-relaxed">
              {getTriggerDescription(rule)}
            </p>
          </div>

          {/* Parameters */}
          <div className="flex flex-wrap gap-x-6 gap-y-1.5">
            {thresholdParams.map(p => (
              <div key={p.id} className="flex items-center gap-1.5">
                <Settings2 className="w-3 h-3 text-gray-400" />
                <span className="text-[10px] text-gray-500">{p.name.replace(/_/g, ' ')}:</span>
                <span className="text-[11px] font-mono font-semibold text-gray-700">
                  {formatParamValue(p.currentValue, p.unit)}
                </span>
              </div>
            ))}
            {structuralParams.map(p => (
              <div key={p.id} className="flex items-center gap-1.5">
                <Settings2 className="w-3 h-3 text-gray-400" />
                <span className="text-[10px] text-gray-500">{p.name.replace(/_/g, ' ')}:</span>
                <span className="text-[11px] font-mono font-semibold text-gray-700">{String(p.currentValue)}</span>
              </div>
            ))}
            <div className="flex items-center gap-1.5">
              <Clock className="w-3 h-3 text-gray-400" />
              <span className="text-[10px] text-gray-500">lookback:</span>
              <span className="text-[11px] font-mono font-semibold text-gray-700">
                {rule.lookbackWindowHours >= 24 ? `${Math.round(rule.lookbackWindowHours / 24)}d` : `${rule.lookbackWindowHours}h`}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-3 h-3 text-gray-400" />
              <span className="text-[10px] text-gray-500">cadence:</span>
              <span className="text-[11px] font-mono font-semibold text-gray-700">{rule.batchCadenceHours}h</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
