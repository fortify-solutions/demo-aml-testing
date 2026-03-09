# AML Rule Testing & Optimisation

A prototype screen for backtesting and optimising AML transaction monitoring rules. Built with React, Tailwind CSS v4, Recharts, Framer Motion, and Lucide React.

## Getting started

```bash
npm install
npm run dev
```

The dev server starts at `http://localhost:5173`.

## Using the screen

### 1. Select a rule

Open the **rule dropdown** in the top bar. Rules are organised by typology taxonomy — grouped first by L1 category (Structuring, Unusual Activity, Layering, Trade-Based ML, Fraud Overlap) then by L2 sub-category. The dropdown contains ~29 rules; 7 have full backtest data (green dot) while the rest are placeholder names for demo purposes (amber dot). Taxonomy tags (L1 / L2 / L3) appear as pills next to the selector on wider screens. Use the search box to filter by rule name or taxonomy.

### 2. Configure and run

The top bar contains all configuration: rule selector, date range, and the **Run Backtest** button. Click Run Backtest to execute (~1.5 s mock delay). Results populate the main content area.

### 3. Explore results

A secondary toolbar appears with results, offering four controls that update all sections live without re-running:

| Control | What it does |
|---|---|
| **Ground Truth** | What counts as a true positive: `SAR Filed` or a specific `Case Level` |
| **Labels** | `Formal` uses confirmed SARs only; `Formal + Inferred` includes Bayesian inferred labels with 90% credible intervals |
| **Unit** | `Alert` · `Case` · `Entity` — aggregation level for all metrics |
| **View** | `Absolute` or `Marginal` performance perspective |

### 4. Read the results

Scrolling down through the main content area:

- **Rule Logic** — displays the selected rule's description, a human-readable trigger condition, and a parameter summary (thresholds, lookback window, batch cadence).
- **Label Composition** — horizontal bar showing the formal / inferred label split. In Formal mode the inferred segment dims with a strikethrough.
- **Absolute Performance** — six metric cards (Precision, Recall, F1, Alert Volume, SAR Hit Rate, False Positive Rate). In Formal + Inferred mode each card shows a secondary "formal only" value and an SVG bell-curve density visualisation of the 90% credible interval (dark teal at the posterior mean, fading to transparent at the tails).
- **Marginal Performance** — same metrics showing what this rule *uniquely contributes* relative to its peer group. Use the taxonomy toggle (L1 / L2 / L3 / Global) to change scope. Delta rows show improvement (green) or regression (red).
- **Performance Data Table** — stratified breakdown by country, customer type, product, and channel.
- **Alert Volume** — area chart of alerts, formal SARs, and inferred SARs over time (marginal view only).
- **Alert Explorer** — expandable table of individual alerts. Expand any alert to see its transactions with rule-specific running state columns:
  - *High Velocity Cash Deposits*: ≥ Floor, In Scope, Velocity count
  - *Rapid Cross-Border Transfers*: New Beneficiary, Distinct count
  - *Dormant Account Reactivation*: Day offset, ≥ Threshold, Cumulative $
  - *Remittance Fan-Out Detection*: New Sender, Sender count
  - *Sub-CTR Structuring*: Near Limit %, Running Count, Cumulative $
  - *Rapid Fund Movement*: Direction (↑/↓), Cumulative In/Out, Out/In Ratio
  - *Escalating Amounts*: Rolling Avg, Prior Avg, Growth factor
  - Trigger rows are highlighted in teal when the rule condition is met.
- **ATL / BTL Analysis** — above/below threshold population comparison (collapsible).
- **Recommendations** — AI-generated optimisation suggestions with before/after metrics and confidence levels (collapsible). Hovering a recommendation highlights affected metric cards.

## Project structure

```
src/
  types.ts                         TypeScript interfaces and type definitions
  data/
    mockData.ts                    Mock data (7 rules, alerts, recommendations, rule testing status)
    computeResults.ts              Adjusted metric computation and Bayesian CI generation
  App.tsx                          Page layout and global state
  index.css                        Tailwind config, Geist font imports, stage-glow effects
  theme.ts                         Theme token definitions
  components/
    ConfigPanel.tsx                Top bar with rule selector, date range, and run button
    ResultsToolbar.tsx             Ground truth, labels, unit, and view toggles
    RuleLogicPanel.tsx             Rule description, trigger condition, and parameter display
    LabelCompositionBar.tsx        Formal / inferred label split bar
    AbsolutePerformance.tsx        Metric cards with SVG bell-curve credible interval density
    MarginalPerformance.tsx        Marginal metrics with taxonomy toggle and delta row
    PerformanceDataTable.tsx       Stratified performance breakdown table
    VolumeChart.tsx                Alert volume area chart over time
    AlertExplorer.tsx              Alert table with rule-aware transaction state tracking
    ATLBTLAnalysis.tsx             Above / below threshold analysis (collapsible)
    RecommendationsPanel.tsx       AI recommendation cards (collapsible)
```

## Wiring to a real backend

The mock data in `src/data/mockData.ts` conforms to the `BacktestResult`, `Rule`, and `Recommendation` interfaces in `src/types.ts`. To connect a real API:

1. Replace the `setTimeout` calls in `App.tsx` `handleRunBacktest` with actual fetch calls.
2. The backtest endpoint should return both label modes (`formal` and `formal_inferred`) in a single response so the label toggle works client-side without re-fetching.
3. The recommendations endpoint can be called separately after the backtest completes — the UI already handles the async loading state with skeleton cards.
4. The "Apply in Rule Builder" button emits a `console.log` with the recommendation payload. Wire this to your rule builder navigation.
5. For Bayesian credible intervals, the backend should return `ci` fields on `PerformanceMetrics` when inferred labels are included — or the frontend computation in `computeResults.ts` can be adapted to your posterior estimation approach.
