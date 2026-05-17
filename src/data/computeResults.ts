import type { PerformanceMetrics, PerformanceMetricsCI, BacktestResult, PopulationSegment, GroundTruth, UnitOfAnalysis, LabelConfidence, TaxonomyLevel, ABMetrics, ASelection } from '../types'
import { STRATIFIED_DATA, RULE_VERSIONS, ALL_RULES } from './mockData'

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
// Bayesian credible intervals — width scales with inferred label proportion
// ---------------------------------------------------------------------------

/** Base half-widths for 90% credible interval (at 100% inferred). Scaled by inferred ratio. */
const BASE_CI_HALF_WIDTH: Record<keyof PerformanceMetricsCI, number> = {
  precision: 0.065,
  recall: 0.085,
  f1: 0.075,
  alertVolume: 0.12,       // as a fraction of the value
  sarHitRate: 0.070,
  falsePositiveRate: 0.070,
}

/** Slight asymmetry factor — posteriors skew slightly toward higher uncertainty */
const SKEW = 0.15

function computeCI(metrics: PerformanceMetrics, inferredRatio: number): PerformanceMetricsCI {
  const ci = {} as PerformanceMetricsCI
  const keys: (keyof PerformanceMetricsCI)[] = ['precision', 'recall', 'f1', 'alertVolume', 'sarHitRate', 'falsePositiveRate']

  for (const key of keys) {
    const val = metrics[key]
    const baseHalf = BASE_CI_HALF_WIDTH[key]
    // CI width scales with sqrt of inferred ratio (Bayesian posterior narrowing)
    const halfWidth = baseHalf * Math.sqrt(inferredRatio)

    if (key === 'alertVolume') {
      // For volume, CI is relative to the value
      const low = Math.max(0, Math.round(val * (1 - halfWidth * (1 - SKEW))))
      const high = Math.round(val * (1 + halfWidth * (1 + SKEW)))
      ci[key] = [low, high]
    } else {
      // For rates, CI is absolute
      const low = clamp(val - halfWidth * (1 - SKEW), 0, 1)
      const high = clamp(val + halfWidth * (1 + SKEW), 0, 1)
      ci[key] = [low, high]
    }
  }

  return ci
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

  // Attach credible intervals when inferred labels are included
  const inferredRatio = labelConfidence === 'formal_inferred' ? (1 - lc.formalRatio) : 0
  if (inferredRatio > 0) {
    absolute.ci = computeCI(absolute, inferredRatio)
  }

  // Marginal levels
  const marginal = {} as Record<TaxonomyLevel, PerformanceMetrics>
  const marginalBaseline = {} as Record<TaxonomyLevel, PerformanceMetrics>
  for (const level of ['l1', 'l2', 'l3', 'global'] as TaxonomyLevel[]) {
    marginal[level] = adjustMetrics(base.marginal[level], gt, unit, labelAdj)
    marginalBaseline[level] = adjustMetrics(base.marginalBaseline[level], gt, unit, labelAdj)
    if (inferredRatio > 0) {
      marginal[level].ci = computeCI(marginal[level], inferredRatio)
    }
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

// ---------------------------------------------------------------------------
// Public: derive A / B / Δ from a backtest at a given taxonomy scope
//   A = portfolio at that scope WITHOUT this rule (baseline)
//   B = portfolio at that scope WITH this rule added
//   Δ = B − A (per metric)
// ---------------------------------------------------------------------------

/** Combine baseline + this-rule metrics into a notional "with rule" portfolio metric set. */
function combineWithRule(a: PerformanceMetrics, contribution: PerformanceMetrics): PerformanceMetrics {
  const aVol = a.alertVolume
  const cVol = contribution.alertVolume
  const totalVol = aVol + cVol

  // Volume is additive
  const alertVolume = totalVol

  // Precision and SAR hit rate combine as alert-weighted averages
  const precision = totalVol > 0
    ? clamp((a.precision * aVol + contribution.precision * cVol) / totalVol, 0, 1)
    : a.precision
  const sarHitRate = totalVol > 0
    ? clamp((a.sarHitRate * aVol + contribution.sarHitRate * cVol) / totalVol, 0, 1)
    : a.sarHitRate

  // Recall composes as independent union: 1 − (1−r_a)(1−r_c)
  const recall = clamp(1 - (1 - a.recall) * (1 - contribution.recall), 0, 1)

  // F1 from the combined precision + recall
  const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0

  // FPR is the complement of hit rate
  const falsePositiveRate = clamp(1 - sarHitRate, 0, 1)

  return { precision, recall, f1, alertVolume, sarHitRate, falsePositiveRate }
}

function subtractMetrics(b: PerformanceMetrics, a: PerformanceMetrics): PerformanceMetrics {
  return {
    precision: b.precision - a.precision,
    recall: b.recall - a.recall,
    f1: b.f1 - a.f1,
    alertVolume: b.alertVolume - a.alertVolume,
    sarHitRate: b.sarHitRate - a.sarHitRate,
    falsePositiveRate: b.falsePositiveRate - a.falsePositiveRate,
  }
}

const EMPTY_METRICS: PerformanceMetrics = {
  precision: 0, recall: 0, f1: 0, alertVolume: 0, sarHitRate: 0, falsePositiveRate: 0,
}

export function getAB(result: BacktestResult, selection: ASelection): ABMetrics {
  if (selection.kind === 'portfolio_minus') {
    const a = result.marginalBaseline[selection.level]
    const contribution = result.marginal[selection.level]
    const b = combineWithRule(a, contribution)
    if (a.ci || contribution.ci) {
      b.ci = computeCI(b, 0.4)
    }
    return { a, b, delta: subtractMetrics(b, a) }
  }

  // Non-portfolio modes: A and B are rule-in-isolation snapshots, no peer combination.
  // B is always this rule's current standalone metrics (= result.absolute).
  const b: PerformanceMetrics = { ...result.absolute }

  let a: PerformanceMetrics
  if (selection.kind === 'empty') {
    a = EMPTY_METRICS
  } else if (selection.kind === 'prior_version') {
    const v = RULE_VERSIONS.find(rv => rv.id === selection.version)
    a = v ? v.metrics : EMPTY_METRICS
  } else {
    // specific_rule — fabricate from rule index; if no real backtest, use a scaled variant of `absolute`
    const idx = ALL_RULES.findIndex(r => r.id === selection.ruleId)
    const factor = 0.7 + ((idx >= 0 ? idx : 0) % 7) * 0.06  // deterministic 0.7..1.06 spread
    a = {
      precision: clamp(result.absolute.precision * factor, 0, 1),
      recall: clamp(result.absolute.recall * (2 - factor), 0, 1),
      f1: clamp(result.absolute.f1 * factor * (2 - factor) / Math.max(factor + (2 - factor), 0.001) * 2, 0, 1),
      alertVolume: Math.round(result.absolute.alertVolume * factor),
      sarHitRate: clamp(result.absolute.sarHitRate * factor, 0, 1),
      falsePositiveRate: clamp(1 - result.absolute.sarHitRate * factor, 0, 1),
    }
  }

  return { a, b, delta: subtractMetrics(b, a) }
}

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
