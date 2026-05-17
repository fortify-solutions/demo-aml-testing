import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check, GitBranch, History, Sparkles, MinusCircle, Search } from 'lucide-react'
import type { ASelection, TaxonomyLevel, Rule } from '../types'
import { RULE_VERSIONS, ALL_RULES } from '../data/mockData'
import { useDomain, useCopy } from '../domain-context'

interface Props {
  selection: ASelection
  onChange: (s: ASelection) => void
  currentRule: Rule
  /** Resolved label of the currently-selected rule's taxonomy at each level. */
  taxonomy: { l1: string; l2: string; l3: string }
}

function describeSelection(s: ASelection, taxonomy: Props['taxonomy'], levelLabels: Record<TaxonomyLevel, string>, ruleNameOf: (id: string) => string): string {
  switch (s.kind) {
    case 'portfolio_minus': {
      const scope = s.level === 'global' ? levelLabels.global : `${levelLabels[s.level]} — ${taxonomy[s.level as 'l1' | 'l2' | 'l3']}`
      return `Portfolio (${scope}) minus this rule`
    }
    case 'prior_version': {
      const v = RULE_VERSIONS.find(rv => rv.id === s.version)
      return v ? v.label : `Version ${s.version}`
    }
    case 'empty':
      return 'Empty baseline (no rule)'
    case 'specific_rule':
      return ruleNameOf(s.ruleId)
  }
}

