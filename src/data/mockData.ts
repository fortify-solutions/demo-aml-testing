import type { Rule, BacktestResult, Recommendation } from '../types'

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
]

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

export const MARGINAL_PEER_COUNTS: Record<string, number> = {
  l1: 14,
  l2: 6,
  l3: 3,
  global: 47,
}

export const CASE_LEVELS = [1, 2, 3]

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
