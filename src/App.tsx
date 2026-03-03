import { useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Rule, UnitOfAnalysis, GroundTruth, ExecutionFidelity, TaxonomyLevel, BacktestResult, Recommendation, PerformanceView, LabelConfidence } from './types'
import { BACKTEST_RESULT, BACKTEST_RESULT_FORMAL, RECOMMENDATIONS } from './data/mockData'
import { computeAdjustedResult, computeAdjustedStratifiedData } from './data/computeResults'
import { ConfigPanel } from './components/ConfigPanel'
import { ResultsToolbar } from './components/ResultsToolbar'
import { LabelCompositionBar } from './components/LabelCompositionBar'
import { AbsolutePerformance } from './components/AbsolutePerformance'
import { MarginalPerformance } from './components/MarginalPerformance'
import { PerformanceDataTable } from './components/PerformanceDataTable'
import { VolumeChart } from './components/VolumeChart'
import { ATLBTLAnalysis } from './components/ATLBTLAnalysis'
import { RecommendationsPanel } from './components/RecommendationsPanel'

type RunState = 'empty' | 'loading' | 'results'

function SkeletonCard({ height = 'h-[200px]' }: { height?: string }) {
  return <div className={`rounded-xl bg-black/[0.03] animate-pulse ${height}`} />
}

export default function App() {
  // Config state
  const [selectedRule, setSelectedRule] = useState<Rule | null>(null)
  const [dateFrom, setDateFrom] = useState('2025-07-01')
  const [dateTo, setDateTo] = useState('2025-09-28')
  const [suppressionIncluded, setSuppressionIncluded] = useState(false)
  const [executionFidelity, setExecutionFidelity] = useState<ExecutionFidelity>('simplified')

  // Results state
  const [runState, setRunState] = useState<RunState>('empty')
  const [result, setResult] = useState<BacktestResult | null>(null)
  const [formalResult, setFormalResult] = useState<BacktestResult | null>(null)
  const [recsLoading, setRecsLoading] = useState(false)
  const [recs, setRecs] = useState<Recommendation[]>([])

  // Exploration state (in-results controls)
  const [unitOfAnalysis, setUnitOfAnalysis] = useState<UnitOfAnalysis>('alert')
  const [groundTruth, setGroundTruth] = useState<GroundTruth>('sar')
  const [labelConfidence, setLabelConfidence] = useState<LabelConfidence>('formal_inferred')
  const [performanceView, setPerformanceView] = useState<PerformanceView>('absolute')
  const [taxonomyLevel, setTaxonomyLevel] = useState<TaxonomyLevel>('l1')
  const [highlightedMetrics, setHighlightedMetrics] = useState<Set<string> | null>(null)

  // labelMode is now driven by the label confidence toggle
  const labelMode = labelConfidence === 'formal_inferred' ? 'formal_inferred' as const : 'formal' as const

  const handleRunBacktest = useCallback(() => {
    setRunState('loading')
    setRecs([])
    setRecsLoading(true)

    setTimeout(() => {
      setResult(BACKTEST_RESULT)
      setFormalResult(BACKTEST_RESULT_FORMAL)
      setRunState('results')

      setTimeout(() => {
        setRecs(RECOMMENDATIONS)
        setRecsLoading(false)
      }, 1800)
    }, 1500)
  }, [])

  const handleApplyRecommendation = useCallback((rec: Recommendation) => {
    console.log('Apply recommendation:', rec.id, rec)
  }, [])

  // Compute adjusted data whenever toolbar controls change
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

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-(--color-bg)">
      {/* Page Header */}
      <header className="h-12 flex items-center px-6 border-b border-(--color-border) shrink-0">
        <span className="text-[13px] text-gray-500">Rule Testing</span>
        {selectedRule && (
          <>
            <span className="text-[13px] text-gray-300 mx-2">/</span>
            <span className="text-[13px] text-gray-400">{selectedRule.name}</span>
          </>
        )}
      </header>

      {/* Main Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Config Panel */}
        <ConfigPanel
          selectedRule={selectedRule}
          onSelectRule={setSelectedRule}
          dateFrom={dateFrom}
          dateTo={dateTo}
          onDateFromChange={setDateFrom}
          onDateToChange={setDateTo}
          suppressionIncluded={suppressionIncluded}
          onSuppressionChange={setSuppressionIncluded}
          executionFidelity={executionFidelity}
          onFidelityChange={setExecutionFidelity}
          onRunBacktest={handleRunBacktest}
          isRunning={runState === 'loading'}
        />

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto px-8 py-6">
          <div className="max-w-[1400px] mx-auto space-y-6">
            <AnimatePresence mode="wait">
              {runState === 'empty' && (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center justify-center h-[60vh]"
                >
                  <span className="text-[13px] text-gray-300">
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
                  className="space-y-6"
                >
                  <SkeletonCard height="h-[50px]" />
                  <SkeletonCard height="h-[60px]" />
                  <SkeletonCard height="h-[180px]" />
                  <SkeletonCard height="h-[260px]" />
                  <SkeletonCard height="h-[300px]" />
                  <SkeletonCard height="h-[200px]" />
                </motion.div>
              )}

              {runState === 'results' && activeResult && formalOnly && (
                <motion.div
                  key="results"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="space-y-6"
                >
                  {/* Results Exploration Toolbar */}
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

                  <LabelCompositionBar
                    formal={activeResult.labelComposition.formal}
                    inferred={activeResult.labelComposition.inferred}
                    total={activeResult.labelComposition.total}
                    labelMode={labelMode}
                  />

                  {/* Performance: toggle between Absolute and Marginal */}
                  <AnimatePresence mode="wait">
                    {performanceView === 'absolute' ? (
                      <motion.div
                        key="absolute"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.2 }}
                      >
                        <AbsolutePerformance
                          metrics={activeResult.absolute}
                          formalMetrics={formalOnly.absolute}
                          labelMode={labelMode}
                          highlightedMetrics={highlightedMetrics ?? undefined}
                        />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="marginal"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.2 }}
                      >
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

                  {/* Performance Data Table with stratification */}
                  <PerformanceDataTable data={stratifiedData} />

                  <VolumeChart
                    data={activeResult.volumeOverTime}
                    selectedLevel={taxonomyLevel}
                    levelLabel={taxonomyLevel === 'global' ? 'Global' : selectedRule!.taxonomy[taxonomyLevel as 'l1' | 'l2' | 'l3']}
                    labelMode={labelMode}
                  />

                  <ATLBTLAnalysis
                    atl={activeResult.atl}
                    btl={activeResult.btl}
                    labelMode={labelMode}
                    rule={selectedRule!}
                  />

                  <RecommendationsPanel
                    recommendations={recs}
                    loading={recsLoading}
                    onHoverRecommendation={setHighlightedMetrics}
                    onApply={handleApplyRecommendation}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  )
}
