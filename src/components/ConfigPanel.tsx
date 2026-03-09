import { useState, useRef, useEffect } from 'react'
import { Search, ChevronDown, Check, AlertTriangle, Clock, CheckCircle2, Play, Loader2 } from 'lucide-react'
import type { Rule } from '../types'
import { RULES, RULE_TESTING_STATUS } from '../data/mockData'

interface ConfigPanelProps {
  selectedRule: Rule | null
  onSelectRule: (rule: Rule) => void
  dateFrom: string
  dateTo: string
  onDateFromChange: (v: string) => void
  onDateToChange: (v: string) => void
  onRunBacktest: () => void
  isRunning: boolean
}

function RuleStatusBadge({ ruleId }: { ruleId: string }) {
  const status = RULE_TESTING_STATUS[ruleId]
  if (!status) return null

  if (status.status === 'needs_testing') {
    return (
      <span className="inline-flex items-center gap-1 text-[9px] font-medium text-amber-600 bg-amber-50 border border-amber-200/60 rounded-full px-1.5 py-0.5">
        <AlertTriangle className="w-2.5 h-2.5" />
        {status.reason}
      </span>
    )
  }

  if (status.status === 'stale') {
    return (
      <span className="inline-flex items-center gap-1 text-[9px] font-medium text-orange-600 bg-orange-50 border border-orange-200/60 rounded-full px-1.5 py-0.5">
        <Clock className="w-2.5 h-2.5" />
        {status.reason ?? `${status.lastTestedDaysAgo}d ago`}
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1 text-[9px] font-medium text-emerald-600 bg-emerald-50 border border-emerald-200/60 rounded-full px-1.5 py-0.5">
      <CheckCircle2 className="w-2.5 h-2.5" />
      {status.lastTestedDaysAgo}d ago
    </span>
  )
}

/** Small dot indicator for the selected rule in the top bar */
function StatusDot({ ruleId }: { ruleId: string }) {
  const status = RULE_TESTING_STATUS[ruleId]
  if (!status) return null
  const color = status.status === 'needs_testing' ? 'bg-amber-400' :
    status.status === 'stale' ? 'bg-orange-400' : 'bg-emerald-400'
  return <span className={`w-1.5 h-1.5 rounded-full ${color} shrink-0`} />
}

export function ConfigPanel(props: ConfigPanelProps) {
  const {
    selectedRule, onSelectRule,
    dateFrom, dateTo, onDateFromChange, onDateToChange,
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

  // Sort: needs_testing first, stale second, recently_tested last
  const sortedRules = [...filteredRules].sort((a, b) => {
    const order = { needs_testing: 0, stale: 1, recently_tested: 2 }
    const sa = RULE_TESTING_STATUS[a.id]?.status ?? 'recently_tested'
    const sb = RULE_TESTING_STATUS[b.id]?.status ?? 'recently_tested'
    return order[sa] - order[sb]
  })

  const canRun = selectedRule && dateFrom && dateTo && !isRunning

  // Count rules needing attention
  const needsAttentionCount = Object.values(RULE_TESTING_STATUS).filter(
    s => s.status === 'needs_testing' || s.status === 'stale'
  ).length

  return (
    <div className="h-14 flex items-center gap-4 px-6 border-b border-(--color-border) bg-(--color-surface) shrink-0">
      {/* Rule Selection */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setRuleDropdownOpen(!ruleDropdownOpen)}
          className="flex items-center gap-2 rounded-xl bg-black/[0.05] border border-(--color-border-strong) px-3 py-2 text-[13px] text-gray-700 hover:bg-black/[0.08] transition-all cursor-pointer min-w-[240px]"
        >
          {selectedRule && <StatusDot ruleId={selectedRule.id} />}
          <span className="truncate flex-1 text-left">
            {selectedRule ? selectedRule.name : 'Select a rule...'}
          </span>
          {!selectedRule && needsAttentionCount > 0 && (
            <span className="text-[9px] font-medium text-amber-600 bg-amber-50 border border-amber-200/60 rounded-full px-1.5 py-0.5 shrink-0">
              {needsAttentionCount} need testing
            </span>
          )}
          <ChevronDown className="w-3.5 h-3.5 text-gray-500 shrink-0" />
        </button>

        {ruleDropdownOpen && (
          <div className="absolute z-50 top-full left-0 mt-1 rounded-xl bg-white border border-(--color-border) shadow-2xl overflow-hidden min-w-[360px]">
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
            <div className="max-h-[320px] overflow-y-auto py-1">
              {sortedRules.map(rule => (
                <button
                  key={rule.id}
                  onClick={() => { onSelectRule(rule); setRuleDropdownOpen(false); setRuleSearch('') }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left hover:bg-black/[0.04] transition-colors cursor-pointer"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] text-gray-700 truncate">{rule.name}</span>
                      <span className="text-[9px] font-mono text-gray-400 bg-black/[0.04] rounded-full px-1.5 py-0.5 shrink-0">
                        {rule.taxonomy.l1}
                      </span>
                    </div>
                    <div className="mt-1">
                      <RuleStatusBadge ruleId={rule.id} />
                    </div>
                  </div>
                  {selectedRule?.id === rule.id && (
                    <Check className="w-3 h-3 text-[#00A99D] shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Taxonomy tags for selected rule — hidden below 1200px to prevent overflow */}
      {selectedRule && (
        <div className="hidden xl:flex gap-1 shrink-0">
          {[selectedRule.taxonomy.l1, selectedRule.taxonomy.l2, selectedRule.taxonomy.l3].map((tag, i) => (
            <span key={i} className="text-[9px] font-mono text-gray-500 bg-black/[0.04] rounded-full px-2 py-0.5 whitespace-nowrap">
              L{i + 1}: {tag}
            </span>
          ))}
        </div>
      )}

      <div className="flex-1" />

      {/* Date Range — compact inline */}
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Period</span>
        <input
          type="date"
          value={dateFrom}
          onChange={e => onDateFromChange(e.target.value)}
          className="rounded-lg bg-black/[0.05] border border-(--color-border) px-2 py-1.5 text-[11px] text-gray-700 outline-none focus:border-gray-400 transition-all w-[120px]"
        />
        <span className="text-[11px] text-gray-500">–</span>
        <input
          type="date"
          value={dateTo}
          onChange={e => onDateToChange(e.target.value)}
          className="rounded-lg bg-black/[0.05] border border-(--color-border) px-2 py-1.5 text-[11px] text-gray-700 outline-none focus:border-gray-400 transition-all w-[120px]"
        />
      </div>

      {/* Run Button */}
      <button
        onClick={onRunBacktest}
        disabled={!canRun}
        className={`flex items-center gap-2 rounded-xl px-4 py-2 text-[12px] font-medium transition-all cursor-pointer shrink-0 ${
          canRun
            ? 'bg-[#00A99D] text-white hover:bg-[#009488]'
            : 'bg-black/[0.04] text-gray-300 cursor-not-allowed'
        }`}
      >
        {isRunning ? (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Running...
          </>
        ) : (
          <>
            <Play className="w-3.5 h-3.5" />
            Run Backtest
          </>
        )}
      </button>
    </div>
  )
}
