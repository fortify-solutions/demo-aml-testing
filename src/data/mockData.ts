import type { Rule, BacktestResult, Recommendation, AlertRecord, TransactionRecord, ThresholdComparison, TaxonomyLevel } from '../types'

export const RULES: Rule[] = [
  {
    id: 'rule-001',
    name: 'High Velocity Cash Deposits',
    description: 'Flags entities with unusually high frequency of cash deposits within a rolling window',
    taxonomy: { l1: 'Structuring', l2: 'Cash Intensive', l3: 'Deposit Velocity' },
    parameters: [
      { id: 'p1', name: 'velocity_threshold', type: 'threshold', currentValue: 10, unit: 'txns/window', description: 'Minimum transaction count to trigger alert' },
      { id: 'p2', name: 'amount_floor', type: 'threshold', currentValue: 3000, unit: 'USD', description: 'Minimum individual transaction amount' },
      { id: 'p3', name: 'aggregation_method', type: 'structural', currentValue: 'sum', description: 'How transaction amounts are aggregated within the window' },
    ],
    lookbackWindowHours: 72,
    batchCadenceHours: 24,
  },
  {
    id: 'rule-002',
    name: 'Rapid Cross-Border Transfers',
    description: 'Detects entities sending multiple international wire transfers to distinct beneficiaries',
    taxonomy: { l1: 'Structuring', l2: 'One-to-many', l3: 'Overall velocity' },
    parameters: [
      { id: 'p4', name: 'distinct_beneficiaries', type: 'threshold', currentValue: 5, unit: 'entities', description: 'Minimum unique recipients' },
      { id: 'p5', name: 'time_window', type: 'threshold', currentValue: 168, unit: 'hours', description: 'Rolling window for evaluation' },
    ],
    lookbackWindowHours: 168,
    batchCadenceHours: 12,
  },
  {
    id: 'rule-003',
    name: 'Dormant Account Reactivation',
    description: 'Identifies accounts with extended inactivity followed by sudden high-value transactions',
    taxonomy: { l1: 'Unusual Activity', l2: 'Account Behaviour', l3: 'Dormancy Pattern' },
    parameters: [
      { id: 'p6', name: 'dormancy_period', type: 'threshold', currentValue: 180, unit: 'days', description: 'Minimum inactivity period' },
      { id: 'p7', name: 'reactivation_amount', type: 'threshold', currentValue: 25000, unit: 'USD', description: 'Minimum reactivation transaction value' },
    ],
    lookbackWindowHours: 4320,
    batchCadenceHours: 24,
  },
  {
    id: 'rule-004',
    name: 'Remittance Fan-Out Detection',
    description: 'Recipient-side velocity rule detecting fan-out patterns in remittance corridors',
    taxonomy: { l1: 'Structuring', l2: 'One-to-many', l3: 'Remittance Fan-Out' },
    parameters: [
      { id: 'p8', name: 'sender_count', type: 'threshold', currentValue: 8, unit: 'senders', description: 'Minimum unique senders to recipient' },
      { id: 'p9', name: 'corridor_filter', type: 'structural', currentValue: 'all', description: 'Which remittance corridors to include' },
    ],
    lookbackWindowHours: 336,
    batchCadenceHours: 24,
  },
  {
    id: 'rule-005',
    name: 'Sub-CTR Structuring',
    description: 'Detects multiple cash deposits structured just below the $10,000 CTR reporting threshold',
    taxonomy: { l1: 'Structuring', l2: 'Reporting Avoidance', l3: 'Sub-CTR Structuring' },
    parameters: [
      { id: 'p10', name: 'reporting_threshold', type: 'threshold', currentValue: 10000, unit: 'USD', description: 'CTR reporting threshold' },
      { id: 'p11', name: 'near_threshold_pct', type: 'threshold', currentValue: 0.80, unit: '%', description: 'Percentage of reporting threshold to flag as "near"' },
      { id: 'p12', name: 'count_trigger', type: 'threshold', currentValue: 5, unit: 'txns', description: 'Number of near-threshold deposits to trigger alert' },
    ],
    lookbackWindowHours: 168,
    batchCadenceHours: 24,
  },
  {
    id: 'rule-006',
    name: 'Rapid Fund Movement',
    description: 'Identifies layering patterns where funds flow in then rapidly flow out within a short window',
    taxonomy: { l1: 'Layering', l2: 'Fund Movement', l3: 'Rapid In-Out' },
    parameters: [
      { id: 'p13', name: 'outflow_ratio_threshold', type: 'threshold', currentValue: 0.85, unit: 'ratio', description: 'Minimum outflow/inflow ratio to trigger' },
      { id: 'p14', name: 'min_inflow', type: 'threshold', currentValue: 25000, unit: 'USD', description: 'Minimum cumulative inflow before evaluating ratio' },
    ],
    lookbackWindowHours: 48,
    batchCadenceHours: 12,
  },
  {
    id: 'rule-007',
    name: 'Escalating Transaction Amounts',
    description: 'Flags accounts where transaction amounts show a sustained upward trend suggesting graduated laundering',
    taxonomy: { l1: 'Unusual Activity', l2: 'Amount Patterns', l3: 'Escalating Amounts' },
    parameters: [
      { id: 'p15', name: 'growth_rate_threshold', type: 'threshold', currentValue: 1.5, unit: '×', description: 'Minimum rolling average growth factor' },
      { id: 'p16', name: 'min_transactions', type: 'threshold', currentValue: 6, unit: 'txns', description: 'Minimum qualifying transactions before evaluating growth' },
      { id: 'p17', name: 'base_amount', type: 'threshold', currentValue: 2000, unit: 'USD', description: 'Minimum transaction amount to qualify' },
    ],
    lookbackWindowHours: 720,
    batchCadenceHours: 24,
  },
]

