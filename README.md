# AML Rule Testing & Optimisation

A prototype screen for backtesting and optimising AML transaction monitoring rules. Built with React, Tailwind CSS v4, Recharts, Framer Motion, and Lucide React.

## Getting started

```bash
cd /Users/tom/Documents/Prototypes/aml-rule-testing-app
npm install
npm run dev
```

The dev server starts at `http://localhost:5173`.

## Using the screen

### 1. Select a rule

Open the **Rule** dropdown in the left panel and pick one of the four mock rules. Taxonomy tags (L1 / L2 / L3) appear as pills beneath the selector once a rule is chosen. The breadcrumb in the header updates to show the active rule name.

### 2. Configure the backtest

All configuration lives in the left panel:

| Control | What it does |
|---|---|
| **Date Range** | From / To dates for the backtest window |
| **Unit of Analysis** | `Alert` · `Case` · `Entity` — sets the aggregation level for all metrics |
| **Ground Truth** | What counts as a true positive: `SAR Filed` or a specific `Case Level` |
| **Label Mode** | `Formal Only` uses confirmed SARs; `Formal + Inferred` includes SAR-adjacent inferred labels. This is a **global toggle** — every metric on the screen updates when you switch it. |
| **Include suppressed alerts** | When checked, suppressed alerts count as rule misses |
| **Execution Fidelity** | `Simplified` runs a basic backtest; `Production` replicates the rule's actual batch cadence and lookback window |

### 3. Run the backtest

Click **Run Backtest**. A loading skeleton appears while results are computed (~1.5 s mock delay). Results populate all six sections of the main content area.

### 4. Read the results

Scrolling down through the main content area:

- **Label Composition** — horizontal bar showing the formal / inferred label split. In Formal Only mode the inferred segment dims with a strikethrough.
- **Absolute Performance** — six hero metric cards (Precision, Recall, F1, Alert Volume, SAR Hit Rate, False Positive Rate). In Formal + Inferred mode each card shows a secondary "formal only" value underneath.
- **Marginal Performance** — same six metrics but showing what this rule *uniquely contributes* when added to its peer group. Use the **taxonomy toggle** (L1 / L2 / L3 / Global) at the top-right of the section to change the peer group scope. A colour-coded delta row beneath the cards shows the change in green (improvement) or red (regression).
- **Alert Volume** — area chart of alerts, formal SARs, and inferred SARs over the backtest period. The inferred line only appears in Formal + Inferred mode.
- **ATL / BTL Analysis** — compares the population above and below the rule's threshold. Each side shows count, SAR rate, median transaction value, median alert score, and a distribution histogram.
- **Recommendations** — AI-generated suggestions for improving the rule. Each card shows a proposed change, rationale, confidence level, and a before/after metric comparison table. Click the chevron to expand the full evidence narrative.

### 5. Explore interactions

- **Toggle label mode** at any time — all sections animate and update simultaneously without re-running the backtest.
- **Switch taxonomy level** in the marginal section — metrics animate in/out and the contextual note updates to reflect the new peer group.
- **Hover a recommendation** card — the affected metric cards in the Absolute Performance section highlight with a violet border pulse.
- **Expand evidence** on any recommendation by clicking the chevron to reveal the full AI-generated evidence narrative.

## Project structure

```
src/
  types.ts                         TypeScript interfaces matching the data layer contract
  data/mockData.ts                 Realistic mock data (4 rules, 90-day series, 3 recommendations)
  App.tsx                          Page-level layout and global state
  index.css                        Tailwind config, Geist font imports, stage-glow effects
  components/
    ConfigPanel.tsx                Left sidebar with all configuration controls
    LabelCompositionBar.tsx        Formal / inferred label split bar
    AbsolutePerformance.tsx        Hero metric cards for absolute rule performance
    MarginalPerformance.tsx        Marginal metrics with taxonomy toggle and delta row
    VolumeChart.tsx                Alert volume area chart over time
    ATLBTLAnalysis.tsx             Above / below threshold population analysis
    RecommendationsPanel.tsx       AI recommendation cards with before/after comparisons
```

## Wiring to a real backend

The mock data in `src/data/mockData.ts` conforms to the `BacktestResult`, `Rule`, and `Recommendation` interfaces in `src/types.ts`. To connect a real API:

1. Replace the `setTimeout` calls in `App.tsx` `handleRunBacktest` with actual fetch calls.
2. The backtest endpoint should return both label modes (`formal` and `formal_inferred`) in a single response so the label toggle works client-side without re-fetching.
3. The recommendations endpoint can be called separately after the backtest completes — the UI already handles the async loading state with skeleton cards.
4. The "Apply in Rule Builder" button emits a `console.log` with the recommendation payload. Wire this to your rule builder navigation.