export function ASelector({ selection, onChange, currentRule, taxonomy }: Props) {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<ASelection['kind']>(selection.kind)
  const [ruleSearch, setRuleSearch] = useState('')
  const ref = useRef<HTMLDivElement>(null)
  const { mode } = useDomain()
  const copy = useCopy()
  const levelLabels = copy.levelLabels

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  // Stay in sync with external changes (store-previous-render pattern)
  const [prevKind, setPrevKind] = useState(selection.kind)
  if (selection.kind !== prevKind) {
    setPrevKind(selection.kind)
    setTab(selection.kind)
  }

  const ruleNameOf = (id: string) => ALL_RULES.find(r => r.id === id)?.name ?? id
  const summary = describeSelection(selection, taxonomy, levelLabels, ruleNameOf)

  const TABS: { id: ASelection['kind']; label: string; icon: typeof GitBranch }[] = [
    { id: 'portfolio_minus', label: 'Portfolio', icon: GitBranch },
    { id: 'prior_version', label: 'Version', icon: History },
    { id: 'empty', label: 'Empty', icon: MinusCircle },
    { id: 'specific_rule', label: 'Other rule', icon: Sparkles },
  ]

  const otherRules = ALL_RULES.filter(r =>
    r.id !== currentRule.id &&
    (r.domain ?? 'aml') === mode &&
    (ruleSearch.trim() === '' || r.name.toLowerCase().includes(ruleSearch.toLowerCase()))
  )

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 rounded-sm border border-(--color-border-strong) bg-white px-2.5 py-1 text-[11px] text-(--color-text-primary) hover:bg-(--color-surface-hover) transition-colors cursor-pointer"
      >
        <span className="text-(--color-text-secondary) font-semibold uppercase tracking-[0.08em]">A =</span>
        <span className="font-medium">{summary}</span>
        <ChevronDown className="w-3.5 h-3.5 text-(--color-text-secondary)" />
      </button>

      {open && (
        <div className="absolute z-50 top-full right-0 mt-1 rounded-md bg-white border border-(--color-border-subtle) elevated-shadow overflow-hidden w-[460px]">
          {/* Tabs */}
          <div className="flex border-b border-(--color-border-subtle) bg-gray-50">
            {TABS.map(t => {
              const Icon = t.icon
              const active = tab === t.id
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2 text-[11px] font-medium transition-colors cursor-pointer border-b-2 -mb-px ${
                    active
                      ? 'text-(--color-primary) border-(--color-primary) bg-white'
                      : 'text-(--color-text-secondary) border-transparent hover:text-(--color-text-primary)'
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  {t.label}
                </button>
              )
            })}
          </div>

          {/* Tab body */}
          <div className="p-2 max-h-[320px] overflow-y-auto">
            {tab === 'portfolio_minus' && (
              <div className="space-y-1">
                <p className="text-[11px] text-(--color-text-secondary) px-2 py-1">
                  Compare against the rest of the portfolio at this scope:
                </p>
                {(['l1', 'l2', 'l3', 'global'] as TaxonomyLevel[]).map(level => {
                  const isSel = selection.kind === 'portfolio_minus' && selection.level === level
                  return (
                    <button
                      key={level}
                      onClick={() => { onChange({ kind: 'portfolio_minus', level }); setOpen(false) }}
                      className={`w-full flex items-center gap-2 px-2 py-1.5 text-left text-[12px] rounded-sm transition-colors cursor-pointer ${
                        isSel ? 'bg-(--color-surface-selected)' : 'hover:bg-(--color-surface-hover)'
                      }`}
                    >
                      <span className="font-semibold w-20 shrink-0">{levelLabels[level]}</span>
                      <span className="text-(--color-text-secondary) flex-1 truncate">
                        {level === 'global'
                          ? 'all other rules in the portfolio'
                          : taxonomy[level as 'l1' | 'l2' | 'l3']}
                      </span>
                      {isSel && <Check className="w-3.5 h-3.5 text-(--color-primary)" />}
                    </button>
                  )
                })}
              </div>
            )}

            {tab === 'prior_version' && (
              <div className="space-y-1">
                <p className="text-[11px] text-(--color-text-secondary) px-2 py-1">
                  Compare this rule against an earlier version of itself:
                </p>
                {RULE_VERSIONS.map(v => {
                  const isSel = selection.kind === 'prior_version' && selection.version === v.id
                  return (
                    <button
                      key={v.id}
                      onClick={() => { onChange({ kind: 'prior_version', version: v.id }); setOpen(false) }}
                      className={`w-full flex items-start gap-2 px-2 py-1.5 text-left rounded-sm transition-colors cursor-pointer ${
                        isSel ? 'bg-(--color-surface-selected)' : 'hover:bg-(--color-surface-hover)'
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-[12px] font-medium text-(--color-text-primary)">{v.label}</div>
                        <div className="text-[10px] text-(--color-text-secondary)">{v.description}</div>
                      </div>
                      {isSel && <Check className="w-3.5 h-3.5 text-(--color-primary) mt-1" />}
                    </button>
                  )
                })}
              </div>
            )}

            {tab === 'empty' && (
              <div className="space-y-2">
                <p className="text-[11px] text-(--color-text-secondary) px-2 py-1">
                  Use no rule at all as the baseline. B will be this rule's standalone metrics — useful when introducing a brand-new rule.
                </p>
                <button
                  onClick={() => { onChange({ kind: 'empty' }); setOpen(false) }}
                  className={`w-full flex items-center gap-2 px-2 py-2 text-left text-[12px] rounded-sm transition-colors cursor-pointer ${
                    selection.kind === 'empty' ? 'bg-(--color-surface-selected)' : 'hover:bg-(--color-surface-hover)'
                  }`}
                >
                  <MinusCircle className="w-3.5 h-3.5 text-(--color-text-secondary)" />
                  <span className="font-medium flex-1">Empty baseline</span>
                  {selection.kind === 'empty' && <Check className="w-3.5 h-3.5 text-(--color-primary)" />}
                </button>
              </div>
            )}

            {tab === 'specific_rule' && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 rounded-sm border border-(--color-border-subtle) bg-gray-50 px-2 py-1 mb-1">
                  <Search className="w-3.5 h-3.5 text-(--color-text-secondary)" />
                  <input
                    autoFocus
                    value={ruleSearch}
                    onChange={e => setRuleSearch(e.target.value)}
                    placeholder="Search rules..."
                    className="flex-1 bg-transparent text-[12px] outline-none placeholder:text-(--color-text-disabled)"
                  />
                </div>
                {otherRules.length === 0 && (
                  <div className="px-2 py-3 text-[12px] text-(--color-text-secondary) text-center">
                    No matching rules.
                  </div>
                )}
                {otherRules.slice(0, 40).map(r => {
                  const isSel = selection.kind === 'specific_rule' && selection.ruleId === r.id
                  return (
                    <button
                      key={r.id}
                      onClick={() => { onChange({ kind: 'specific_rule', ruleId: r.id }); setOpen(false) }}
                      className={`w-full flex items-center gap-2 px-2 py-1.5 text-left rounded-sm transition-colors cursor-pointer ${
                        isSel ? 'bg-(--color-surface-selected)' : 'hover:bg-(--color-surface-hover)'
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-[12px] font-medium text-(--color-text-primary) truncate">{r.name}</div>
                        <div className="text-[10px] text-(--color-text-secondary) truncate">
                          {r.taxonomy.l1} → {r.taxonomy.l2}
                        </div>
                      </div>
                      {isSel && <Check className="w-3.5 h-3.5 text-(--color-primary) shrink-0" />}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
