import { useState, useRef, useEffect } from 'react'
import { Search, ChevronDown, Check, Play, Loader2 } from 'lucide-react'
import type { Rule } from '../types'
import { ALL_RULES, RULES_WITH_DATA, RULE_TESTING_STATUS } from '../data/mockData'

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

  const search = ruleSearch.toLowerCase()
  const filteredRules = ALL_RULES.filter(r =>
    r.name.toLowerCase().includes(search) ||
    r.taxonomy.l1.toLowerCase().includes(search) ||
    r.taxonomy.l2.toLowerCase().includes(search)
  )

  // Group by L1 → L2 taxonomy
  const L1_ORDER = ['Structuring', 'Unusual Activity', 'Layering', 'Trade-Based ML', 'Fraud Overlap']
  type L2Group = { l1: string; l2: string; rules: Rule[] }
  const l2Map = new Map<string, L2Group>()
  for (const rule of filteredRules) {
    const key = `${rule.taxonomy.l1}::${rule.taxonomy.l2}`
    if (!l2Map.has(key)) l2Map.set(key, { l1: rule.taxonomy.l1, l2: rule.taxonomy.l2, rules: [] })
    l2Map.get(key)!.rules.push(rule)
  }
  // Sort rules within each L2 group: real first, then alphabetical
  for (const group of l2Map.values()) {
    group.rules.sort((a, b) => {
      const aReal = RULES_WITH_DATA.has(a.id)
      const bReal = RULES_WITH_DATA.has(b.id)
      if (aReal !== bReal) return aReal ? -1 : 1
      return a.name.localeCompare(b.name)
    })
  }
  // Sort groups: by L1 order, then L2 alphabetical within each L1
  const sortedL2Groups = [...l2Map.values()].sort((a, b) => {
    const aL1 = L1_ORDER.indexOf(a.l1) === -1 ? 99 : L1_ORDER.indexOf(a.l1)
    const bL1 = L1_ORDER.indexOf(b.l1) === -1 ? 99 : L1_ORDER.indexOf(b.l1)
    if (aL1 !== bL1) return aL1 - bL1
    return a.l2.localeCompare(b.l2)
  })
  // Track which L2 groups are the first in their L1 (to show L1 header)
  const firstL2ForL1 = new Set<string>()
  const seenL1 = new Set<string>()
  for (const g of sortedL2Groups) {
    if (!seenL1.has(g.l1)) { firstL2ForL1.add(`${g.l1}::${g.l2}`); seenL1.add(g.l1) }
  }

  const canRun = selectedRule && dateFrom && dateTo && !isRunning

  // Count rules needing attention
  const needsAttentionCount = Object.values(RULE_TESTING_STATUS).filter(
    s => s.status === 'needs_testing' || s.status === 'stale'
  ).length

  return (
    <div className="h-16 flex items-center gap-4 px-6 bg-[#111827] shrink-0">
      {/* Rule Selection */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setRuleDropdownOpen(!ruleDropdownOpen)}
          className="flex items-center gap-2 rounded-xl bg-white/10 border border-white/20 px-3 py-2 text-[13px] text-white hover:bg-white/15 transition-all cursor-pointer min-w-[240px]"
        >
          {selectedRule && <StatusDot ruleId={selectedRule.id} />}
          <span className="truncate flex-1 text-left">
            {selectedRule ? selectedRule.name : <span className="text-white/50">Select a rule...</span>}
          </span>
          {!selectedRule && needsAttentionCount > 0 && (
            <span className="text-[9px] font-medium text-amber-300 bg-amber-400/20 border border-amber-400/30 rounded-full px-1.5 py-0.5 shrink-0">
              {needsAttentionCount} need testing
            </span>
          )}
          <ChevronDown className="w-3.5 h-3.5 text-white/40 shrink-0" />
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
            <div className="max-h-[400px] overflow-y-auto py-1">
              {sortedL2Groups.map(({ l1, l2, rules }) => {
                const showL1 = firstL2ForL1.has(`${l1}::${l2}`)
                return (
                  <div key={`${l1}::${l2}`}>
                    {showL1 && (
                      <div className="px-3 pt-3 pb-0.5 text-[10px] uppercase tracking-wider text-gray-600 font-bold border-t border-(--color-border) first:border-t-0">
                        {l1}
                      </div>
                    )}
                    <div className="px-3 pt-1.5 pb-1 text-[9px] text-gray-400 font-medium">
                      {l2}
                    </div>
                    {rules.map(rule => {
                      const hasData = RULES_WITH_DATA.has(rule.id)
                      return (
                        <button
                          key={rule.id}
                          onClick={() => { onSelectRule(rule); setRuleDropdownOpen(false); setRuleSearch('') }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-black/[0.04] transition-colors cursor-pointer"
                        >
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${hasData ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                          <div className="flex-1 min-w-0">
                            <span className="text-[12px] text-gray-700 truncate block">
                              {rule.name}
                            </span>
                          </div>
                          {selectedRule?.id === rule.id && (
                            <Check className="w-3 h-3 text-[#00A99D] shrink-0" />
                          )}
                        </button>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Taxonomy tags for selected rule — hidden below 1200px to prevent overflow */}
      {selectedRule && (
        <div className="hidden xl:flex gap-1 shrink-0">
          {[selectedRule.taxonomy.l1, selectedRule.taxonomy.l2, selectedRule.taxonomy.l3].map((tag, i) => (
            <span key={i} className="text-[11px] font-semibold text-white bg-white/15 rounded-full px-3 py-1 whitespace-nowrap">
              <span className="text-white/50 font-medium text-[9px] mr-1">L{i + 1}</span>{tag}
            </span>
          ))}
        </div>
      )}

      <div className="flex-1" />

      {/* Date Range */}
      <div className="flex items-center gap-3 shrink-0 bg-white/10 border border-white/20 rounded-xl px-4 py-2">
        <span className="text-[10px] uppercase tracking-widest text-white/50 font-semibold">Period</span>
        <div className="w-px h-4 bg-white/20" />
        <input
          type="date"
          value={dateFrom}
          onChange={e => onDateFromChange(e.target.value)}
          className="bg-transparent text-[13px] font-medium text-white outline-none w-[118px] cursor-pointer [color-scheme:dark]"
        />
        <span className="text-white/30 font-light">—</span>
        <input
          type="date"
          value={dateTo}
          onChange={e => onDateToChange(e.target.value)}
          className="bg-transparent text-[13px] font-medium text-white outline-none w-[118px] cursor-pointer [color-scheme:dark]"
        />
      </div>

      {/* Run Button */}
      <button
        onClick={onRunBacktest}
        disabled={!canRun}
        className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-[13px] font-semibold transition-all cursor-pointer shrink-0 ${
          canRun
            ? 'bg-[#00A99D] text-white hover:bg-[#009488] shadow-lg shadow-[#00A99D]/30'
            : 'bg-white/10 text-white/25 cursor-not-allowed'
        }`}
      >
        {isRunning ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Running...
          </>
        ) : (
          <>
            <Play className="w-4 h-4" />
            Run Backtest
          </>
        )}
      </button>
    </div>
  )
}
