import { useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Rule, UnitOfAnalysis, GroundTruth, TaxonomyLevel, BacktestResult, Recommendation, LabelConfidence, PerformanceView } from './types'
import { BACKTEST_RESULT, BACKTEST_RESULT_FORMAL, RECOMMENDATIONS_BY_RULE, MOCK_ALERTS_BY_RULE, RULES_WITH_DATA, RULES } from './data/mockData'
import { computeAdjustedResult, computeAdjustedStratifiedData } from './data/computeResults'
import { ConfigPanel } from './components/ConfigPanel'
import { ResultsToolbar } from './components/ResultsToolbar'
import { RuleLogicPanel } from './components/RuleLogicPanel'
import { AbsolutePerformance } from './components/AbsolutePerformance'
import { MarginalPerformance } from './components/MarginalPerformance'
import { PerformanceDataTable } from './components/PerformanceDataTable'
import { VolumeChart } from './components/VolumeChart'
import { AlertExplorer } from './components/AlertExplorer'
import { ATLBTLAnalysis } from './components/ATLBTLAnalysis'
import { RecommendationsPanel } from './components/RecommendationsPanel'

type RunState = 'empty' | 'loading' | 'results'
type MainTab = 'performance' | 'explorer' | 'atl_btl' | 'recommendations'

function SkeletonCard({ height = 'h-[200px]' }: { height?: string }) {
  return <div className={`rounded-xl bg-black/[0.03] animate-pulse ${height}`} />
}