/** Lightweight rule stubs — no parameters or backtest data, just names for the dropdown */
const DUMMY_RULES: Rule[] = [
  // Structuring
  { id: 'dummy-001', name: 'Round Dollar Deposits', description: '', taxonomy: { l1: 'Structuring', l2: 'Cash Intensive', l3: 'Round Amounts' }, parameters: [], lookbackWindowHours: 72, batchCadenceHours: 24 },
  { id: 'dummy-002', name: 'Split Wire Transfers', description: '', taxonomy: { l1: 'Structuring', l2: 'One-to-many', l3: 'Wire Splitting' }, parameters: [], lookbackWindowHours: 168, batchCadenceHours: 24 },
  { id: 'dummy-003', name: 'Recurring Sub-Threshold ACH', description: '', taxonomy: { l1: 'Structuring', l2: 'Reporting Avoidance', l3: 'ACH Structuring' }, parameters: [], lookbackWindowHours: 336, batchCadenceHours: 24 },
  { id: 'dummy-004', name: 'Sequential Teller Transactions', description: '', taxonomy: { l1: 'Structuring', l2: 'Cash Intensive', l3: 'Teller Sequencing' }, parameters: [], lookbackWindowHours: 24, batchCadenceHours: 12 },
  { id: 'dummy-005', name: 'Multi-Branch Cash Deposits', description: '', taxonomy: { l1: 'Structuring', l2: 'Cash Intensive', l3: 'Branch Hopping' }, parameters: [], lookbackWindowHours: 48, batchCadenceHours: 24 },
  // Unusual Activity
  { id: 'dummy-006', name: 'Sudden High-Value Outbound', description: '', taxonomy: { l1: 'Unusual Activity', l2: 'Amount Patterns', l3: 'Spike Detection' }, parameters: [], lookbackWindowHours: 168, batchCadenceHours: 12 },
  { id: 'dummy-007', name: 'Geographic Anomaly Detection', description: '', taxonomy: { l1: 'Unusual Activity', l2: 'Account Behaviour', l3: 'Geo Anomaly' }, parameters: [], lookbackWindowHours: 720, batchCadenceHours: 24 },
  { id: 'dummy-008', name: 'After-Hours Transaction Spike', description: '', taxonomy: { l1: 'Unusual Activity', l2: 'Account Behaviour', l3: 'Temporal Anomaly' }, parameters: [], lookbackWindowHours: 168, batchCadenceHours: 24 },
  { id: 'dummy-009', name: 'New Payee Velocity', description: '', taxonomy: { l1: 'Unusual Activity', l2: 'Account Behaviour', l3: 'Payee Velocity' }, parameters: [], lookbackWindowHours: 336, batchCadenceHours: 24 },
  { id: 'dummy-010', name: 'Unusual Merchant Category Spend', description: '', taxonomy: { l1: 'Unusual Activity', l2: 'Amount Patterns', l3: 'MCC Anomaly' }, parameters: [], lookbackWindowHours: 720, batchCadenceHours: 24 },
  // Layering
  { id: 'dummy-011', name: 'Pass-Through Account Detection', description: '', taxonomy: { l1: 'Layering', l2: 'Fund Movement', l3: 'Pass-Through' }, parameters: [], lookbackWindowHours: 168, batchCadenceHours: 12 },
  { id: 'dummy-012', name: 'Circular Fund Flow', description: '', taxonomy: { l1: 'Layering', l2: 'Fund Movement', l3: 'Circular Flow' }, parameters: [], lookbackWindowHours: 336, batchCadenceHours: 24 },
  { id: 'dummy-013', name: 'Shell Company Intermediary', description: '', taxonomy: { l1: 'Layering', l2: 'Entity Patterns', l3: 'Shell Detection' }, parameters: [], lookbackWindowHours: 720, batchCadenceHours: 24 },
  { id: 'dummy-014', name: 'Rapid Account-to-Account Hops', description: '', taxonomy: { l1: 'Layering', l2: 'Fund Movement', l3: 'Account Hopping' }, parameters: [], lookbackWindowHours: 48, batchCadenceHours: 12 },
  { id: 'dummy-015', name: 'Multi-Jurisdiction Layering', description: '', taxonomy: { l1: 'Layering', l2: 'Fund Movement', l3: 'Cross-Border Layering' }, parameters: [], lookbackWindowHours: 336, batchCadenceHours: 24 },
  // Trade-Based ML
  { id: 'dummy-016', name: 'Over/Under Invoicing', description: '', taxonomy: { l1: 'Trade-Based ML', l2: 'Invoice Manipulation', l3: 'Price Mismatch' }, parameters: [], lookbackWindowHours: 720, batchCadenceHours: 24 },
  { id: 'dummy-017', name: 'Phantom Shipment Detection', description: '', taxonomy: { l1: 'Trade-Based ML', l2: 'Shipment Anomaly', l3: 'Missing Goods' }, parameters: [], lookbackWindowHours: 720, batchCadenceHours: 24 },
  { id: 'dummy-018', name: 'Trade Value Anomaly', description: '', taxonomy: { l1: 'Trade-Based ML', l2: 'Invoice Manipulation', l3: 'Value Outlier' }, parameters: [], lookbackWindowHours: 336, batchCadenceHours: 24 },
  { id: 'dummy-019', name: 'Mismatched Trade Partners', description: '', taxonomy: { l1: 'Trade-Based ML', l2: 'Entity Patterns', l3: 'Partner Mismatch' }, parameters: [], lookbackWindowHours: 720, batchCadenceHours: 24 },
  // Fraud Overlap
  { id: 'dummy-020', name: 'Account Takeover Indicators', description: '', taxonomy: { l1: 'Fraud Overlap', l2: 'Access Patterns', l3: 'ATO Detection' }, parameters: [], lookbackWindowHours: 168, batchCadenceHours: 12 },
  { id: 'dummy-021', name: 'Synthetic Identity Patterns', description: '', taxonomy: { l1: 'Fraud Overlap', l2: 'Identity', l3: 'Synthetic ID' }, parameters: [], lookbackWindowHours: 720, batchCadenceHours: 24 },
  { id: 'dummy-022', name: 'Mule Account Network', description: '', taxonomy: { l1: 'Fraud Overlap', l2: 'Network Analysis', l3: 'Mule Detection' }, parameters: [], lookbackWindowHours: 336, batchCadenceHours: 24 },
]

/** All rules: real + dummy, for the dropdown */
export const ALL_RULES: Rule[] = [...RULES, ...DUMMY_RULES]

/** IDs of rules that have full backtest data */
export const RULES_WITH_DATA = new Set(RULES.map(r => r.id))

function generateMarginalVolumeData(): BacktestResult['volumeOverTime'] {
  // Scale factors approximate marginal.alertVolume / absolute.alertVolume per level
  const scales: Record<string, number> = { l1: 0.25, l2: 0.44, l3: 0.62, global: 0.17 }
  const result: Record<string, { date: string; alerts: number; sars: number; inferred: number }[]> = {}

  // Use a seeded-ish approach: generate base series then scale
  const baseSeries: number[] = []
  for (let i = 0; i < 90; i++) {
    baseSeries.push(40 + Math.floor(Math.random() * 25))
  }

  for (const [level, scale] of Object.entries(scales)) {
    const data: { date: string; alerts: number; sars: number; inferred: number }[] = []
    const startDate = new Date('2025-07-01')
    for (let i = 0; i < 90; i++) {
      const d = new Date(startDate)
      d.setDate(d.getDate() + i)
      const base = Math.max(1, Math.floor(baseSeries[i] * scale + (Math.random() - 0.5) * 8))
      data.push({
        date: d.toISOString().slice(0, 10),
        alerts: base + Math.floor(Math.random() * 6 * scale),
        sars: Math.max(0, Math.floor(base * 0.12 + Math.random() * 3 * scale)),
        inferred: Math.max(0, Math.floor(base * 0.08 + Math.random() * 2 * scale)),
      })
    }
    result[level] = data
  }

  return result as BacktestResult['volumeOverTime']
}

function generateBins(label: 'above' | 'below'): { bin: string; count: number; sarCount: number }[] {
  const bins = label === 'above'
    ? ['0-5k', '5-10k', '10-25k', '25-50k', '50-100k', '100k+']
    : ['0-1k', '1-3k', '3-5k', '5-10k', '10-25k', '25k+']
  return bins.map(bin => ({
    bin,
    count: Math.floor(50 + Math.random() * 200),
    sarCount: label === 'above'
      ? Math.floor(5 + Math.random() * 30)
      : Math.floor(Math.random() * 4),
  }))
}

export const BACKTEST_RESULT: BacktestResult = {
  ruleId: 'rule-001',
  dateRange: { from: '2025-07-01', to: '2025-09-28' },
  unitOfAnalysis: 'alert',
  labelMode: 'formal_inferred',
  groundTruth: 'sar',
  suppressionApplied: false,
  executionFidelity: 'simplified',

  absolute: {
    precision: 0.142,
    recall: 0.683,
    f1: 0.235,
    alertVolume: 4823,
    sarHitRate: 0.142,
    falsePositiveRate: 0.858,
  },

  marginal: {
    l1: {
      precision: 0.031,
      recall: 0.127,
      f1: 0.050,
      alertVolume: 1204,
      sarHitRate: 0.031,
      falsePositiveRate: 0.969,
    },
    l2: {
      precision: 0.058,
      recall: 0.241,
      f1: 0.094,
      alertVolume: 2107,
      sarHitRate: 0.058,
      falsePositiveRate: 0.942,
    },
    l3: {
      precision: 0.092,
      recall: 0.384,
      f1: 0.148,
      alertVolume: 3012,
      sarHitRate: 0.092,
      falsePositiveRate: 0.908,
    },
    global: {
      precision: 0.018,
      recall: 0.064,
      f1: 0.028,
      alertVolume: 812,
      sarHitRate: 0.018,
      falsePositiveRate: 0.982,
    },
  },

  marginalBaseline: {
    l1: {
      precision: 0.111,
      recall: 0.556,
      f1: 0.185,
      alertVolume: 3619,
      sarHitRate: 0.111,
      falsePositiveRate: 0.889,
    },
    l2: {
      precision: 0.084,
      recall: 0.442,
      f1: 0.141,
      alertVolume: 2716,
      sarHitRate: 0.084,
      falsePositiveRate: 0.916,
    },
    l3: {
      precision: 0.050,
      recall: 0.299,
      f1: 0.086,
      alertVolume: 1811,
      sarHitRate: 0.050,
      falsePositiveRate: 0.950,
    },
    global: {
      precision: 0.124,
      recall: 0.619,
      f1: 0.207,
      alertVolume: 4011,
      sarHitRate: 0.124,
      falsePositiveRate: 0.876,
    },
  },

  atl: {
    label: 'above',
    count: 4823,
    sarRate: 0.142,
    inferredSarRate: 0.089,
    medianTransactionValue: 18420,
    medianAlertScore: 72.4,
    distributionBins: generateBins('above'),
  },

  btl: {
    label: 'below',
    count: 31204,
    sarRate: 0.003,
    inferredSarRate: 0.021,
    medianTransactionValue: 4210,
    medianAlertScore: 18.7,
    distributionBins: generateBins('below'),
  },

  labelComposition: {
    formal: 684,
    inferred: 412,
    total: 1096,
  },

  volumeOverTime: generateMarginalVolumeData(),
}

