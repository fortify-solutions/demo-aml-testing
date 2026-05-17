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

  const lookback = rule.lookbackWindowHours >= 24
    ? `${Math.round(rule.lookbackWindowHours / 24)}d`
    : `${rule.lookbackWindowHours}h`

  return (
    <div className="rounded-md border border-(--color-border-subtle) bg-(--color-panel) px-3 py-2 panel-shadow">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        {/* Label + icon */}
        <div className="flex items-center gap-1.5 shrink-0">
          <BookOpen className="w-3.5 h-3.5 text-(--color-text-secondary)" />
          <span className="text-[10px] uppercase tracking-[0.08em] text-(--color-text-primary) font-semibold">
            Rule Logic
          </span>
        </div>

        {/* Trigger condition — inline, primary content */}
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          <Zap className="w-3 h-3 text-(--color-accent) shrink-0" />
          <p className="text-[12px] text-(--color-text-primary) leading-snug truncate" title={getTriggerDescription(rule)}>
            {getTriggerDescription(rule)}
          </p>
        </div>

        {/* Params + windows — compact pills on the right */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 shrink-0">
          {thresholdParams.map(p => (
            <span key={p.id} className="inline-flex items-baseline gap-1 text-[11px] whitespace-nowrap">
              <span className="text-(--color-text-secondary)">{p.name.replace(/_/g, ' ')}</span>
              <span className="font-mono tabular-nums font-medium text-(--color-text-primary)">
                {formatParamValue(p.currentValue, p.unit)}
              </span>
            </span>
          ))}
          {structuralParams.map(p => (
            <span key={p.id} className="inline-flex items-baseline gap-1 text-[11px] whitespace-nowrap">
              <span className="text-(--color-text-secondary)">{p.name.replace(/_/g, ' ')}</span>
              <span className="font-mono font-medium text-(--color-text-primary)">{String(p.currentValue)}</span>
            </span>
          ))}
          <span className="inline-flex items-baseline gap-1 text-[11px] whitespace-nowrap">
            <Clock className="w-3 h-3 text-(--color-text-secondary) self-center" />
            <span className="font-mono tabular-nums font-medium text-(--color-text-primary)">{lookback}</span>
            <span className="text-(--color-text-secondary)">lookback</span>
          </span>
          <span className="inline-flex items-baseline gap-1 text-[11px] whitespace-nowrap">
            <Settings2 className="w-3 h-3 text-(--color-text-secondary) self-center" />
            <span className="font-mono tabular-nums font-medium text-(--color-text-primary)">{rule.batchCadenceHours}h</span>
            <span className="text-(--color-text-secondary)">cadence</span>
          </span>
        </div>
      </div>
    </div>
  )
}
