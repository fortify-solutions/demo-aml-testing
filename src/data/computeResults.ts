import type { PerformanceMetrics, BacktestResult, PopulationSegment, GroundTruth, UnitOfAnalysis, LabelConfidence, TaxonomyLevel } from '../types'
import { STRATIFIED_DATA } from './mockData'

// ---------------------------------------------------------------------------
// Modifier tables – each toolbar dimension applies a multiplier to the base
// metrics so every control produces visible, plausible data shifts.
// ---------------------------------------------------------------------------

const GROUND_TRUTH_MODIFIERS: Record<string, { precision: number; recall: number; volume: number; sarRate: number }> = {
  sar:          { precision: 1.00,  recall: 1.00,  volume: 1.00,  sarRate: 1.00 },
  case_level_1: { precision: 0.82,  recall: 1.14,  volume: 1.08,  sarRate: 0.88 },
  case_level_2: { precision: 0.91,  recall: 1.06,  volume: 1.03,  sarRate: 0.94 },
  case_level_3: { precision: 1.08,  recall: 0.88,  volume: 0.94,  sarRate: 1.06 },
}

const UNIT_MODIFIERS: Record<UnitOfAnalysis, { precision: number; recall: number; volume: number; sarRate: number }> = {
  alert:  { precision: 1.00,  recall: 1.00,  volume: 1.00,  sarRate: 1.00 },
  case:   { precision: 1.32,  recall: 0.91,  volume: 0.42,  sarRate: 1.28 },
  entity: { precision: 1.54,  recall: 0.84,  volume: 0.28,  sarRate: 1.48 },
}

// Label confidence modifiers: including inferred labels broadens the positive
// set, increasing recall at the cost of some precision noise.
const LABEL_CONFIDENCE_MODIFIERS: Record<LabelConfidence, { precisionAdj: number; recallAdj: number; formalRatio: number }> = {
  formal_only:     { precisionAdj:  0.00, recallAdj:  0.00, formalRatio: 1.0 },
  formal_inferred: { precisionAdj: -0.02, recallAdj:  0.08, formalRatio: 0.6 },
}

// ---------------------------------------------------------------------------
// Core adjustment function for a single PerformanceMetrics object
// ---------------------------------------------------------------------------

function adjustMetrics(
  base: PerformanceMetrics,
  gt: { precision: number; recall: number; volume: number; sarRate: number },
  unit: { precision: number; recall: number; volume: number; sarRate: number },
  labelAdj: { precision: number; recall: number },
): PerformanceMetrics {
  const precision = clamp(base.precision * gt.precision * unit.precision + labelAdj.precision, 0, 1)
  const recall = clamp(base.recall * gt.recall * unit.recall + labelAdj.recall, 0, 1)
  const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0
  const alertVolume = Math.round(base.alertVolume * gt.volume * unit.volume)
  const sarHitRate = clamp(base.sarHitRate * gt.sarRate * unit.sarRate + labelAdj.precision, 0, 1)
  const falsePositiveRate = clamp(1 - sarHitRate, 0, 1)

  return { precision, recall, f1, alertVolume, sarHitRate, falsePositiveRate }
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v))
}

// ---------------------------------------------------------------------------
// Public: compute a fully adjusted BacktestResult
// ---------------------------------------------------------------------------