// Alternate metrics for formal-only mode (slightly different values)
export const BACKTEST_RESULT_FORMAL: BacktestResult = {
  ...BACKTEST_RESULT,
  labelMode: 'formal',
  marginalBaseline: {
    l1: {
      precision: 0.101,
      recall: 0.512,
      f1: 0.169,
      alertVolume: 3619,
      sarHitRate: 0.101,
      falsePositiveRate: 0.899,
    },
    l2: {
      precision: 0.077,
      recall: 0.409,
      f1: 0.130,
      alertVolume: 2716,
      sarHitRate: 0.077,
      falsePositiveRate: 0.923,
    },
    l3: {
      precision: 0.045,
      recall: 0.273,
      f1: 0.077,
      alertVolume: 1811,
      sarHitRate: 0.045,
      falsePositiveRate: 0.955,
    },
    global: {
      precision: 0.113,
      recall: 0.567,
      f1: 0.188,
      alertVolume: 4011,
      sarHitRate: 0.113,
      falsePositiveRate: 0.887,
    },
  },
  absolute: {
    precision: 0.128,
    recall: 0.621,
    f1: 0.212,
    alertVolume: 4823,
    sarHitRate: 0.128,
    falsePositiveRate: 0.872,
  },
  marginal: {
    l1: {
      precision: 0.027,
      recall: 0.109,
      f1: 0.043,
      alertVolume: 1204,
      sarHitRate: 0.027,
      falsePositiveRate: 0.973,
    },
    l2: {
      precision: 0.051,
      recall: 0.212,
      f1: 0.082,
      alertVolume: 2107,
      sarHitRate: 0.051,
      falsePositiveRate: 0.949,
    },
    l3: {
      precision: 0.083,
      recall: 0.348,
      f1: 0.134,
      alertVolume: 3012,
      sarHitRate: 0.083,
      falsePositiveRate: 0.917,
    },
    global: {
      precision: 0.015,
      recall: 0.054,
      f1: 0.024,
      alertVolume: 812,
      sarHitRate: 0.015,
      falsePositiveRate: 0.985,
    },
  },
  atl: {
    ...BACKTEST_RESULT.atl,
    sarRate: 0.128,
    inferredSarRate: 0,
  },
  btl: {
    ...BACKTEST_RESULT.btl,
    sarRate: 0.0,
    inferredSarRate: 0,
  },
}

export const RECOMMENDATIONS: Recommendation[] = [
  {
    id: 'rec-001',
    targetParameterId: 'p1',
    type: 'threshold',
    title: 'Reduce velocity threshold from 10 to 7',
    rationale: 'Analysis of the ATL/BTL distribution shows a significant cluster of SAR-positive entities in the 7-10 transaction range that are currently falling below the threshold. Reducing to 7 would capture 23% more true positives with a manageable increase in alert volume.',
    proposedChange: 'Reduce velocity_threshold from 10 to 7 transactions per 72h window',
    projectedMetrics: {
      precision: 0.118,
      recall: 0.841,
      f1: 0.207,
      alertVolume: 6934,
      sarHitRate: 0.118,
      falsePositiveRate: 0.882,
    },
    currentMetrics: {
      precision: 0.142,
      recall: 0.683,
      f1: 0.235,
      alertVolume: 4823,
      sarHitRate: 0.142,
      falsePositiveRate: 0.858,
    },
    evidenceSummary: 'Backtest over the 90-day window shows that 158 SAR-positive entities had velocity counts between 7 and 10. Of these, 142 had been flagged by peer rules in the Structuring taxonomy, but 16 were uniquely identifiable only by this rule at the lower threshold. The projected precision drop of 2.4pp is offset by the 15.8pp recall gain. The F1 trade-off is slightly negative (-2.8pp) but the marginal recall at L1 taxonomy improves by 8.2pp, suggesting strong complementary value within the Structuring rule set.',
    confidence: 'high',
  },
  {
    id: 'rec-002',
    targetParameterId: 'p2',
    type: 'threshold',
    title: 'Raise amount floor from $3,000 to $5,000',
    rationale: 'The sub-$5,000 transaction segment contributes disproportionately to false positives. Entities with cash deposits below $5,000 have a SAR rate of only 0.02%, compared to 0.18% above $5,000. Raising the floor would eliminate ~30% of alerts while losing only ~4% of true positives.',
    proposedChange: 'Raise amount_floor from $3,000 to $5,000 USD',
    projectedMetrics: {
      precision: 0.198,
      recall: 0.654,
      f1: 0.304,
      alertVolume: 3372,
      sarHitRate: 0.198,
      falsePositiveRate: 0.802,
    },
    currentMetrics: {
      precision: 0.142,
      recall: 0.683,
      f1: 0.235,
      alertVolume: 4823,
      sarHitRate: 0.142,
      falsePositiveRate: 0.858,
    },
    evidenceSummary: 'Stratified analysis of alert population by transaction value band reveals that the $3,000-$5,000 band contains 1,451 alerts (30.1% of total volume) but only 28 SAR-positive entities (4.1% of true positives). The SAR rate in this band is 0.019% vs. 0.182% in the $5,000+ band. Raising the floor concentrates investigator effort on the higher-signal population. Note: this change may interact with structuring detection — entities deliberately staying below $5,000 may evade detection. Consider pairing with a structuring-specific sub-$5,000 rule.',
    confidence: 'medium',
  },
  {
    id: 'rec-003',
    targetParameterId: null,
    type: 'structural',
    title: 'Add counterparty diversity scoring',
    rationale: 'Entity-level analysis shows that SAR-positive entities flagged by this rule have significantly more diverse counterparty networks (median 12 unique counterparties) compared to false positives (median 3). Adding a counterparty diversity dimension would improve discrimination without changing the velocity threshold.',
    proposedChange: 'Add structural filter: require counterparty_diversity_score > 0.6 as a secondary condition',
    projectedMetrics: {
      precision: 0.221,
      recall: 0.647,
      f1: 0.330,
      alertVolume: 2987,
      sarHitRate: 0.221,
      falsePositiveRate: 0.779,
    },
    currentMetrics: {
      precision: 0.142,
      recall: 0.683,
      f1: 0.235,
      alertVolume: 4823,
      sarHitRate: 0.142,
      falsePositiveRate: 0.858,
    },
    evidenceSummary: 'Counterparty analysis across the ATL population shows a bimodal distribution of unique counterparties. SAR-positive entities cluster around 8-15 unique counterparties with high geographic dispersion, while false positive entities predominantly transact with 1-4 counterparties in concentrated geographies (typically payroll or business-to-business patterns). A diversity score combining counterparty count, geographic spread, and relationship recency achieves 0.74 AUC as a standalone discriminator. When used as a secondary filter on top of the velocity rule, it reduces false positives by 38% while retaining 94.7% of true positives.',
    confidence: 'medium',
  },
]

