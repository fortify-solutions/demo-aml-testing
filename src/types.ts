export interface Rule {
  id: string
  name: string
  description: string
  taxonomy: { l1: string; l2: string; l3: string }
  parameters: RuleParameter[]
  lookbackWindowHours: number
  batchCadenceHours: number
}

export interface RuleParameter {
  id: string
  name: string
  type: "threshold" | "structural"
  currentValue: number | string
  unit?: string
  description: string
}

export interface BacktestResult {
  ruleId: string
  dateRange: { from: string; to: string }
  unitOfAnalysis: "alert" | "case" | "entity"
  labelMode: "formal" | "formal_inferred"
  groundTruth: "sar" | `case_level_${number}`
  suppressionApplied: boolean
  executionFidelity: "simplified" | "production_replicated"

  absolute: PerformanceMetrics
  marginal: Record<"l1" | "l2" | "l3" | "global", PerformanceMetrics>
  marginalBaseline: Record<"l1" | "l2" | "l3" | "global", PerformanceMetrics>

  atl: PopulationSegment
  btl: PopulationSegment

  labelComposition: {
    formal: number
    inferred: number
    total: number
  }

  volumeOverTime: Record<"l1" | "l2" | "l3" | "global", { date: string; alerts: number; sars: number; inferred: number }[]>
}

export interface PerformanceMetrics {
  precision: number
  recall: number
  f1: number
  alertVolume: number
  sarHitRate: number
  falsePositiveRate: number
  ci?: PerformanceMetricsCI
}

/** 90% credible intervals for each metric — only present when inferred labels are used */
export interface PerformanceMetricsCI {
  precision: [number, number]
  recall: [number, number]
  f1: [number, number]
  alertVolume: [number, number]
  sarHitRate: [number, number]
  falsePositiveRate: [number, number]
}

export interface PopulationSegment {
  label: "above" | "below"
  count: number
  sarRate: number
  inferredSarRate: number
  medianTransactionValue: number
  medianAlertScore: number
  distributionBins: { bin: string; count: number; sarCount: number }[]
}

export interface Recommendation {
  id: string
  targetParameterId: string | null
  type: "threshold" | "structural"
  title: string
  rationale: string
  proposedChange: string
  projectedMetrics: PerformanceMetrics
  currentMetrics: PerformanceMetrics
  evidenceSummary: string
  confidence: "high" | "medium" | "low"
}

export type UnitOfAnalysis = "alert" | "case" | "entity"
export type LabelMode = "formal" | "formal_inferred"
export type GroundTruth = "sar" | `case_level_${number}`
export type ExecutionFidelity = "simplified" | "production_replicated"
export type TaxonomyLevel = "l1" | "l2" | "l3" | "global"
export type PerformanceView = "absolute" | "marginal"
export type StratificationDimension = "overall" | "country" | "customer_type" | "product" | "channel"

export interface RuleTestingStatus {
  ruleId: string
  status: 'needs_testing' | 'recently_tested' | 'stale'
  reason?: string
  lastTestedAt?: string
  lastTestedDaysAgo?: number
}
export type LabelConfidence = "formal_only" | "formal_inferred"

export interface StratifiedMetrics {
  dimension: StratificationDimension
  segments: {
    label: string
    count: number
    metrics: PerformanceMetrics
  }[]
}

export interface AlertRecord {
  id: string
  entityId: string
  entityName: string
  alertDate: string
  aggregationWindowStart: string
  aggregationWindowEnd: string
  totalAmount: number
  transactionCount: number
  alertScore: number
  sarFiled: boolean
  inferredSar: boolean
  country: string
  customerType: string
  channel: string
  isMarginal: boolean
  marginalAtLevel: TaxonomyLevel[]
  thresholdComparisons: ThresholdComparison[]
  transactions: TransactionRecord[]
}

export interface TransactionRecord {
  id: string
  date: string
  amount: number
  currency: string
  type: string
  counterparty: string
  channel: string
  passedFilters: boolean
  direction?: 'inflow' | 'outflow'
}

export interface ThresholdComparison {
  parameterId: string
  parameterName: string
  threshold: number | string
  actualValue: number | string
  unit?: string
  exceeded: boolean
}