export function computeAdjustedResult(
  base: BacktestResult,
  groundTruth: GroundTruth,
  unitOfAnalysis: UnitOfAnalysis,
  labelConfidence: LabelConfidence,
): BacktestResult {
  const gt = GROUND_TRUTH_MODIFIERS[groundTruth] ?? GROUND_TRUTH_MODIFIERS.sar
  const unit = UNIT_MODIFIERS[unitOfAnalysis]
  const lc = LABEL_CONFIDENCE_MODIFIERS[labelConfidence]
  const labelAdj = { precision: lc.precisionAdj, recall: lc.recallAdj }

  const absolute = adjustMetrics(base.absolute, gt, unit, labelAdj)

  // Marginal levels
  const marginal = {} as Record<TaxonomyLevel, PerformanceMetrics>
  const marginalBaseline = {} as Record<TaxonomyLevel, PerformanceMetrics>
  for (const level of ['l1', 'l2', 'l3', 'global'] as TaxonomyLevel[]) {
    marginal[level] = adjustMetrics(base.marginal[level], gt, unit, labelAdj)
    marginalBaseline[level] = adjustMetrics(base.marginalBaseline[level], gt, unit, labelAdj)
  }

  // ATL / BTL
  const atl = adjustSegment(base.atl, gt, unit)
  const btl = adjustSegment(base.btl, gt, unit)

  // Label composition – formal_only shows all as formal, formal_inferred shows the split
  const totalLabels = Math.round(base.labelComposition.total * gt.volume * unit.volume)
  const formalCount = Math.round(totalLabels * lc.formalRatio)
  const labelComposition = {
    formal: formalCount,
    inferred: totalLabels - formalCount,
    total: totalLabels,
  }

  // Volume over time — scale the volumes
  const volumeOverTime = {} as BacktestResult['volumeOverTime']
  for (const level of ['l1', 'l2', 'l3', 'global'] as TaxonomyLevel[]) {
    volumeOverTime[level] = base.volumeOverTime[level].map(entry => ({
      date: entry.date,
      alerts: Math.max(0, Math.round(entry.alerts * gt.volume * unit.volume)),
      sars: Math.max(0, Math.round(entry.sars * gt.sarRate * unit.sarRate)),
      inferred: Math.max(0, Math.round(entry.inferred * gt.volume)),
    }))
  }

  return {
    ...base,
    groundTruth,
    unitOfAnalysis,
    absolute,
    marginal,
    marginalBaseline,
    atl,
    btl,
    labelComposition,
    volumeOverTime,
  }
}

function adjustSegment(
  base: PopulationSegment,
  gt: { precision: number; recall: number; volume: number; sarRate: number },
  unit: { precision: number; recall: number; volume: number; sarRate: number },
): PopulationSegment {
  return {
    ...base,
    count: Math.round(base.count * gt.volume * unit.volume),
    sarRate: clamp(base.sarRate * gt.sarRate * unit.sarRate, 0, 1),
    inferredSarRate: clamp(base.inferredSarRate * gt.sarRate, 0, 1),
    medianTransactionValue: Math.round(base.medianTransactionValue * (0.85 + gt.precision * 0.15)),
    medianAlertScore: Math.round(base.medianAlertScore * (0.9 + unit.precision * 0.1) * 10) / 10,
    distributionBins: base.distributionBins.map(bin => ({
      bin: bin.bin,
      count: Math.round(bin.count * gt.volume * unit.volume),
      sarCount: Math.max(0, Math.round(bin.sarCount * gt.sarRate * unit.sarRate)),
    })),
  }
}

// ---------------------------------------------------------------------------
// Public: compute adjusted stratified data for PerformanceDataTable
// ---------------------------------------------------------------------------

export function computeAdjustedStratifiedData(
  groundTruth: GroundTruth,
  unitOfAnalysis: UnitOfAnalysis,
  labelConfidence: LabelConfidence,
): Record<string, { label: string; count: number; metrics: PerformanceMetrics }[]> {
  const gt = GROUND_TRUTH_MODIFIERS[groundTruth] ?? GROUND_TRUTH_MODIFIERS.sar
  const unit = UNIT_MODIFIERS[unitOfAnalysis]
  const lc = LABEL_CONFIDENCE_MODIFIERS[labelConfidence]
  const labelAdj = { precision: lc.precisionAdj, recall: lc.recallAdj }

  const result: Record<string, { label: string; count: number; metrics: PerformanceMetrics }[]> = {}

  for (const [dim, rows] of Object.entries(STRATIFIED_DATA)) {
    result[dim] = rows.map(row => ({
      label: row.label,
      count: Math.round(row.count * gt.volume * unit.volume),
      metrics: adjustMetrics(row.metrics, gt, unit, labelAdj),
    }))
  }

  return result
}