export const RECOMMENDATIONS_BY_RULE: Record<string, Recommendation[]> = {
  'rule-001': RECOMMENDATIONS,
  'rule-005': [
    {
      id: 'rec-s1',
      targetParameterId: 'p11',
      type: 'threshold',
      title: 'Tighten near-threshold band from 80% to 85%',
      rationale: 'The 80-85% band ($8,000-$8,500) contains a high proportion of legitimate business deposits, contributing 40% of false positives but only 8% of true positives. Narrowing the near-threshold band to 85%+ focuses detection on the most suspicious structuring pattern.',
      proposedChange: 'Raise near_threshold_pct from 0.80 to 0.85 (flag deposits ≥$8,500)',
      projectedMetrics: { precision: 0.195, recall: 0.712, f1: 0.306, alertVolume: 3680, sarHitRate: 0.195, falsePositiveRate: 0.805 },
      currentMetrics: { precision: 0.142, recall: 0.763, f1: 0.235, alertVolume: 4823, sarHitRate: 0.142, falsePositiveRate: 0.858 },
      evidenceSummary: 'Analysis of 4,823 alerts shows that deposits in the $8,000-$8,500 range have a SAR rate of 0.9%, compared to 4.2% for deposits in the $8,500-$9,999 range. The lower band accounts for 1,143 alerts (23.7%) but only 10 SARs. Removing this band reduces alert volume by 24% while losing only 5.1pp of recall.',
      confidence: 'high',
    },
    {
      id: 'rec-s2',
      targetParameterId: 'p12',
      type: 'threshold',
      title: 'Lower count trigger from 5 to 3 deposits',
      rationale: 'Sophisticated structurers are using fewer but more precisely-calibrated deposits. Entities with 3-4 near-threshold deposits have a higher SAR rate (6.1%) than those with 5+ (3.8%), likely because experienced structurers diversify across more institutions.',
      proposedChange: 'Reduce count_trigger from 5 to 3 near-threshold deposits',
      projectedMetrics: { precision: 0.108, recall: 0.891, f1: 0.193, alertVolume: 7240, sarHitRate: 0.108, falsePositiveRate: 0.892 },
      currentMetrics: { precision: 0.142, recall: 0.763, f1: 0.235, alertVolume: 4823, sarHitRate: 0.142, falsePositiveRate: 0.858 },
      evidenceSummary: 'Backtest analysis identified 412 SAR-positive entities with exactly 3-4 near-threshold deposits in the lookback window that were missed by the current count of 5. These entities show strong structuring indicators: 89% had deposits at 3+ different branches, and 67% had amounts within $200 of each other, suggesting deliberate calibration.',
      confidence: 'medium',
    },
  ],
  'rule-006': [
    {
      id: 'rec-r1',
      targetParameterId: 'p13',
      type: 'threshold',
      title: 'Lower outflow ratio threshold from 85% to 75%',
      rationale: 'Layering actors increasingly retain a small portion of funds to appear legitimate. Entities with 75-85% outflow ratios have a SAR rate of 5.3%, nearly as high as the 85%+ group (6.1%). Lowering the threshold captures these more sophisticated layering patterns.',
      proposedChange: 'Reduce outflow_ratio_threshold from 0.85 to 0.75',
      projectedMetrics: { precision: 0.131, recall: 0.856, f1: 0.227, alertVolume: 5890, sarHitRate: 0.131, falsePositiveRate: 0.869 },
      currentMetrics: { precision: 0.142, recall: 0.763, f1: 0.235, alertVolume: 4823, sarHitRate: 0.142, falsePositiveRate: 0.858 },
      evidenceSummary: 'Analysis of fund movement patterns shows that SAR-positive entities in the 75-85% outflow ratio band typically retain 15-25% of inflows in interest-bearing accounts before moving funds onward in a second wave. The current 85% threshold misses this two-stage layering pattern. Lowering to 75% captures an additional 9.3pp of recall at a cost of 1.1pp precision.',
      confidence: 'high',
    },
    {
      id: 'rec-r2',
      targetParameterId: null,
      type: 'structural',
      title: 'Add velocity-of-outflow timing filter',
      rationale: 'Legitimate businesses show gradual outflows over days. Layering entities move 80%+ of outflows within 6 hours of inflow. Adding a timing dimension would dramatically improve precision without affecting recall.',
      proposedChange: 'Add structural filter: require ≥60% of outflows within 12h of corresponding inflow',
      projectedMetrics: { precision: 0.234, recall: 0.741, f1: 0.356, alertVolume: 2870, sarHitRate: 0.234, falsePositiveRate: 0.766 },
      currentMetrics: { precision: 0.142, recall: 0.763, f1: 0.235, alertVolume: 4823, sarHitRate: 0.142, falsePositiveRate: 0.858 },
      evidenceSummary: 'Timing analysis of inflow-to-outflow gaps reveals a clear bimodal distribution. SAR-positive entities have a median gap of 4.2 hours between inflow and corresponding outflow, compared to 72+ hours for false positives. Using a 12-hour timing filter retains 96.8% of true positives while eliminating 40.5% of false positives.',
      confidence: 'medium',
    },
  ],
  'rule-007': [
    {
      id: 'rec-e1',
      targetParameterId: 'p15',
      type: 'threshold',
      title: 'Raise growth threshold from 1.5× to 2.0×',
      rationale: 'Normal business growth generates 1.5-1.8× increases seasonally. The 1.5-2.0× growth band has a SAR rate of only 1.2% vs 8.4% for the 2.0×+ band. Raising the threshold would cut false positives by 45% while losing only 12% of true positives.',
      proposedChange: 'Raise growth_rate_threshold from 1.5 to 2.0',
      projectedMetrics: { precision: 0.248, recall: 0.671, f1: 0.362, alertVolume: 2650, sarHitRate: 0.248, falsePositiveRate: 0.752 },
      currentMetrics: { precision: 0.142, recall: 0.763, f1: 0.235, alertVolume: 4823, sarHitRate: 0.142, falsePositiveRate: 0.858 },
      evidenceSummary: 'Seasonal analysis shows that legitimate businesses routinely exhibit 1.5-1.8× growth during peak periods (Q4, fiscal year-end). The 1.5-2.0× band contains 2,173 alerts but only 26 SARs (1.2% hit rate). The 2.0×+ band contains 2,650 alerts with 657 SARs (24.8% hit rate). Raising the threshold dramatically improves the signal-to-noise ratio.',
      confidence: 'high',
    },
    {
      id: 'rec-e2',
      targetParameterId: 'p16',
      type: 'threshold',
      title: 'Increase minimum transactions from 6 to 8',
      rationale: 'Entities with 6-7 qualifying transactions often represent normal business ramp-up. Requiring 8+ transactions filters out short-lived patterns while retaining entities showing sustained escalation — a stronger money laundering signal.',
      proposedChange: 'Raise min_transactions from 6 to 8',
      projectedMetrics: { precision: 0.178, recall: 0.698, f1: 0.284, alertVolume: 3940, sarHitRate: 0.178, falsePositiveRate: 0.822 },
      currentMetrics: { precision: 0.142, recall: 0.763, f1: 0.235, alertVolume: 4823, sarHitRate: 0.142, falsePositiveRate: 0.858 },
      evidenceSummary: 'Duration analysis shows that SAR-positive escalating entities sustain the pattern over 8+ transactions (median 11), while false positives typically show escalation over only 6-7 transactions before plateauing. Requiring 8 transactions reduces the alert pool by 18% while the SAR retention rate remains at 91.5%.',
      confidence: 'medium',
    },
    {
      id: 'rec-e3',
      targetParameterId: null,
      type: 'structural',
      title: 'Add counterparty rotation detection',
      rationale: 'Escalating laundering entities frequently change counterparties as amounts grow to avoid detection at any single institution. Adding counterparty rotation as a secondary signal would improve precision by 6pp.',
      proposedChange: 'Add structural filter: require ≥3 distinct counterparties in the escalation window',
      projectedMetrics: { precision: 0.203, recall: 0.738, f1: 0.319, alertVolume: 3510, sarHitRate: 0.203, falsePositiveRate: 0.797 },
      currentMetrics: { precision: 0.142, recall: 0.763, f1: 0.235, alertVolume: 4823, sarHitRate: 0.142, falsePositiveRate: 0.858 },
      evidenceSummary: 'Counterparty analysis across escalating-amount alerts shows SAR-positive entities use a median of 5 distinct counterparties during the escalation window, compared to 1.8 for false positives. Adding a minimum of 3 counterparties as a co-condition reduces alert volume by 27% while retaining 96.7% of true positives.',
      confidence: 'low',
    },
  ],
}

export const MARGINAL_PEER_COUNTS: Record<string, number> = {
  l1: 14,
  l2: 6,
  l3: 3,
  global: 47,
}

export const CASE_LEVELS = [1, 2, 3]

export const RULE_TESTING_STATUS: Record<string, { status: 'needs_testing' | 'recently_tested' | 'stale'; reason?: string; lastTestedAt?: string; lastTestedDaysAgo?: number }> = {
  'rule-001': { status: 'stale', reason: 'Not tested in 45 days', lastTestedAt: '2025-07-23', lastTestedDaysAgo: 45 },
  'rule-002': { status: 'recently_tested', lastTestedAt: '2025-09-02', lastTestedDaysAgo: 5 },
  'rule-003': { status: 'needs_testing', reason: 'Threshold changed' },
  'rule-004': { status: 'recently_tested', lastTestedAt: '2025-08-28', lastTestedDaysAgo: 10 },
  'rule-005': { status: 'needs_testing', reason: 'New rule' },
  'rule-006': { status: 'needs_testing', reason: 'New rule' },
  'rule-007': { status: 'needs_testing', reason: 'Parameters modified' },
}

export const STRATIFICATION_DIMENSIONS = [
  { id: 'overall', label: 'Overall' },
  { id: 'country', label: 'Country' },
  { id: 'customer_type', label: 'Customer Type' },
  { id: 'product', label: 'Product' },
  { id: 'channel', label: 'Channel' },
] as const

