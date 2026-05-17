import { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronUp, ChevronDown } from 'lucide-react'
import type { Rule, UnitOfAnalysis, GroundTruth, TaxonomyLevel, BacktestResult, Recommendation, LabelConfidence, ASelection } from './types'
import { BACKTEST_RESULT, RECOMMENDATIONS_BY_RULE, MOCK_ALERTS_BY_RULE, RULES_WITH_DATA, RULES } from './data/mockData'
import { computeAdjustedResult, computeAdjustedStratifiedData, getAB } from './data/computeResults'
import { useDomain, useCopy } from './domain-context'
import { ConfigPanel } from './components/ConfigPanel'
import { ResultsToolbar } from './components/ResultsToolbar'
import { RuleLogicPanel } from './components/RuleLogicPanel'
import { ABPerformance } from './components/ABPerformance'
import { PerformanceDataTable } from './components/PerformanceDataTable'
import { VolumeChart } from './components/VolumeChart'
import { AlertExplorer } from './components/AlertExplorer'
import { ATLBTLAnalysis } from './components/ATLBTLAnalysis'
import { RecommendationsPanel } from './components/RecommendationsPanel'

type RunState = 'empty' | 'loading' | 'results'
type MainTab = 'performance' | 'explorer' | 'atl_btl' | 'recommendations'

function SkeletonCard({ height = 'h-[200px]' }: { height?: string }) {
  return <div className={`rounded-md bg-black/[0.03] animate-pulse ${height}`} />
}

