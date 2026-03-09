import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, ChevronDown, ChevronRight, AlertTriangle, CheckCircle2, XCircle, ArrowUpDown, FileSearch, DollarSign, ArrowUpRight, ArrowDownRight, TrendingUp } from 'lucide-react'
import type { AlertRecord, Rule, PerformanceView, TaxonomyLevel, UnitOfAnalysis, TransactionRecord } from '../types'

interface Props {
  alerts: AlertRecord[]
  performanceView: PerformanceView
  taxonomyLevel: TaxonomyLevel
  rule: Rule
  unitOfAnalysis: UnitOfAnalysis
}

type SortKey = 'entityId' | 'entityName' | 'alertDate' | 'transactionCount' | 'totalAmount' | 'alertScore' | 'sarFiled'
type SortDir = 'asc' | 'desc'

const PAGE_SIZE = 20

function formatCurrency(v: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v)
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function AlertExplorer({ alerts, performanceView, taxonomyLevel, rule, unitOfAnalysis }: Props) {
  const [expanded, setExpanded] = useState(false)
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('alertDate')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [page, setPage] = useState(0)
  const [expandedRow, setExpandedRow] = useState<string | null>(null)

  // Filter by view mode
  const viewFiltered = useMemo(() => {
    if (performanceView === 'absolute') return alerts
    return alerts.filter(a => a.isMarginal && a.marginalAtLevel.includes(taxonomyLevel))
  }, [alerts, performanceView, taxonomyLevel])

  // Filter by search
  const searched = useMemo(() => {
    if (!search.trim()) return viewFiltered
    const q = search.toLowerCase()
    return viewFiltered.filter(a =>
      a.entityId.toLowerCase().includes(q) ||
      a.entityName.toLowerCase().includes(q)
    )
  }, [viewFiltered, search])

  // Sort
  const sorted = useMemo(() => {
    const arr = [...searched]
    arr.sort((a, b) => {
      let cmp = 0
      switch (sortKey) {
        case 'entityId': cmp = a.entityId.localeCompare(b.entityId); break
        case 'entityName': cmp = a.entityName.localeCompare(b.entityName); break
        case 'alertDate': cmp = a.alertDate.localeCompare(b.alertDate); break
        case 'transactionCount': cmp = a.transactionCount - b.transactionCount; break
        case 'totalAmount': cmp = a.totalAmount - b.totalAmount; break
        case 'alertScore': cmp = a.alertScore - b.alertScore; break
        case 'sarFiled': cmp = (a.sarFiled ? 1 : 0) - (b.sarFiled ? 1 : 0); break
      }
      return sortDir === 'asc' ? cmp : -cmp
    })
    return arr
  }, [searched, sortKey, sortDir])

  // Paginate
  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE))
  const paginated = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  // Reset page when filters change
  useMemo(() => { setPage(0) }, [performanceView, taxonomyLevel, search])

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  const isMarginalView = performanceView === 'marginal'
  const levelLabel = taxonomyLevel === 'global' ? 'Global' : taxonomyLevel.toUpperCase()

  return (
    <div className="rounded-xl border border-(--color-border) bg-(--color-surface) overflow-hidden">
      {/* Toggle header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-5 py-3 hover:bg-black/[0.02] transition-colors cursor-pointer"
      >
        <FileSearch className="w-3.5 h-3.5 text-gray-400" />
        <span className="text-[10px] uppercase tracking-wider text-gray-600 font-semibold">
          Alert Explorer
        </span>
        <span className="text-[10px] text-gray-400 ml-1">
          {viewFiltered.length} alerts
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ml-auto ${expanded ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 space-y-3">
              {/* Toolbar: search + marginal badge */}
              <div className="flex items-center gap-3">
                <div className="relative flex-1 max-w-xs">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300" />
                  <input
                    type="text"
                    placeholder="Search entity ID or name..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-[12px] rounded-lg border border-(--color-border) bg-white focus:outline-none focus:ring-1 focus:ring-blue-300"
                  />
                </div>
                {isMarginalView && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-semibold rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                    <AlertTriangle className="w-3 h-3" />
                    Showing marginal only ({levelLabel})
                  </span>
                )}
                <span className="text-[11px] text-gray-400 ml-auto">
                  {sorted.length} result{sorted.length !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Table */}
              <div className="border border-(--color-border) rounded-lg overflow-hidden">
                <table className="w-full text-[12px]">
                  <thead>
                    <tr className="bg-gray-50/80">
                      <th className="w-8" />
                      {([
                        ['entityId', 'Entity ID'],
                        ['entityName', 'Entity'],
                        ['alertDate', 'Date'],
                        ['transactionCount', 'Txns'],
                        ['totalAmount', 'Amount'],
                        ['alertScore', 'Score'],
                        ['sarFiled', 'SAR'],
                      ] as [SortKey, string][]).map(([key, label]) => (
                        <th
                          key={key}
                          onClick={() => handleSort(key)}
                          className="px-3 py-2 text-left font-semibold text-gray-500 cursor-pointer hover:text-gray-700 select-none whitespace-nowrap"
                        >
                          <span className="inline-flex items-center gap-1">
                            {label}
                            {sortKey === key && (
                              <ArrowUpDown className="w-3 h-3 text-blue-400" />
                            )}
                          </span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.map(alert => (
                      <AlertRow
                        key={alert.id}
                        alert={alert}
                        rule={rule}
                        isExpanded={expandedRow === alert.id}
                        onToggle={() => setExpandedRow(expandedRow === alert.id ? null : alert.id)}
                      />
                    ))}
                    {paginated.length === 0 && (
                      <tr>
                        <td colSpan={8} className="px-4 py-8 text-center text-gray-400 text-[12px]">
                          No alerts match the current filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-gray-400">
                    Page {page + 1} of {totalPages}
                  </span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setPage(p => Math.max(0, p - 1))}
                      disabled={page === 0}
                      className="px-2.5 py-1 text-[11px] rounded-md border border-(--color-border) disabled:opacity-30 hover:bg-gray-50 cursor-pointer disabled:cursor-default"
                    >
                      Prev
                    </button>
                    <button
                      onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                      disabled={page >= totalPages - 1}
                      className="px-2.5 py-1 text-[11px] rounded-md border border-(--color-border) disabled:opacity-30 hover:bg-gray-50 cursor-pointer disabled:cursor-default"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Alert Row (expandable)
// ---------------------------------------------------------------------------

function AlertRow({ alert, rule, isExpanded, onToggle }: {
  alert: AlertRecord
  rule: Rule
  isExpanded: boolean
  onToggle: () => void
}) {
  return (
    <>
      <tr
        onClick={onToggle}
        className={`border-t border-(--color-border) cursor-pointer transition-colors ${isExpanded ? 'bg-blue-50/40' : 'hover:bg-gray-50/60'}`}
      >
        <td className="pl-3 pr-1 py-2">
          <ChevronRight className={`w-3.5 h-3.5 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
        </td>
        <td className="px-3 py-2 font-mono text-gray-500">{alert.entityId}</td>
        <td className="px-3 py-2 font-medium text-gray-700">{alert.entityName}</td>
        <td className="px-3 py-2 text-gray-500">{formatDate(alert.alertDate)}</td>
        <td className="px-3 py-2 text-gray-600">{alert.transactionCount}</td>
        <td className="px-3 py-2 text-gray-600">{formatCurrency(alert.totalAmount)}</td>
        <td className="px-3 py-2">
          <span className="inline-flex items-center justify-center w-8 text-center font-mono text-gray-600">
            {alert.alertScore.toFixed(1)}
          </span>
        </td>
        <td className="px-3 py-2">
          {alert.sarFiled ? (
            <span className="inline-flex items-center gap-1 text-red-600">
              <CheckCircle2 className="w-3.5 h-3.5" /> Filed
            </span>
          ) : alert.inferredSar ? (
            <span className="inline-flex items-center gap-1 text-amber-500">
              <AlertTriangle className="w-3 h-3" /> Inferred
            </span>
          ) : (
            <span className="text-gray-300">-</span>
          )}
        </td>
      </tr>

      {/* Expanded detail */}
      <AnimatePresence>
        {isExpanded && (
          <tr>
            <td colSpan={8} className="p-0">
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="px-5 py-4 bg-gray-50/50 border-t border-(--color-border)">
                  <div className="grid grid-cols-[3fr_2fr] gap-6">
                    {/* Left: Transactions */}
                    <TransactionsPanel alert={alert} rule={rule} />
                    {/* Right: Why This Alert */}
                    <WhyThisAlertPanel alert={alert} rule={rule} />
                  </div>
                </div>
              </motion.div>
            </td>
          </tr>
        )}
      </AnimatePresence>
    </>
  )
}

// ---------------------------------------------------------------------------
// Transactions Panel
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Enriched transaction types per rule
// ---------------------------------------------------------------------------

interface EnrichedBase extends TransactionRecord {
  triggered: boolean
  triggerIdx: number // -1 if not yet determined
}

interface VelocityEnriched extends EnrichedBase {
  _rule: 'velocity'
  meetsFloor: boolean
  qualifies: boolean
  runningCount: number
  velocityThreshold: number
}

interface StructuringEnriched extends EnrichedBase {
  _rule: 'structuring'
  nearLimit: boolean
  nearPct: number
  nearCount: number
  cumulativeAmount: number
  countTrigger: number
  reportingThreshold: number
}

interface RapidMovementEnriched extends EnrichedBase {
  _rule: 'rapid-movement'
  cumulIn: number
  cumulOut: number
  ratio: number
  ratioThreshold: number
  minInflow: number
  ratioTriggered: boolean
}

interface EscalatingEnriched extends EnrichedBase {
  _rule: 'escalating'
  qualifies: boolean
  rollingAvg: number | null
  priorAvg: number | null
  growth: number | null
  growthThreshold: number
  minTxns: number
  qualifyingCount: number
}

type EnrichedTxn = VelocityEnriched | StructuringEnriched | RapidMovementEnriched | EscalatingEnriched

function getParam(rule: Rule, id: string): number {
  const p = rule.parameters.find(p => p.id === id)
  return typeof p?.currentValue === 'number' ? p.currentValue : 0
}

function enrichTransactions(alert: AlertRecord, rule: Rule): { txns: EnrichedTxn[]; triggerIdx: number } {
  const sorted = [...alert.transactions].sort((a, b) => a.date.localeCompare(b.date))

  switch (rule.id) {
    case 'rule-001': {
      const amountFloor = getParam(rule, 'p2')
      const velocityThreshold = getParam(rule, 'p1')
      let count = 0
      let trigger = -1
      const txns = sorted.map((txn, i) => {
        const meetsFloor = txn.amount >= amountFloor
        const qualifies = txn.passedFilters && meetsFloor
        if (qualifies) count++
        if (trigger === -1 && count >= velocityThreshold) trigger = i
        return { ...txn, _rule: 'velocity' as const, meetsFloor, qualifies, runningCount: count, velocityThreshold, triggered: trigger !== -1 && i >= trigger, triggerIdx: trigger }
      })
      return { txns, triggerIdx: trigger }
    }

    case 'rule-005': {
      const reportingThreshold = getParam(rule, 'p10')
      const nearPctParam = getParam(rule, 'p11')
      const countTrigger = getParam(rule, 'p12')
      const nearFloor = reportingThreshold * nearPctParam
      let nearCount = 0
      let cumulativeAmount = 0
      let trigger = -1
      const txns = sorted.map((txn, i) => {
        const nearLimit = txn.passedFilters && txn.amount >= nearFloor && txn.amount < reportingThreshold
        const nearPct = txn.amount / reportingThreshold
        if (txn.passedFilters) cumulativeAmount += txn.amount
        if (nearLimit) nearCount++
        if (trigger === -1 && nearCount >= countTrigger) trigger = i
        return { ...txn, _rule: 'structuring' as const, nearLimit, nearPct, nearCount, cumulativeAmount, countTrigger, reportingThreshold, triggered: trigger !== -1 && i >= trigger, triggerIdx: trigger }
      })
      return { txns, triggerIdx: trigger }
    }

    case 'rule-006': {
      const ratioThreshold = getParam(rule, 'p13')
      const minInflow = getParam(rule, 'p14')
      let cumulIn = 0
      let cumulOut = 0
      let trigger = -1
      const txns = sorted.map((txn, i) => {
        if (txn.passedFilters) {
          if (txn.direction === 'inflow') cumulIn += txn.amount
          else if (txn.direction === 'outflow') cumulOut += txn.amount
        }
        const ratio = cumulIn > 0 ? cumulOut / cumulIn : 0
        const ratioTriggered = ratio >= ratioThreshold && cumulIn >= minInflow
        if (trigger === -1 && ratioTriggered) trigger = i
        return { ...txn, _rule: 'rapid-movement' as const, cumulIn, cumulOut, ratio, ratioThreshold, minInflow, ratioTriggered, triggered: trigger !== -1 && i >= trigger, triggerIdx: trigger }
      })
      return { txns, triggerIdx: trigger }
    }

    case 'rule-007': {
      const growthThreshold = getParam(rule, 'p15')
      const minTxns = getParam(rule, 'p16')
      const baseAmount = getParam(rule, 'p17')
      const qualifyingAmounts: number[] = []
      let trigger = -1
      const txns = sorted.map((txn, i) => {
        const qualifies = txn.passedFilters && txn.amount >= baseAmount
        if (qualifies) qualifyingAmounts.push(txn.amount)
        const qCount = qualifyingAmounts.length
        let rollingAvg: number | null = null
        let priorAvg: number | null = null
        let growth: number | null = null
        if (qCount >= 6) {
          const half = Math.floor(qCount / 2)
          const recent = qualifyingAmounts.slice(half)
          const prior = qualifyingAmounts.slice(0, half)
          rollingAvg = recent.reduce((a, b) => a + b, 0) / recent.length
          priorAvg = prior.reduce((a, b) => a + b, 0) / prior.length
          growth = priorAvg > 0 ? rollingAvg / priorAvg : null
        } else if (qCount >= 3) {
          const recent = qualifyingAmounts.slice(-3)
          rollingAvg = recent.reduce((a, b) => a + b, 0) / recent.length
          if (qCount >= 4) {
            const prior = qualifyingAmounts.slice(0, -3)
            priorAvg = prior.reduce((a, b) => a + b, 0) / prior.length
            growth = priorAvg > 0 ? rollingAvg / priorAvg : null
          }
        }
        if (trigger === -1 && growth !== null && growth >= growthThreshold && qCount >= minTxns) trigger = i
        return { ...txn, _rule: 'escalating' as const, qualifies, rollingAvg, priorAvg, growth, growthThreshold, minTxns, qualifyingCount: qCount, triggered: trigger !== -1 && i >= trigger, triggerIdx: trigger }
      })
      return { txns, triggerIdx: trigger }
    }

    default: {
      // Fallback: just show basic columns
      const txns: EnrichedTxn[] = sorted.map(txn => ({
        ...txn, _rule: 'velocity' as const, meetsFloor: true, qualifies: txn.passedFilters,
        runningCount: 0, velocityThreshold: 0, triggered: false, triggerIdx: -1,
      }))
      return { txns, triggerIdx: -1 }
    }
  }
}

// ---------------------------------------------------------------------------
// TransactionsPanel — rule-aware
// ---------------------------------------------------------------------------

function TransactionsPanel({ alert, rule }: { alert: AlertRecord; rule: Rule }) {
  const inScope = alert.transactions.filter(t => t.passedFilters).length
  const outScope = alert.transactions.length - inScope

  const { txns: enrichedTxns, triggerIdx } = useMemo(
    () => enrichTransactions(alert, rule),
    [alert, rule]
  )

  return (
    <div>
      <div className="flex items-baseline gap-2 mb-2">
        <h4 className="text-[11px] font-semibold text-gray-700 uppercase tracking-wide">
          Transactions in Aggregation Window
        </h4>
        <span className="text-[10px] text-gray-400">
          {formatDate(alert.aggregationWindowStart)} - {formatDate(alert.aggregationWindowEnd)}
        </span>
      </div>
      <div className="flex gap-3 mb-2">
        <span className="text-[10px] text-gray-500">
          <span className="font-semibold text-gray-700">{inScope}</span> in scope
        </span>
        <span className="text-[10px] text-gray-400">
          <span className="font-semibold text-gray-500">{outScope}</span> filtered out
        </span>
        <RuleSummaryBadge rule={rule} />
      </div>
      <div className="border border-(--color-border) rounded-lg overflow-hidden bg-white">
        <table className="w-full text-[11px]">
          <thead>
            <tr className="bg-gray-50/80">
              <th className="px-2.5 py-1.5 text-left font-semibold text-gray-500">Date</th>
              <th className="px-2.5 py-1.5 text-left font-semibold text-gray-500">Type</th>
              <th className="px-2.5 py-1.5 text-right font-semibold text-gray-500">Amount</th>
              <RuleColumnHeaders ruleId={rule.id} />
            </tr>
          </thead>
          <tbody>
            {enrichedTxns.map((txn, i) => {
              const isTriggerRow = i === triggerIdx
              const isPastTrigger = triggerIdx >= 0 && i > triggerIdx

              return (
                <tr
                  key={txn.id}
                  className={[
                    'border-t border-gray-100 transition-colors',
                    !txn.passedFilters ? 'opacity-40 line-through decoration-gray-300' : '',
                    isTriggerRow ? 'bg-[#00A99D]/[0.08] border-l-2 border-l-[#00A99D]' : '',
                    isPastTrigger ? 'bg-[#00A99D]/[0.03]' : '',
                  ].join(' ')}
                >
                  <td className="px-2.5 py-1.5 text-gray-500">{formatDate(txn.date)}</td>
                  <td className="px-2.5 py-1.5 text-gray-600">{txn.type}</td>
                  <td className="px-2.5 py-1.5 text-right font-mono text-gray-600">
                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: txn.currency, maximumFractionDigits: 0 }).format(txn.amount)}
                  </td>
                  <RuleStateCells txn={txn} isTriggerRow={isTriggerRow} isPastTrigger={isPastTrigger} />
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Rule-specific header & cell renderers
// ---------------------------------------------------------------------------

function RuleSummaryBadge({ rule }: { rule: Rule }) {
  switch (rule.id) {
    case 'rule-001':
      return (
        <span className="text-[10px] text-gray-400 ml-auto">
          Floor: <span className="font-semibold text-gray-600">{formatCurrency(getParam(rule, 'p2'))}</span>
          <span className="mx-1.5 text-gray-300">|</span>
          Velocity: <span className="font-semibold text-gray-600">{getParam(rule, 'p1')} txns</span>
        </span>
      )
    case 'rule-005':
      return (
        <span className="text-[10px] text-gray-400 ml-auto">
          CTR Limit: <span className="font-semibold text-gray-600">{formatCurrency(getParam(rule, 'p10'))}</span>
          <span className="mx-1.5 text-gray-300">|</span>
          Near: <span className="font-semibold text-gray-600">&ge;{(getParam(rule, 'p11') * 100).toFixed(0)}%</span>
          <span className="mx-1.5 text-gray-300">|</span>
          Trigger: <span className="font-semibold text-gray-600">{getParam(rule, 'p12')} txns</span>
        </span>
      )
    case 'rule-006':
      return (
        <span className="text-[10px] text-gray-400 ml-auto">
          Ratio: <span className="font-semibold text-gray-600">&ge;{(getParam(rule, 'p13') * 100).toFixed(0)}%</span>
          <span className="mx-1.5 text-gray-300">|</span>
          Min Inflow: <span className="font-semibold text-gray-600">{formatCurrency(getParam(rule, 'p14'))}</span>
        </span>
      )
    case 'rule-007':
      return (
        <span className="text-[10px] text-gray-400 ml-auto">
          Growth: <span className="font-semibold text-gray-600">&ge;{getParam(rule, 'p15')}&times;</span>
          <span className="mx-1.5 text-gray-300">|</span>
          Min Txns: <span className="font-semibold text-gray-600">{getParam(rule, 'p16')}</span>
          <span className="mx-1.5 text-gray-300">|</span>
          Floor: <span className="font-semibold text-gray-600">{formatCurrency(getParam(rule, 'p17'))}</span>
        </span>
      )
    default:
      return null
  }
}

function RuleColumnHeaders({ ruleId }: { ruleId: string }) {
  const th = "px-2.5 py-1.5 font-semibold text-gray-500"
  switch (ruleId) {
    case 'rule-001':
      return (<>
        <th className={`${th} text-center`}>&ge; Floor</th>
        <th className={`${th} text-center`}>In Scope</th>
        <th className={`${th} text-right`}>Velocity</th>
      </>)
    case 'rule-005':
      return (<>
        <th className={`${th} text-center`}>Near Limit</th>
        <th className={`${th} text-right`}>Count</th>
        <th className={`${th} text-right`}>Cumul. $</th>
      </>)
    case 'rule-006':
      return (<>
        <th className={`${th} text-center`}>Dir</th>
        <th className={`${th} text-right`}>Cumul. In</th>
        <th className={`${th} text-right`}>Cumul. Out</th>
        <th className={`${th} text-right`}>Out/In</th>
      </>)
    case 'rule-007':
      return (<>
        <th className={`${th} text-center`}>Qualifies</th>
        <th className={`${th} text-right`}>Rolling Avg</th>
        <th className={`${th} text-right`}>Prior Avg</th>
        <th className={`${th} text-right`}>Growth</th>
      </>)
    default:
      return <th className={`${th} text-center`}>In Scope</th>
  }
}

function RuleStateCells({ txn, isTriggerRow, isPastTrigger }: { txn: EnrichedTxn; isTriggerRow: boolean; isPastTrigger: boolean }) {
  const isAtOrPast = isTriggerRow || isPastTrigger
  const accent = isAtOrPast ? 'text-[#00A99D] font-semibold' : 'text-gray-500'

  switch (txn._rule) {
    case 'velocity':
      return (<>
        <td className="px-2.5 py-1.5 text-center">
          {txn.meetsFloor ? <DollarSign className="w-3.5 h-3.5 text-emerald-400 inline" /> : <XCircle className="w-3.5 h-3.5 text-gray-300 inline" />}
        </td>
        <td className="px-2.5 py-1.5 text-center">
          {txn.passedFilters ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 inline" /> : <XCircle className="w-3.5 h-3.5 text-gray-300 inline" />}
        </td>
        <td className="px-2.5 py-1.5 text-right">
          {txn.qualifies ? (
            <span className={`font-mono text-[11px] ${accent}`}>
              {txn.runningCount}<span className="text-gray-300 mx-0.5">/</span><span className="text-gray-400">{txn.velocityThreshold}</span>
            </span>
          ) : <span className="text-gray-300 font-mono">-</span>}
        </td>
      </>)

    case 'structuring':
      return (<>
        <td className="px-2.5 py-1.5 text-center">
          {txn.nearLimit ? (
            <span className="inline-flex items-center gap-0.5 text-amber-500 font-mono text-[10px] font-semibold">
              <AlertTriangle className="w-3 h-3" />
              {(txn.nearPct * 100).toFixed(0)}%
            </span>
          ) : txn.amount >= txn.reportingThreshold ? (
            <span className="text-red-400 font-mono text-[10px]">&ge;100%</span>
          ) : (
            <span className="text-gray-300 font-mono text-[10px]">{(txn.nearPct * 100).toFixed(0)}%</span>
          )}
        </td>
        <td className="px-2.5 py-1.5 text-right">
          {txn.nearLimit ? (
            <span className={`font-mono text-[11px] ${accent}`}>
              {txn.nearCount}<span className="text-gray-300 mx-0.5">/</span><span className="text-gray-400">{txn.countTrigger}</span>
            </span>
          ) : <span className="text-gray-300 font-mono">-</span>}
        </td>
        <td className="px-2.5 py-1.5 text-right font-mono text-gray-500">
          {txn.passedFilters ? formatCurrency(txn.cumulativeAmount) : '-'}
        </td>
      </>)

    case 'rapid-movement':
      return (<>
        <td className="px-2.5 py-1.5 text-center">
          {txn.direction === 'inflow' ? (
            <ArrowDownRight className="w-3.5 h-3.5 text-emerald-500 inline" />
          ) : (
            <ArrowUpRight className="w-3.5 h-3.5 text-red-400 inline" />
          )}
        </td>
        <td className="px-2.5 py-1.5 text-right font-mono text-gray-500">
          {txn.cumulIn > 0 ? formatCurrency(txn.cumulIn) : '-'}
        </td>
        <td className="px-2.5 py-1.5 text-right font-mono text-gray-500">
          {txn.cumulOut > 0 ? formatCurrency(txn.cumulOut) : '-'}
        </td>
        <td className="px-2.5 py-1.5 text-right">
          {txn.cumulIn > 0 ? (
            <span className={`font-mono text-[11px] ${txn.ratioTriggered ? 'text-[#00A99D] font-semibold' : txn.ratio >= txn.ratioThreshold ? 'text-amber-500' : 'text-gray-500'}`}>
              {(txn.ratio * 100).toFixed(1)}%
            </span>
          ) : <span className="text-gray-300 font-mono">-</span>}
        </td>
      </>)

    case 'escalating':
      return (<>
        <td className="px-2.5 py-1.5 text-center">
          {txn.qualifies ? <TrendingUp className="w-3.5 h-3.5 text-emerald-400 inline" /> : <XCircle className="w-3.5 h-3.5 text-gray-300 inline" />}
        </td>
        <td className="px-2.5 py-1.5 text-right font-mono text-gray-500">
          {txn.rollingAvg !== null ? formatCurrency(txn.rollingAvg) : '-'}
        </td>
        <td className="px-2.5 py-1.5 text-right font-mono text-gray-500">
          {txn.priorAvg !== null ? formatCurrency(txn.priorAvg) : '-'}
        </td>
        <td className="px-2.5 py-1.5 text-right">
          {txn.growth !== null ? (
            <span className={`font-mono text-[11px] ${isAtOrPast ? 'text-[#00A99D] font-semibold' : txn.growth >= txn.growthThreshold ? 'text-amber-500' : 'text-gray-500'}`}>
              &times;{txn.growth.toFixed(2)}
            </span>
          ) : <span className="text-gray-300 font-mono">-</span>}
        </td>
      </>)
  }
}

// ---------------------------------------------------------------------------
// Why This Alert Panel
// ---------------------------------------------------------------------------

function WhyThisAlertPanel({ alert, rule }: { alert: AlertRecord; rule: Rule }) {
  return (
    <div>
      <h4 className="text-[11px] font-semibold text-gray-700 uppercase tracking-wide mb-3">
        Why This Alert
      </h4>

      <div className="space-y-3">
        {alert.thresholdComparisons.map(tc => {
          const threshNum = typeof tc.threshold === 'number' ? tc.threshold : parseFloat(String(tc.threshold))
          const actualNum = typeof tc.actualValue === 'number' ? tc.actualValue : parseFloat(String(tc.actualValue))
          const ratio = threshNum > 0 ? Math.min(actualNum / threshNum, 2.5) : 1
          const pct = Math.min(ratio / 2.5 * 100, 100)

          return (
            <div key={tc.parameterId} className="bg-white rounded-lg border border-(--color-border) p-3">
              <div className="flex items-baseline justify-between mb-1">
                <span className="text-[11px] font-medium text-gray-700">{tc.parameterName}</span>
                {tc.exceeded && (
                  <span className="text-[9px] font-semibold uppercase text-red-500">Exceeded</span>
                )}
              </div>
              <div className="flex items-center gap-3 mb-1.5">
                <div className="flex-1">
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden relative">
                    {/* Threshold marker */}
                    <div
                      className="absolute top-0 bottom-0 w-px bg-gray-400 z-10"
                      style={{ left: `${(1 / 2.5) * 100}%` }}
                    />
                    {/* Actual value bar */}
                    <div
                      className={`h-full rounded-full transition-all ${tc.exceeded ? 'bg-red-400' : 'bg-emerald-400'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-between text-[10px]">
                <span className="text-gray-400">
                  Threshold: <span className="font-semibold text-gray-600">{tc.threshold}{tc.unit ? ` ${tc.unit}` : ''}</span>
                </span>
                <span className={tc.exceeded ? 'text-red-500 font-semibold' : 'text-gray-500'}>
                  Actual: {tc.actualValue}{tc.unit ? ` ${tc.unit}` : ''}
                </span>
              </div>
            </div>
          )
        })}

        {/* Lookback context */}
        <div className="bg-white rounded-lg border border-(--color-border) p-3">
          <span className="text-[11px] font-medium text-gray-700">Lookback Window</span>
          <div className="mt-1 text-[10px] text-gray-500">
            <span className="font-semibold text-gray-600">{rule.lookbackWindowHours}h</span> evaluation period
            <span className="mx-1.5 text-gray-300">|</span>
            {formatDate(alert.aggregationWindowStart)} - {formatDate(alert.aggregationWindowEnd)}
          </div>
        </div>
      </div>
    </div>
  )
}