export const STRATIFIED_DATA: Record<string, { label: string; count: number; metrics: { precision: number; recall: number; f1: number; alertVolume: number; sarHitRate: number; falsePositiveRate: number } }[]> = {
  overall: [
    { label: 'All', count: 4823, metrics: { precision: 0.142, recall: 0.683, f1: 0.235, alertVolume: 4823, sarHitRate: 0.142, falsePositiveRate: 0.858 } },
  ],
  country: [
    { label: 'United States', count: 2104, metrics: { precision: 0.168, recall: 0.712, f1: 0.272, alertVolume: 2104, sarHitRate: 0.168, falsePositiveRate: 0.832 } },
    { label: 'United Kingdom', count: 891, metrics: { precision: 0.131, recall: 0.645, f1: 0.218, alertVolume: 891, sarHitRate: 0.131, falsePositiveRate: 0.869 } },
    { label: 'Singapore', count: 642, metrics: { precision: 0.189, recall: 0.724, f1: 0.300, alertVolume: 642, sarHitRate: 0.189, falsePositiveRate: 0.811 } },
    { label: 'Hong Kong', count: 518, metrics: { precision: 0.104, recall: 0.598, f1: 0.177, alertVolume: 518, sarHitRate: 0.104, falsePositiveRate: 0.896 } },
    { label: 'Germany', count: 384, metrics: { precision: 0.112, recall: 0.621, f1: 0.190, alertVolume: 384, sarHitRate: 0.112, falsePositiveRate: 0.888 } },
    { label: 'Other', count: 284, metrics: { precision: 0.095, recall: 0.573, f1: 0.163, alertVolume: 284, sarHitRate: 0.095, falsePositiveRate: 0.905 } },
  ],
  customer_type: [
    { label: 'Retail Individual', count: 2341, metrics: { precision: 0.098, recall: 0.612, f1: 0.169, alertVolume: 2341, sarHitRate: 0.098, falsePositiveRate: 0.902 } },
    { label: 'SME', count: 1205, metrics: { precision: 0.201, recall: 0.741, f1: 0.316, alertVolume: 1205, sarHitRate: 0.201, falsePositiveRate: 0.799 } },
    { label: 'Corporate', count: 842, metrics: { precision: 0.178, recall: 0.698, f1: 0.284, alertVolume: 842, sarHitRate: 0.178, falsePositiveRate: 0.822 } },
    { label: 'Private Banking', count: 435, metrics: { precision: 0.156, recall: 0.667, f1: 0.253, alertVolume: 435, sarHitRate: 0.156, falsePositiveRate: 0.844 } },
  ],
  product: [
    { label: 'Cash Deposits', count: 1891, metrics: { precision: 0.192, recall: 0.748, f1: 0.305, alertVolume: 1891, sarHitRate: 0.192, falsePositiveRate: 0.808 } },
    { label: 'Wire Transfer', count: 1342, metrics: { precision: 0.121, recall: 0.632, f1: 0.203, alertVolume: 1342, sarHitRate: 0.121, falsePositiveRate: 0.879 } },
    { label: 'ACH', count: 894, metrics: { precision: 0.108, recall: 0.601, f1: 0.183, alertVolume: 894, sarHitRate: 0.108, falsePositiveRate: 0.892 } },
    { label: 'Check', count: 456, metrics: { precision: 0.088, recall: 0.542, f1: 0.151, alertVolume: 456, sarHitRate: 0.088, falsePositiveRate: 0.912 } },
    { label: 'Other', count: 240, metrics: { precision: 0.075, recall: 0.498, f1: 0.130, alertVolume: 240, sarHitRate: 0.075, falsePositiveRate: 0.925 } },
  ],
  channel: [
    { label: 'Branch', count: 2156, metrics: { precision: 0.172, recall: 0.721, f1: 0.278, alertVolume: 2156, sarHitRate: 0.172, falsePositiveRate: 0.828 } },
    { label: 'Online Banking', count: 1534, metrics: { precision: 0.118, recall: 0.643, f1: 0.199, alertVolume: 1534, sarHitRate: 0.118, falsePositiveRate: 0.882 } },
    { label: 'Mobile', count: 782, metrics: { precision: 0.105, recall: 0.608, f1: 0.179, alertVolume: 782, sarHitRate: 0.105, falsePositiveRate: 0.895 } },
    { label: 'ATM', count: 351, metrics: { precision: 0.148, recall: 0.672, f1: 0.242, alertVolume: 351, sarHitRate: 0.148, falsePositiveRate: 0.852 } },
  ],
}

// ---------------------------------------------------------------------------
// Mock Alert Data
// ---------------------------------------------------------------------------

const ENTITY_NAMES = [
  'Jade River Trading Co', 'Marcus Whitfield', 'Solaris Holdings LLC', 'Chen Wei Import/Export',
  'Brightwater Consulting', 'Fatima Al-Rashid', 'Nordic Freight Solutions', 'Priya Shankar',
  'Oceancrest Ventures', 'Viktor Petrov', 'Golden Gate Remittance', 'Isabelle Moreau',
  'Horizon Capital Group', 'Raj Mehta Enterprises', 'Elena Vasquez', 'Alpine Logistics GmbH',
  'David Okonkwo', 'Pacific Rim Exports', 'Sarah Blackwood', 'Kensington Properties Ltd',
  'Jun Nakamura', 'Delta Port Services', 'Amira Hassan', 'Summit Financial Corp',
  'Roberto Fernandez', 'Liberty Exchange Inc', 'Yuki Tanaka', 'CrossBridge Partners',
  'Mohammed Al-Fayed', 'Sterling Trade Finance', 'Ana Kowalski', 'Meridian Shipping Co',
]

const COUNTERPARTIES = [
  'Bank of East Asia', 'HSBC Corporate', 'Wells Fargo Wire', 'Citibank NA',
  'Standard Chartered', 'Deutsche Bank AG', 'BNP Paribas', 'Barclays PLC',
  'Cash Counter #12', 'Cash Counter #7', 'ATM Deposit', 'Mobile Deposit',
  'JP Morgan Chase', 'UBS Group', 'Credit Suisse', 'ANZ Banking',
]

const TXN_TYPES = ['Cash Deposit', 'Wire Transfer', 'ACH', 'Check', 'Cash Deposit', 'Cash Deposit']
const CHANNELS = ['Branch', 'Online Banking', 'Mobile', 'ATM']
const COUNTRIES = ['United States', 'United Kingdom', 'Singapore', 'Hong Kong', 'Germany']
const CUSTOMER_TYPES = ['Retail Individual', 'SME', 'Corporate', 'Private Banking']

function seededRandom(seed: number) {
  let s = seed
  return () => { s = (s * 16807 + 0) % 2147483647; return s / 2147483647 }
}

