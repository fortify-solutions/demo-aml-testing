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
export type LabelConfidence = "formal_only" | "formal_inferred"

export interface StratifiedMetrics {
  dimension: StratificationDimension
  segments: {
    label: string
    count: number
    metrics: PerformanceMetrics
  }[]
}
