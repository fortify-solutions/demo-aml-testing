import { createContext, useContext } from 'react'

export type DomainMode = 'aml' | 'fraud'

export interface DomainContextValue {
  mode: DomainMode
  setMode: (mode: DomainMode) => void
}

export const DomainContext = createContext<DomainContextValue | null>(null)

export function useDomain(): DomainContextValue {
  const ctx = useContext(DomainContext)
  if (!ctx) throw new Error('useDomain must be used within DomainProvider')
  return ctx
}

/** Mode-aware copy registry. All user-facing strings that differ between AML and Fraud live here. */
export interface ModeCopy {
  confirmedLabel: string             // "SAR Filed" / "Fraud Confirmed"
  confirmedLabelShort: string        // "SAR" / "Fraud"
  confirmedLabelPlural: string       // "SARs" / "Confirmed frauds"
  inferredLabel: string              // "Inferred SAR" / "Suspected fraud"
  hitRateName: string                // "SAR Hit Rate" / "Fraud Hit Rate"
  hitRateShort: string               // "SAR Rate" / "Fraud Rate"
  domainName: string                 // "AML" / "Fraud"
  groundTruthOptions: { value: string; label: string }[]
  /** Display name for each taxonomy level. AML uses L1/L2/L3 (FATF-style); Fraud uses descriptive names. */
  levelLabels: { l1: string; l2: string; l3: string; global: string }
  /** Threshold-population analysis labels. AML uses Above/Below the Line (ATL/BTL); Fraud uses Above/Below Cutoff. */
  thresholdAnalysis: {
    tabName: string         // tab label
    panelTitle: string      // panel header
    aboveName: string       // "Above the Line" / "Above Cutoff"
    belowName: string       // "Below the Line" / "Below Cutoff"
    aboveDescription: string
    belowDescription: string
  }
}

export const COPY: Record<DomainMode, ModeCopy> = {
  aml: {
    confirmedLabel: 'SAR Filed',
    confirmedLabelShort: 'SAR',
    confirmedLabelPlural: 'SARs',
    inferredLabel: 'Inferred SAR',
    hitRateName: 'SAR Hit Rate',
    hitRateShort: 'SAR Rate',
    domainName: 'AML',
    groundTruthOptions: [
      { value: 'sar', label: 'SAR Filed' },
      { value: 'case_level_1', label: 'Case Level 1' },
      { value: 'case_level_2', label: 'Case Level 2' },
      { value: 'case_level_3', label: 'Case Level 3' },
    ],
    levelLabels: { l1: 'L1', l2: 'L2', l3: 'L3', global: 'Global' },
    thresholdAnalysis: {
      tabName: 'ATL / BTL Analysis',
      panelTitle: 'ATL / BTL Analysis',
      aboveName: 'Above the Line',
      belowName: 'Below the Line',
      aboveDescription: 'Entities that triggered the rule',
      belowDescription: 'Entities that did not trigger',
    },
  },
  fraud: {
    confirmedLabel: 'Fraud Confirmed',
    confirmedLabelShort: 'Fraud',
    confirmedLabelPlural: 'Confirmed frauds',
    inferredLabel: 'Suspected Fraud',
    hitRateName: 'Fraud Hit Rate',
    hitRateShort: 'Fraud Rate',
    domainName: 'Fraud',
    groundTruthOptions: [
      { value: 'sar', label: 'Confirmed Fraud' },
      { value: 'case_level_1', label: 'Chargeback' },
      { value: 'case_level_2', label: 'Disputed' },
      { value: 'case_level_3', label: 'Investigated' },
    ],
    levelLabels: { l1: 'Type', l2: 'Pattern', l3: 'Signal', global: 'All' },
    thresholdAnalysis: {
      tabName: 'Cutoff Analysis',
      panelTitle: 'Cutoff Analysis',
      aboveName: 'Above Cutoff',
      belowName: 'Below Cutoff',
      aboveDescription: 'Entities that scored above the threshold',
      belowDescription: 'Entities that scored just below',
    },
  },
}

export function useCopy(): ModeCopy {
  const { mode } = useDomain()
  return COPY[mode]
}