function generateMockAlerts(rule: Rule, count: number): AlertRecord[] {
  const rand = seededRandom(42)
  const pick = <T>(arr: T[]) => arr[Math.floor(rand() * arr.length)]
  const alerts: AlertRecord[] = []

  const startDate = new Date('2025-07-01')
  const endDate = new Date('2025-09-28')
  const dateRange = endDate.getTime() - startDate.getTime()
  const thresholdParams = rule.parameters.filter(p => p.type === 'threshold')

  for (let i = 0; i < count; i++) {
    const entityIdx = Math.floor(rand() * ENTITY_NAMES.length)
    const entityId = `ENT-${String(100000 + entityIdx * 317 + i).slice(-6)}`
    const entityName = ENTITY_NAMES[entityIdx]

    const alertTime = new Date(startDate.getTime() + rand() * dateRange)
    const alertDate = alertTime.toISOString().split('T')[0]
    const windowStart = new Date(alertTime.getTime() - rule.lookbackWindowHours * 3600000)
    const windowEnd = alertTime

    const isSar = rand() < 0.14
    const isInferred = !isSar && rand() < 0.09
    const txnCount = Math.round(8 + rand() * 12)
    const totalAmount = Math.round((5000 + rand() * 40000) * 100) / 100
    const score = Math.round((isSar ? 55 + rand() * 40 : 25 + rand() * 55) * 10) / 10

    // Marginal flags — probability increases at narrower scopes
    const marginalAtLevel: TaxonomyLevel[] = []
    const marginalRoll = rand()
    if (marginalRoll < 0.62) marginalAtLevel.push('l3')
    if (marginalRoll < 0.44) marginalAtLevel.push('l2')
    if (marginalRoll < 0.25) marginalAtLevel.push('l1')
    if (marginalRoll < 0.17) marginalAtLevel.push('global')

    // Threshold comparisons
    const comparisons: ThresholdComparison[] = thresholdParams.map(p => {
      const threshold = typeof p.currentValue === 'number' ? p.currentValue : 0
      let actual: number
      if (p.id === 'p1') actual = txnCount
      else if (p.id === 'p2') actual = Math.round((threshold * (1.0 + rand() * 2.5)) * 100) / 100
      else actual = Math.round(threshold * (1.1 + rand() * 1.8) * 100) / 100
      return {
        parameterId: p.id,
        parameterName: p.name,
        threshold: p.currentValue,
        actualValue: actual,
        unit: p.unit,
        exceeded: typeof actual === 'number' && typeof threshold === 'number' ? actual >= threshold : true,
      }
    })

    // Generate nested transactions — rule-aware so trigger always fires
    const transactions: TransactionRecord[] = []

    if (rule.id === 'rule-001') {
      // High Velocity Cash Deposits: need ≥ p1 qualifying txns above amount_floor (p2)
      const amountFloor = 3000
      const velocityThreshold = typeof rule.parameters.find(p => p.id === 'p1')?.currentValue === 'number'
        ? (rule.parameters.find(p => p.id === 'p1')!.currentValue as number) : 10
      const qualifyingNeeded = velocityThreshold + 1 + Math.floor(rand() * 4)
      const nonQualifying = 2 + Math.floor(rand() * 5)
      const numTxns = qualifyingNeeded + nonQualifying
      let placed = 0
      for (let t = 0; t < numTxns; t++) {
        const txnTime = new Date(windowStart.getTime() + rand() * (windowEnd.getTime() - windowStart.getTime()))
        const shouldQualify = placed < qualifyingNeeded
        if (shouldQualify) placed++
        transactions.push({
          id: `TXN-${String(i * 100 + t).padStart(6, '0')}`,
          date: txnTime.toISOString().split('T')[0],
          amount: shouldQualify
            ? Math.round((amountFloor + rand() * 12000) * 100) / 100
            : Math.round((200 + rand() * 2500) * 100) / 100,
          currency: 'USD',
          type: pick(TXN_TYPES),
          counterparty: pick(COUNTERPARTIES),
          channel: pick(CHANNELS),
          passedFilters: shouldQualify ? true : rand() > 0.3,
        })
      }
    } else if (rule.id === 'rule-002') {
      // Rapid Cross-Border Transfers: need ≥ p4 distinct counterparties (beneficiaries)
      const benefThreshold = typeof rule.parameters.find(p => p.id === 'p4')?.currentValue === 'number'
        ? (rule.parameters.find(p => p.id === 'p4')!.currentValue as number) : 5
      const distinctNeeded = benefThreshold + 1 + Math.floor(rand() * 3)
      const extraTxns = 3 + Math.floor(rand() * 5)
      // First, place one txn per distinct counterparty
      const shuffled = [...COUNTERPARTIES].sort(() => rand() - 0.5)
      for (let t = 0; t < distinctNeeded && t < shuffled.length; t++) {
        const txnTime = new Date(windowStart.getTime() + rand() * (windowEnd.getTime() - windowStart.getTime()))
        transactions.push({
          id: `TXN-${String(i * 100 + t).padStart(6, '0')}`,
          date: txnTime.toISOString().split('T')[0],
          amount: Math.round((5000 + rand() * 30000) * 100) / 100,
          currency: 'USD',
          type: 'Wire Transfer',
          counterparty: shuffled[t],
          channel: pick(CHANNELS),
          passedFilters: true,
        })
      }
      // Then add a few repeats / noise
      for (let t = 0; t < extraTxns; t++) {
        const txnTime = new Date(windowStart.getTime() + rand() * (windowEnd.getTime() - windowStart.getTime()))
        transactions.push({
          id: `TXN-${String(i * 100 + distinctNeeded + t).padStart(6, '0')}`,
          date: txnTime.toISOString().split('T')[0],
          amount: Math.round((1000 + rand() * 8000) * 100) / 100,
          currency: 'USD',
          type: pick(TXN_TYPES),
          counterparty: pick(COUNTERPARTIES),
          channel: pick(CHANNELS),
          passedFilters: rand() > 0.2,
        })
      }
    } else if (rule.id === 'rule-003') {
      // Dormant Account Reactivation: need at least one txn ≥ p7 ($25K)
      const reactivationAmount = typeof rule.parameters.find(p => p.id === 'p7')?.currentValue === 'number'
        ? (rule.parameters.find(p => p.id === 'p7')!.currentValue as number) : 25000
      const numTxns = 6 + Math.floor(rand() * 8)
      // Place 1-2 high-value reactivation transactions
      const highValueCount = 1 + Math.floor(rand() * 2)
      for (let t = 0; t < numTxns; t++) {
        const txnTime = new Date(windowStart.getTime() + rand() * (windowEnd.getTime() - windowStart.getTime()))
        const isHighValue = t < highValueCount
        transactions.push({
          id: `TXN-${String(i * 100 + t).padStart(6, '0')}`,
          date: txnTime.toISOString().split('T')[0],
          amount: isHighValue
            ? Math.round((reactivationAmount + rand() * 30000) * 100) / 100
            : Math.round((500 + rand() * 8000) * 100) / 100,
          currency: 'USD',
          type: pick(TXN_TYPES),
          counterparty: pick(COUNTERPARTIES),
          channel: pick(CHANNELS),
          passedFilters: isHighValue ? true : rand() > 0.15,
        })
      }
    } else if (rule.id === 'rule-004') {
      // Remittance Fan-Out: need ≥ p8 distinct counterparties (senders)
      const senderThreshold = typeof rule.parameters.find(p => p.id === 'p8')?.currentValue === 'number'
        ? (rule.parameters.find(p => p.id === 'p8')!.currentValue as number) : 8
      const distinctNeeded = senderThreshold + 1 + Math.floor(rand() * 3)
      const extraTxns = 2 + Math.floor(rand() * 4)
      const shuffled = [...COUNTERPARTIES].sort(() => rand() - 0.5)
      for (let t = 0; t < distinctNeeded && t < shuffled.length; t++) {
        const txnTime = new Date(windowStart.getTime() + rand() * (windowEnd.getTime() - windowStart.getTime()))
        transactions.push({
          id: `TXN-${String(i * 100 + t).padStart(6, '0')}`,
          date: txnTime.toISOString().split('T')[0],
          amount: Math.round((2000 + rand() * 15000) * 100) / 100,
          currency: 'USD',
          type: 'Wire Transfer',
          counterparty: shuffled[t],
          channel: pick(CHANNELS),
          passedFilters: true,
        })
      }
      for (let t = 0; t < extraTxns; t++) {
        const txnTime = new Date(windowStart.getTime() + rand() * (windowEnd.getTime() - windowStart.getTime()))
        transactions.push({
          id: `TXN-${String(i * 100 + distinctNeeded + t).padStart(6, '0')}`,
          date: txnTime.toISOString().split('T')[0],
          amount: Math.round((500 + rand() * 5000) * 100) / 100,
          currency: 'USD',
          type: pick(TXN_TYPES),
          counterparty: pick(COUNTERPARTIES),
          channel: pick(CHANNELS),
          passedFilters: rand() > 0.2,
        })
      }
    } else {
      // Fallback: generic transaction generation
      const numTxns = 8 + Math.floor(rand() * 10)
      for (let t = 0; t < numTxns; t++) {
        const txnTime = new Date(windowStart.getTime() + rand() * (windowEnd.getTime() - windowStart.getTime()))
        transactions.push({
          id: `TXN-${String(i * 100 + t).padStart(6, '0')}`,
          date: txnTime.toISOString().split('T')[0],
          amount: Math.round((1000 + rand() * 15000) * 100) / 100,
          currency: 'USD',
          type: pick(TXN_TYPES),
          counterparty: pick(COUNTERPARTIES),
          channel: pick(CHANNELS),
          passedFilters: rand() > 0.15,
        })
      }
    }
    transactions.sort((a, b) => b.date.localeCompare(a.date))

    alerts.push({
      id: `ALT-${String(i + 1).padStart(5, '0')}`,
      entityId,
      entityName,
      alertDate,
      aggregationWindowStart: windowStart.toISOString().split('T')[0],
      aggregationWindowEnd: windowEnd.toISOString().split('T')[0],
      totalAmount,
      transactionCount: txnCount,
      alertScore: score,
      sarFiled: isSar,
      inferredSar: isInferred,
      country: pick(COUNTRIES),
      customerType: pick(CUSTOMER_TYPES),
      channel: pick(CHANNELS),
      isMarginal: marginalAtLevel.length > 0,
      marginalAtLevel,
      thresholdComparisons: comparisons,
      transactions,
    })
  }

  return alerts.sort((a, b) => b.alertDate.localeCompare(a.alertDate))
}

// ---------------------------------------------------------------------------
// Rule-005: Sub-CTR Structuring alert generator
// ---------------------------------------------------------------------------