export default function App() {
  // Config state
  const [selectedRule, setSelectedRule] = useState<Rule | null>(null)
  const [dateFrom, setDateFrom] = useState('2025-07-01')
  const [dateTo, setDateTo] = useState('2025-09-28')

  // Results state
  const [runState, setRunState] = useState<RunState>('empty')
  const [result, setResult] = useState<BacktestResult | null>(null)
  const [formalResult, setFormalResult] = useState<BacktestResult | null>(null)
  const [recsLoading, setRecsLoading] = useState(false)
  const [recs, setRecs] = useState<Recommendation[]>([])

  // Exploration state
  const [unitOfAnalysis, setUnitOfAnalysis] = useState<UnitOfAnalysis>('alert')
  const [groundTruth, setGroundTruth] = useState<GroundTruth>('sar')
  const [labelConfidence, setLabelConfidence] = useState<LabelConfidence>('formal_only')
  const [taxonomyLevel, setTaxonomyLevel] = useState<TaxonomyLevel>('l1')
  const [highlightedMetrics, setHighlightedMetrics] = useState<Set<string> | null>(null)
  const [activeTab, setActiveTab] = useState<MainTab>('performance')
  const [performanceView, setPerformanceView] = useState<PerformanceView>('absolute')

  const labelMode = labelConfidence === 'formal_inferred' ? 'formal_inferred' as const : 'formal' as const

  const dataRuleId = selectedRule && RULES_WITH_DATA.has(selectedRule.id) ? selectedRule.id : RULES[0].id
  const dataRule = selectedRule && RULES_WITH_DATA.has(selectedRule.id) ? selectedRule : RULES[0]

  const handleRunBacktest = useCallback(() => {
    setRunState('loading')
    setRecs([])
    setRecsLoading(true)

    setTimeout(() => {
      setResult(BACKTEST_RESULT)
      setFormalResult(BACKTEST_RESULT_FORMAL)
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

  const formalOnly = useMemo(() => {
    if (!formalResult) return null
    return computeAdjustedResult(formalResult, groundTruth, unitOfAnalysis, labelConfidence)
  }, [formalResult, groundTruth, unitOfAnalysis, labelConfidence])

  const stratifiedData = useMemo(() => {
    return computeAdjustedStratifiedData(groundTruth, unitOfAnalysis, labelConfidence)
  }, [groundTruth, unitOfAnalysis, labelConfidence])

  const recsCount = recs.length
  const alertsCount = (MOCK_ALERTS_BY_RULE[dataRuleId] ?? []).length

  const TABS: { id: MainTab; label: string; badge?: number }[] = [
    { id: 'performance', label: 'Performance Data' },
    { id: 'explorer', label: 'Alert Explorer', badge: alertsCount },
    { id: 'atl_btl', label: 'ATL / BTL Analysis' },
    { id: 'recommendations', label: 'Recommendations', badge: recsCount > 0 ? recsCount : undefined },
  ]

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-(--color-bg)">
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

      {/* Fixed summary header: toolbar + rule logic + label section + absolute performance */}
      <AnimatePresence>
        {runState === 'results' && activeResult && formalOnly && (
          <motion.div
            key="results-header"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="shrink-0 border-b border-(--color-border) bg-(--color-bg) overflow-y-auto"
            style={{ maxHeight: 'calc(60vh)' }}
          >
            <div className="px-8 pt-4 pb-5 space-y-4">
              <ResultsToolbar
                groundTruth={groundTruth}
                onGroundTruthChange={setGroundTruth}
                labelConfidence={labelConfidence}
                onLabelConfidenceChange={setLabelConfidence}
                unitOfAnalysis={unitOfAnalysis}
                onUnitChange={setUnitOfAnalysis}
                performanceView={performanceView}
                onPerformanceViewChange={setPerformanceView}
              />
              <RuleLogicPanel rule={selectedRule!} />
              <AnimatePresence mode="wait">
                {performanceView === 'absolute' ? (
                  <motion.div key="abs" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.2 }}>
                    <AbsolutePerformance
                      metrics={activeResult.absolute}
                      formalMetrics={formalOnly.absolute}
                      labelMode={labelMode}
                      highlightedMetrics={highlightedMetrics ?? undefined}
                    />
                  </motion.div>
                ) : (
                  <motion.div key="marg" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.2 }}>
                    <MarginalPerformance
                      marginalData={activeResult.marginal}
                      baselineData={activeResult.marginalBaseline}
                      absoluteData={activeResult.absolute}
                      taxonomy={selectedRule!.taxonomy}
                      selectedLevel={taxonomyLevel}
                      onLevelChange={setTaxonomyLevel}
                      labelMode={labelMode}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tab bar + scrollable tab content */}
      <div className="flex-1 flex flex-col overflow-hidden">
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

          {runState === 'results' && activeResult && formalOnly && (
            <motion.div
              key="results-tabs"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="flex-1 flex flex-col overflow-hidden"
            >
              {/* Tab bar */}
              <div className="shrink-0 border-b border-(--color-border) bg-gray-50 px-6">
                <div className="flex gap-0.5">
                  {TABS.map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`relative flex items-center gap-2 px-5 py-3.5 text-[12px] font-semibold whitespace-nowrap transition-all cursor-pointer border-b-2 -mb-px ${
                        activeTab === tab.id
                          ? 'text-[#00A99D] border-[#00A99D] bg-white rounded-t-lg'
                          : 'text-gray-500 border-transparent hover:text-gray-800 hover:bg-white/60 rounded-t-lg'
                      }`}
                    >
                      {tab.label}
                      {tab.badge !== undefined && tab.badge > 0 && (
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold leading-none ${
                          activeTab === tab.id ? 'bg-[#00A99D] text-white' : 'bg-gray-200 text-gray-500'
                        }`}>
                          {tab.badge}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tab content — full-width, scrollable */}
              <div className="flex-1 overflow-y-auto">
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
                          levelLabel={taxonomyLevel === 'global' ? 'Global' : selectedRule!.taxonomy[taxonomyLevel as 'l1' | 'l2' | 'l3']}
                          labelMode={labelMode}
                          performanceView={performanceView}
                        />
                        <PerformanceDataTable data={stratifiedData} inTabContainer />
                      </>
                    )}

                    {activeTab === 'explorer' && (
                      <AlertExplorer
                        alerts={MOCK_ALERTS_BY_RULE[dataRuleId] ?? []}
                        performanceView="absolute"
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
