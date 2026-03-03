import { useState, useRef, useEffect } from 'react'
import { Search, ChevronDown, Check } from 'lucide-react'
import type { Rule, ExecutionFidelity } from '../types'
import { RULES } from '../data/mockData'

interface ConfigPanelProps {
  selectedRule: Rule | null
  onSelectRule: (rule: Rule) => void
  dateFrom: string
  dateTo: string
  onDateFromChange: (v: string) => void
  onDateToChange: (v: string) => void
  suppressionIncluded: boolean
  onSuppressionChange: (v: boolean) => void
  executionFidelity: ExecutionFidelity
  onFidelityChange: (f: ExecutionFidelity) => void
  onRunBacktest: () => void
  isRunning: boolean
}

export function ConfigPanel(props: ConfigPanelProps) {
  const {
    selectedRule, onSelectRule,
    dateFrom, dateTo, onDateFromChange, onDateToChange,
    suppressionIncluded, onSuppressionChange,
    executionFidelity, onFidelityChange,
    onRunBacktest, isRunning,
  } = props

  const [ruleDropdownOpen, setRuleDropdownOpen] = useState(false)
  const [ruleSearch, setRuleSearch] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setRuleDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const filteredRules = RULES.filter(r =>
    r.name.toLowerCase().includes(ruleSearch.toLowerCase()) ||
    r.taxonomy.l1.toLowerCase().includes(ruleSearch.toLowerCase())
  )

  const canRun = selectedRule && dateFrom && dateTo && !isRunning

  return (
    <div className="w-[280px] shrink-0 border-r border-(--color-border) bg-(--color-surface) px-5 py-4 space-y-5 overflow-y-auto">
      {/* Rule Selection */}
      <div className="space-y-1.5">
        <label className="text-[10px] uppercase tracking-wider text-gray-600 font-semibold">Rule</label>
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setRuleDropdownOpen(!ruleDropdownOpen)}
            className="w-full flex items-center justify-between rounded-xl bg-black/[0.05] border border-(--color-border-strong) px-3 py-2 text-[13px] text-gray-700 hover:bg-black/[0.08] transition-all cursor-pointer"
          >
            <span className="truncate">
              {selectedRule ? selectedRule.name : 'Select a rule...'}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400 shrink-0 ml-2" />
          </button>

          {ruleDropdownOpen && (
            <div className="absolute z-50 top-full left-0 right-0 mt-1 rounded-xl bg-white border border-(--color-border) shadow-2xl overflow-hidden">
              <div className="p-2 border-b border-(--color-border)">
                <div className="flex items-center gap-2 rounded-lg bg-black/[0.04] px-2.5 py-1.5">
                  <Search className="w-3.5 h-3.5 text-gray-400" />
                  <input
                    value={ruleSearch}
                    onChange={e => setRuleSearch(e.target.value)}
                    placeholder="Search rules..."
                    className="bg-transparent text-[12px] text-gray-700 placeholder:text-gray-400 outline-none w-full"
                    autoFocus
                  />
                </div>
              </div>
              <div className="max-h-[240px] overflow-y-auto py-1">
                {filteredRules.map(rule => (
                  <button
                    key={rule.id}
                    onClick={() => { onSelectRule(rule); setRuleDropdownOpen(false); setRuleSearch('') }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-black/[0.04] transition-colors cursor-pointer"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-[12px] text-gray-700 truncate">{rule.name}</div>
                    </div>
                    <span className="text-[9px] font-mono text-gray-400 bg-black/[0.04] rounded-full px-1.5 py-0.5 shrink-0">
                      {rule.taxonomy.l1}
                    </span>
                    {selectedRule?.id === rule.id && (
                      <Check className="w-3 h-3 text-indigo-500 shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {selectedRule && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {[selectedRule.taxonomy.l1, selectedRule.taxonomy.l2, selectedRule.taxonomy.l3].map((tag, i) => (
              <span key={i} className="text-[9px] font-mono text-gray-500 bg-black/[0.04] rounded-full px-2 py-0.5">
                L{i + 1}: {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Date Range */}
      <div className="space-y-1.5">
        <label className="text-[10px] uppercase tracking-wider text-gray-600 font-semibold">Date Range</label>
        <div className="space-y-2">
          <input
            type="date"
            value={dateFrom}
            onChange={e => onDateFromChange(e.target.value)}
            className="w-full rounded-xl bg-black/[0.05] border border-(--color-border-strong) px-3 py-2 text-[12px] text-gray-700 outline-none focus:border-gray-400 transition-all"
          />
          <input
            type="date"
            value={dateTo}
            onChange={e => onDateToChange(e.target.value)}
            className="w-full rounded-xl bg-black/[0.05] border border-(--color-border-strong) px-3 py-2 text-[12px] text-gray-700 outline-none focus:border-gray-400 transition-all"
          />
        </div>
      </div>

      {/* Suppression */}
      <div className="space-y-1.5">
        <label className="flex items-center gap-2 cursor-pointer group">
          <input
            type="checkbox"
            checked={suppressionIncluded}
            onChange={e => onSuppressionChange(e.target.checked)}
            className="w-3.5 h-3.5 rounded bg-black/[0.05] border border-(--color-border-strong) accent-indigo-500"
          />
          <span className="text-[11px] text-gray-500 group-hover:text-gray-700 transition-colors">
            Include suppressed alerts as misses
          </span>
        </label>
      </div>

      {/* Execution Fidelity */}
      <div className="space-y-1.5">
        <label className="text-[10px] uppercase tracking-wider text-gray-600 font-semibold">Execution Fidelity</label>
        <div className="flex rounded-xl bg-black/[0.03] border border-(--color-border) p-0.5">
          {(['simplified', 'production_replicated'] as ExecutionFidelity[]).map(f => (
            <button
              key={f}
              onClick={() => onFidelityChange(f)}
              className={`flex-1 rounded-lg py-1.5 text-[10px] font-medium transition-all cursor-pointer ${
                executionFidelity === f
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {f === 'simplified' ? 'Simplified' : 'Production'}
            </button>
          ))}
        </div>
        {executionFidelity === 'production_replicated' && selectedRule && (
          <p className="text-[10px] text-gray-400 leading-relaxed">
            Replicates {selectedRule.batchCadenceHours}h cadence with {selectedRule.lookbackWindowHours}h lookback
          </p>
        )}
      </div>

      {/* Run Button */}
      <button
        onClick={onRunBacktest}
        disabled={!canRun}
        className={`w-full rounded-xl py-2.5 text-sm font-medium transition-all cursor-pointer ${
          canRun
            ? 'bg-indigo-600 text-white hover:bg-indigo-700'
            : 'bg-black/[0.04] text-gray-300 cursor-not-allowed'
        }`}
      >
        {isRunning ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-3.5 h-3.5 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
            Running...
          </span>
        ) : (
          'Run Backtest'
        )}
      </button>
    </div>
  )
}