function generateStructuringAlerts(rule: Rule, count: number): AlertRecord[] {
  const rand = seededRandom(101)
  const pick = <T>(arr: T[]) => arr[Math.floor(rand() * arr.length)]
  const alerts: AlertRecord[] = []
  const startDate = new Date('2025-07-01')
  const endDate = new Date('2025-09-28')
  const dateRange = endDate.getTime() - startDate.getTime()
  const thresholdParams = rule.parameters.filter(p => p.type === 'threshold')

  for (let i = 0; i < count; i++) {
    const entityIdx = Math.floor(rand() * ENTITY_NAMES.length)
    const entityId = `ENT-${String(200000 + entityIdx * 317 + i).slice(-6)}`
    const entityName = ENTITY_NAMES[entityIdx]
    const alertTime = new Date(startDate.getTime() + rand() * dateRange)
    const alertDate = alertTime.toISOString().split('T')[0]
    const windowStart = new Date(alertTime.getTime() - rule.lookbackWindowHours * 3600000)
    const windowEnd = alertTime

    const isSar = rand() < 0.18
    const isInferred = !isSar && rand() < 0.10
    const score = Math.round((isSar ? 60 + rand() * 35 : 30 + rand() * 50) * 10) / 10

    // Marginal flags
    const marginalAtLevel: TaxonomyLevel[] = []
    const marginalRoll = rand()
    if (marginalRoll < 0.58) marginalAtLevel.push('l3')
    if (marginalRoll < 0.40) marginalAtLevel.push('l2')
    if (marginalRoll < 0.22) marginalAtLevel.push('l1')
    if (marginalRoll < 0.14) marginalAtLevel.push('global')

    // Generate transactions: guarantee ≥ count_trigger (p12=5) near-threshold deposits
    const countTrigger = typeof rule.parameters.find(p => p.id === 'p12')?.currentValue === 'number'
      ? (rule.parameters.find(p => p.id === 'p12')!.currentValue as number) : 5
    const nearNeeded = countTrigger + 1 + Math.floor(rand() * 3)
    const otherTxns = 3 + Math.floor(rand() * 5)
    const numTxns = nearNeeded + otherTxns
    const transactions: TransactionRecord[] = []
    let totalAmount = 0
    let nearPlaced = 0
    for (let t = 0; t < numTxns; t++) {
      const txnTime = new Date(windowStart.getTime() + rand() * (windowEnd.getTime() - windowStart.getTime()))
      let txnAmount: number
      if (nearPlaced < nearNeeded) {
        // Near-threshold: $8,000 – $9,950 (just under $10K)
        txnAmount = Math.round((8000 + rand() * 1950) * 100) / 100
        nearPlaced++
      } else {
        const roll = rand()
        if (roll < 0.5) {
          txnAmount = Math.round((500 + rand() * 3500) * 100) / 100
        } else {
          txnAmount = Math.round((4000 + rand() * 3999) * 100) / 100
        }
      }
      totalAmount += txnAmount
      transactions.push({
        id: `TXN-S-${String(i * 100 + t).padStart(6, '0')}`,
        date: txnTime.toISOString().split('T')[0],
        amount: txnAmount,
        currency: 'USD',
        type: rand() < 0.7 ? 'Cash Deposit' : pick(['Check', 'Cash Deposit', 'ACH']),
        counterparty: pick(COUNTERPARTIES),
        channel: pick(['Branch', 'ATM', 'Branch', 'Branch']),
        // Near-threshold txns always pass filters
        passedFilters: nearPlaced <= nearNeeded ? true : rand() > 0.10,
      })
    }
    transactions.sort((a, b) => b.date.localeCompare(a.date))

    const nearCount = transactions.filter(t => t.passedFilters && t.amount >= 8000 && t.amount < 10000).length
    const comparisons: ThresholdComparison[] = thresholdParams.map(p => {
      const threshold = typeof p.currentValue === 'number' ? p.currentValue : 0
      let actual: number
      if (p.id === 'p10') actual = Math.round(Math.max(...transactions.map(t => t.amount)))
      else if (p.id === 'p12') actual = nearCount
      else actual = Math.round(threshold * (0.8 + rand() * 0.19) * 100) / 100
      return { parameterId: p.id, parameterName: p.name, threshold: p.currentValue, actualValue: actual, unit: p.unit, exceeded: actual >= threshold }
    })

    alerts.push({
      id: `ALT-S-${String(i + 1).padStart(5, '0')}`,
      entityId, entityName, alertDate,
      aggregationWindowStart: windowStart.toISOString().split('T')[0],
      aggregationWindowEnd: windowEnd.toISOString().split('T')[0],
      totalAmount: Math.round(totalAmount),
      transactionCount: numTxns,
      alertScore: score, sarFiled: isSar, inferredSar: isInferred,
      country: pick(COUNTRIES), customerType: pick(CUSTOMER_TYPES), channel: pick(CHANNELS),
      isMarginal: marginalAtLevel.length > 0, marginalAtLevel,
      thresholdComparisons: comparisons, transactions,
    })
  }
  return alerts.sort((a, b) => b.alertDate.localeCompare(a.alertDate))
}

// ---------------------------------------------------------------------------
// Rule-006: Rapid Fund Movement alert generator
// ---------------------------------------------------------------------------

const INFLOW_TYPES = ['Wire Transfer In', 'ACH Credit', 'Cash Deposit', 'Check Deposit']
const OUTFLOW_TYPES = ['Wire Transfer Out', 'ACH Debit', 'Cash Withdrawal', 'Check Issued']

function generateRapidMovementAlerts(rule: Rule, count: number): AlertRecord[] {
  const rand = seededRandom(202)
  const pick = <T>(arr: T[]) => arr[Math.floor(rand() * arr.length)]
  const alerts: AlertRecord[] = []
  const startDate = new Date('2025-07-01')
  const endDate = new Date('2025-09-28')
  const dateRange = endDate.getTime() - startDate.getTime()
  const thresholdParams = rule.parameters.filter(p => p.type === 'threshold')

  for (let i = 0; i < count; i++) {
    const entityIdx = Math.floor(rand() * ENTITY_NAMES.length)
    const entityId = `ENT-${String(300000 + entityIdx * 317 + i).slice(-6)}`
    const entityName = ENTITY_NAMES[entityIdx]
    const alertTime = new Date(startDate.getTime() + rand() * dateRange)
    const alertDate = alertTime.toISOString().split('T')[0]
    const windowStart = new Date(alertTime.getTime() - rule.lookbackWindowHours * 3600000)
    const windowEnd = alertTime

    const isSar = rand() < 0.16
    const isInferred = !isSar && rand() < 0.08
    const score = Math.round((isSar ? 58 + rand() * 38 : 28 + rand() * 52) * 10) / 10

    const marginalAtLevel: TaxonomyLevel[] = []
    const marginalRoll = rand()
    if (marginalRoll < 0.55) marginalAtLevel.push('l3')
    if (marginalRoll < 0.38) marginalAtLevel.push('l2')
    if (marginalRoll < 0.20) marginalAtLevel.push('l1')
    if (marginalRoll < 0.12) marginalAtLevel.push('global')

    // Generate transactions: inflows first, then outflows
    // Must cross: outflow/inflow ≥ 85% (p13) and cumul inflow ≥ $25K (p14)
    const numTxns = 10 + Math.floor(rand() * 8)
    const transactions: TransactionRecord[] = []
    let totalAmount = 0
    const inflowPhase = Math.floor(numTxns * (0.35 + rand() * 0.15)) // ~35-50% are inflows first
    // Target total inflow well above $25K and total outflow ≥ 90% of inflow
    const targetInflow = 30000 + rand() * 40000
    const inflowPerTxn = targetInflow / inflowPhase
    const outflowTxns = numTxns - inflowPhase
    const targetOutflow = targetInflow * (0.88 + rand() * 0.15) // 88-103% of inflow
    const outflowPerTxn = targetOutflow / outflowTxns

    for (let t = 0; t < numTxns; t++) {
      const progress = t / numTxns
      const timeOffset = progress * (windowEnd.getTime() - windowStart.getTime())
      const jitter = (rand() - 0.5) * 3600000 * 4
      const txnTime = new Date(windowStart.getTime() + timeOffset + jitter)
      const clampedTime = new Date(Math.max(windowStart.getTime(), Math.min(windowEnd.getTime(), txnTime.getTime())))

      const isInflow = t < inflowPhase
      const direction: 'inflow' | 'outflow' = isInflow ? 'inflow' : 'outflow'

      const txnAmount = isInflow
        ? Math.round((inflowPerTxn * (0.7 + rand() * 0.6)) * 100) / 100
        : Math.round((outflowPerTxn * (0.6 + rand() * 0.8)) * 100) / 100
      totalAmount += txnAmount

      transactions.push({
        id: `TXN-R-${String(i * 100 + t).padStart(6, '0')}`,
        date: clampedTime.toISOString().split('T')[0],
        amount: txnAmount,
        currency: 'USD',
        type: isInflow ? pick(INFLOW_TYPES) : pick(OUTFLOW_TYPES),
        counterparty: pick(COUNTERPARTIES),
        channel: pick(CHANNELS),
        passedFilters: true, // all pass to ensure trigger fires
        direction,
      })
    }
    transactions.sort((a, b) => a.date.localeCompare(b.date)) // chronological

    const totalIn = transactions.filter(t => t.direction === 'inflow' && t.passedFilters).reduce((s, t) => s + t.amount, 0)
    const totalOut = transactions.filter(t => t.direction === 'outflow' && t.passedFilters).reduce((s, t) => s + t.amount, 0)
    const ratio = totalIn > 0 ? totalOut / totalIn : 0

    const comparisons: ThresholdComparison[] = thresholdParams.map(p => {
      const threshold = typeof p.currentValue === 'number' ? p.currentValue : 0
      let actual: number
      if (p.id === 'p13') actual = Math.round(ratio * 100) / 100
      else if (p.id === 'p14') actual = Math.round(totalIn)
      else actual = Math.round(threshold * (1.1 + rand() * 1.5) * 100) / 100
      return { parameterId: p.id, parameterName: p.name, threshold: p.currentValue, actualValue: actual, unit: p.unit, exceeded: actual >= threshold }
    })

    alerts.push({
      id: `ALT-R-${String(i + 1).padStart(5, '0')}`,
      entityId, entityName, alertDate,
      aggregationWindowStart: windowStart.toISOString().split('T')[0],
      aggregationWindowEnd: windowEnd.toISOString().split('T')[0],
      totalAmount: Math.round(totalAmount),
      transactionCount: numTxns,
      alertScore: score, sarFiled: isSar, inferredSar: isInferred,
      country: pick(COUNTRIES), customerType: pick(CUSTOMER_TYPES), channel: pick(CHANNELS),
      isMarginal: marginalAtLevel.length > 0, marginalAtLevel,
      thresholdComparisons: comparisons, transactions,
    })
  }
  return alerts.sort((a, b) => b.alertDate.localeCompare(a.alertDate))
}