export default function App() {
  const { mode } = useDomain()
  const copy = useCopy()

  // Config state
  const [selectedRule, setSelectedRule] = useState<Rule | null>(null)
  const [dateFrom, setDateFrom] = useState('2025-07-01')
  const [dateTo, setDateTo] = useState('2025-09-28')

  // When domain mode changes, drop the selected rule (it may belong to the other domain)
  useEffect(() => {
    if (selectedRule && (selectedRule.domain ?? 'aml') !== mode) {
      setSelectedRule(null)
      setRunState('empty')
      setResult(null)
      setRecs([])
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode])

  // Results state
  const [runState, setRunState] = useState<RunState>('empty')
  const [result, setResult] = useState<BacktestResult | null>(null)
  const [recsLoading, setRecsLoading] = useState(false)
  const [recs, setRecs] = useState<Recommendation[]>([])

  // Exploration state
  const [unitOfAnalysis, setUnitOfAnalysis] = useState<UnitOfAnalysis>('alert')
  const [groundTruth, setGroundTruth] = useState<GroundTruth>('sar')
  const [labelConfidence, setLabelConfidence] = useState<LabelConfidence>('formal_only')
  const [aSelection, setASelection] = useState<ASelection>({ kind: 'portfolio_minus', level: 'l1' })
  // Derived taxonomy level for panels other than ABPerformance (VolumeChart, AlertExplorer)
  const taxonomyLevel: TaxonomyLevel = aSelection.kind === 'portfolio_minus' ? aSelection.level : 'l1'
  const [highlightedMetrics, setHighlightedMetrics] = useState<Set<string> | null>(null)
  const [activeTab, setActiveTab] = useState<MainTab>('performance')
  const [summaryCollapsed, setSummaryCollapsed] = useState(false)
  // overflow flag: hidden during animation, visible once fully expanded so popovers (e.g. A-selector) aren't clipped
  const [summaryOverflowVisible, setSummaryOverflowVisible] = useState(true)
  const summaryContentRef = useRef<HTMLDivElement>(null)

  const labelMode = labelConfidence === 'formal_inferred' ? 'formal_inferred' as const : 'formal' as const

  const dataRuleId = selectedRule && RULES_WITH_DATA.has(selectedRule.id) ? selectedRule.id : RULES[0].id
  const dataRule = selectedRule && RULES_WITH_DATA.has(selectedRule.id) ? selectedRule : RULES[0]

  const handleRunBacktest = useCallback(() => {
    setRunState('loading')
    setRecs([])
    setRecsLoading(true)

    setTimeout(() => {
      setResult(BACKTEST_RESULT)
      setRunState('results')

      setTimeout(() => {
        setRecs(RECOMMENDATIONS_BY_RULE[dataRuleId] ?? [])
        setRecsLoading(false)
      }, 1800)
    }, 1500)
  }, [dataRuleId])

  const handleApplyRecommendation = useCallback((rec: Recommendation) => {
    console.log('Apply recommendation:', rec.id, rec)
  }, [])

  const activeResult = useMemo(() => {
    if (!result) return null
    return computeAdjustedResult(result, groundTruth, unitOfAnalysis, labelConfidence)
  }, [result, groundTruth, unitOfAnalysis, labelConfidence])

  const ab = useMemo(() => {
    if (!activeResult) return null
    return getAB(activeResult, aSelection)
  }, [activeResult, aSelection])

  const stratifiedData = useMemo(() => {
    return computeAdjustedStratifiedData(groundTruth, unitOfAnalysis, labelConfidence)
  }, [groundTruth, unitOfAnalysis, labelConfidence])

  const recsCount = recs.length
  const alertsCount = (MOCK_ALERTS_BY_RULE[dataRuleId] ?? []).length

  const TABS: { id: MainTab; label: string; badge?: number }[] = [
    { id: 'performance', label: 'Performance Data' },
    { id: 'explorer', label: 'Alert Explorer', badge: alertsCount },
    { id: 'atl_btl', label: copy.thresholdAnalysis.tabName },
    { id: 'recommendations', label: 'Recommendations', badge: recsCount > 0 ? recsCount : undefined },
  ]

  return (
    <div className="flex flex-col min-h-screen bg-(--color-bg)">
      {/* Top Config Bar */}
      <ConfigPanel
        selectedRule={selectedRule}
        onSelectRule={setSelectedRule}
        dateFrom={dateFrom}
        dateTo={dateTo}
        onDateFromChange={setDateFrom}
        onDateToChange={setDateTo}
        onRunBacktest={handleRunBacktest}
        isRunning={runState === 'loading'}
      />

      {/* Collapsible summary header */}
      <AnimatePresence>
        {runState === 'results' && activeResult && (
          <motion.div
            key="results-header"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="shrink-0 border-b border-(--color-border) bg-(--color-bg)"
          >
            <motion.div
              animate={{ height: summaryCollapsed ? 0 : 'auto' }}
              initial={false}
              transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
              onAnimationStart={() => setSummaryOverflowVisible(false)}
              onAnimationComplete={() => { if (!summaryCollapsed) setSummaryOverflowVisible(true) }}
              style={{ overflow: summaryOverflowVisible && !summaryCollapsed ? 'visible' : 'hidden' }}
            >
              <div ref={summaryContentRef} className="px-8 pt-3 pb-3 space-y-3">
                <ResultsToolbar
                  groundTruth={groundTruth}
                  onGroundTruthChange={setGroundTruth}
                  labelConfidence={labelConfidence}
                  onLabelConfidenceChange={setLabelConfidence}
                  unitOfAnalysis={unitOfAnalysis}
                  onUnitChange={setUnitOfAnalysis}
                />
                <RuleLogicPanel rule={selectedRule!} />
                {ab && (
                  <ABPerformance
                    ab={ab}
                    rule={selectedRule!}
                    aSelection={aSelection}
                    onASelectionChange={setASelection}
                    labelMode={labelMode}
                    highlightedMetrics={highlightedMetrics ?? undefined}
                  />
                )}
              </div>
            </motion.div>
            <button
              onClick={() => setSummaryCollapsed(c => !c)}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 text-[11px] font-medium text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              {summaryCollapsed ? (
                <>Show summary<ChevronDown className="w-3.5 h-3.5" /></>
              ) : (
                <>Hide summary<ChevronUp className="w-3.5 h-3.5" /></>
              )}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tab bar + scrollable tab content */}
      <div className="flex-1 flex flex-col">
        <AnimatePresence mode="wait">
          {runState === 'empty' && (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center flex-1"
            >
              <span className="text-[13px] text-gray-400">
                Select a rule and run a backtest to begin.
              </span>
            </motion.div>
          )}

          {runState === 'loading' && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 overflow-y-auto px-8 py-6 space-y-6"
            >
              <SkeletonCard height="h-[60px]" />
              <SkeletonCard height="h-[180px]" />
              <SkeletonCard height="h-[260px]" />
              <SkeletonCard height="h-[300px]" />
            </motion.div>
          )}

          {runState === 'results' && activeResult && (
            <motion.div
              key="results-tabs"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="flex-1 flex flex-col"
            >
              {/* Tab bar */}
              <div className="shrink-0 border-b border-(--color-border-subtle) bg-(--color-panel) px-6">
                <div className="flex gap-1">
                  {TABS.map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`relative flex items-center gap-2 px-4 py-2.5 text-[13px] font-medium whitespace-nowrap transition-colors cursor-pointer border-b-2 -mb-px ${
                        activeTab === tab.id
                          ? 'text-(--color-primary) border-(--color-primary)'
                          : 'text-(--color-text-secondary) border-transparent hover:text-(--color-text-primary)'
                      }`}
                    >
                      {tab.label}
                      {tab.badge !== undefined && tab.badge > 0 && (
                        <span className={`rounded-sm px-1.5 py-0.5 text-[10px] font-semibold leading-none border ${
                          activeTab === tab.id
                            ? 'bg-(--color-surface-selected) text-(--color-primary) border-(--color-border-subtle)'
                            : 'bg-gray-50 text-gray-500 border-(--color-border-subtle)'
                        }`}>
                          {tab.badge}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tab content — full-width, scrollable */}
              <div className="flex-1">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.18 }}
                    className="px-8 py-6 space-y-6"
                  >
                    {activeTab === 'performance' && (
                      <>
                        <VolumeChart
                          data={activeResult.volumeOverTime}
                          selectedLevel={taxonomyLevel}
                          levelLabel={taxonomyLevel === 'global' ? '' : selectedRule!.taxonomy[taxonomyLevel as 'l1' | 'l2' | 'l3']}
                          labelMode={labelMode}
                        />
                        <PerformanceDataTable data={stratifiedData} inTabContainer />
                      </>
                    )}

                    {activeTab === 'explorer' && (
                      <AlertExplorer
                        alerts={MOCK_ALERTS_BY_RULE[dataRuleId] ?? []}
                        taxonomyLevel={taxonomyLevel}
                        rule={dataRule}
                        inTabContainer
                      />
                    )}

                    {activeTab === 'atl_btl' && (
                      <ATLBTLAnalysis
                        atl={activeResult.atl}
                        btl={activeResult.btl}
                        labelMode={labelMode}
                        rule={dataRule}
                        inTabContainer
                      />
                    )}

                    {activeTab === 'recommendations' && (
                      <RecommendationsPanel
                        recommendations={recs}
                        loading={recsLoading}
                        onHoverRecommendation={setHighlightedMetrics}
                        onApply={handleApplyRecommendation}
                        inTabContainer
                      />
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