// ---------------------------------------------------------------------------
// Rule-007: Escalating Transaction Amounts alert generator
// ---------------------------------------------------------------------------

function generateEscalatingAlerts(rule: Rule, count: number): AlertRecord[] {
  const rand = seededRandom(303)
  const pick = <T>(arr: T[]) => arr[Math.floor(rand() * arr.length)]
  const alerts: AlertRecord[] = []
  const startDate = new Date('2025-07-01')
  const endDate = new Date('2025-09-28')
  const dateRange = endDate.getTime() - startDate.getTime()
  const thresholdParams = rule.parameters.filter(p => p.type === 'threshold')

  for (let i = 0; i < count; i++) {
    const entityIdx = Math.floor(rand() * ENTITY_NAMES.length)
    const entityId = `ENT-${String(400000 + entityIdx * 317 + i).slice(-6)}`
    const entityName = ENTITY_NAMES[entityIdx]
    const alertTime = new Date(startDate.getTime() + rand() * dateRange)
    const alertDate = alertTime.toISOString().split('T')[0]
    const windowStart = new Date(alertTime.getTime() - rule.lookbackWindowHours * 3600000)
    const windowEnd = alertTime

    const isSar = rand() < 0.12
    const isInferred = !isSar && rand() < 0.11
    const score = Math.round((isSar ? 55 + rand() * 40 : 25 + rand() * 55) * 10) / 10

    const marginalAtLevel: TaxonomyLevel[] = []
    const marginalRoll = rand()
    if (marginalRoll < 0.60) marginalAtLevel.push('l3')
    if (marginalRoll < 0.42) marginalAtLevel.push('l2')
    if (marginalRoll < 0.23) marginalAtLevel.push('l1')
    if (marginalRoll < 0.15) marginalAtLevel.push('global')

    // Generate transactions with escalating amounts over time
    // Need ≥ p16 (6) qualifying txns above p17 ($2K) with growth ≥ p15 (1.5×)
    const minTxns = typeof rule.parameters.find(p => p.id === 'p16')?.currentValue === 'number'
      ? (rule.parameters.find(p => p.id === 'p16')!.currentValue as number) : 6
    const qualifyingNeeded = minTxns + 2 + Math.floor(rand() * 4)
    const noiseTxns = 2 + Math.floor(rand() * 4)
    const numTxns = qualifyingNeeded + noiseTxns
    const transactions: TransactionRecord[] = []
    let totalAmount = 0
    const baseAmount = 2200 + rand() * 1500 // starting range $2,200 – $3,700 (always above $2K floor)
    const growthPerTxn = 1.12 + rand() * 0.15 // 12-27% growth per qualifying txn

    let qualifyingPlaced = 0
    for (let t = 0; t < numTxns; t++) {
      const progress = t / numTxns
      const timeOffset = progress * (windowEnd.getTime() - windowStart.getTime())
      const jitter = (rand() - 0.5) * 3600000 * 8
      const txnTime = new Date(windowStart.getTime() + timeOffset + jitter)
      const clampedTime = new Date(Math.max(windowStart.getTime(), Math.min(windowEnd.getTime(), txnTime.getTime())))

      let txnAmount: number
      const isQualifying = qualifyingPlaced < qualifyingNeeded
      if (isQualifying) {
        // Escalating qualifying transaction
        const escalatedBase = baseAmount * Math.pow(growthPerTxn, qualifyingPlaced)
        txnAmount = Math.round((escalatedBase * (0.9 + rand() * 0.2)) * 100) / 100
        qualifyingPlaced++
      } else {
        // Noise: small non-qualifying transaction
        txnAmount = Math.round((200 + rand() * 1500) * 100) / 100
      }
      totalAmount += txnAmount

      transactions.push({
        id: `TXN-E-${String(i * 100 + t).padStart(6, '0')}`,
        date: clampedTime.toISOString().split('T')[0],
        amount: txnAmount,
        currency: 'USD',
        type: pick(TXN_TYPES),
        counterparty: pick(COUNTERPARTIES),
        channel: pick(CHANNELS),
        // Qualifying txns always pass filters
        passedFilters: isQualifying ? true : rand() > 0.3,
      })
    }
    transactions.sort((a, b) => b.date.localeCompare(a.date))

    // Compute actual growth for threshold comparisons
    const qualifying = transactions.filter(t => t.passedFilters && t.amount >= 2000).sort((a, b) => a.date.localeCompare(b.date))
    let actualGrowth = 1.0
    if (qualifying.length >= 6) {
      const half = Math.floor(qualifying.length / 2)
      const firstHalfAvg = qualifying.slice(0, half).reduce((s, t) => s + t.amount, 0) / half
      const secondHalfAvg = qualifying.slice(half).reduce((s, t) => s + t.amount, 0) / (qualifying.length - half)
      actualGrowth = firstHalfAvg > 0 ? secondHalfAvg / firstHalfAvg : 1
    }

    const comparisons: ThresholdComparison[] = thresholdParams.map(p => {
      const threshold = typeof p.currentValue === 'number' ? p.currentValue : 0
      let actual: number
      if (p.id === 'p15') actual = Math.round(actualGrowth * 100) / 100
      else if (p.id === 'p16') actual = qualifying.length
      else if (p.id === 'p17') actual = qualifying.length > 0 ? Math.round(qualifying[qualifying.length - 1].amount) : 0
      else actual = Math.round(threshold * (1.1 + rand() * 1.8) * 100) / 100
      return { parameterId: p.id, parameterName: p.name, threshold: p.currentValue, actualValue: actual, unit: p.unit, exceeded: actual >= threshold }
    })

    alerts.push({
      id: `ALT-E-${String(i + 1).padStart(5, '0')}`,
      entityId, entityName, alertDate,
      aggregationWindowStart: windowStart.toISOString().split('T')[0],
      aggregationWindowEnd: windowEnd.toISOString().split('T')[0],
      totalAmount: Math.round(totalAmount),
      transactionCount: numTxns,
      alertScore: score, sarFiled: isSar, inferredSar: isInferred,
      country: pick(COUNTRIES), customerType: pick(CUSTOMER_TYPES), channel: pick(CHANNELS),
      isMarginal: marginalAtLevel.length > 0, marginalAtLevel,
      thresholdComparisons: comparisons, transactions,
    })
  }
  return alerts.sort((a, b) => b.alertDate.localeCompare(a.alertDate))
}

// ---------------------------------------------------------------------------
// Per-rule alert map
// ---------------------------------------------------------------------------

export const MOCK_ALERTS: AlertRecord[] = generateMockAlerts(RULES[0], 96)

export const MOCK_ALERTS_BY_RULE: Record<string, AlertRecord[]> = {
  'rule-001': MOCK_ALERTS,
  'rule-002': generateMockAlerts(RULES.find(r => r.id === 'rule-002')!, 58),
  'rule-003': generateMockAlerts(RULES.find(r => r.id === 'rule-003')!, 44),
  'rule-004': generateMockAlerts(RULES.find(r => r.id === 'rule-004')!, 66),
  'rule-005': generateStructuringAlerts(RULES.find(r => r.id === 'rule-005')!, 72),
  'rule-006': generateRapidMovementAlerts(RULES.find(r => r.id === 'rule-006')!, 64),
  'rule-007': generateEscalatingAlerts(RULES.find(r => r.id === 'rule-007')!, 80),
}
