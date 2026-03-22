# Section: Asset Tracker

**Nav Label:** Asset Tracker  
**Nav Icon:** Gem  
**Route ID:** `assets`  
**Current Status:** 🟢 Fully implemented — the most complete section of the application

---

## Purpose

The Asset Tracker is the **net worth tracking core** of the application. Its role is to answer:

> _"What is my total wealth today, how has it grown over time, and where is it headed?"_

It operates on a **monthly snapshot model** — the user records the value of each of their named wealth sources once per month. The application then processes those snapshots into charts, history grids, and forward projections.

---

## Functionality

### KPI Summary Cards (4 cards)

| Card | Value |
|------|-------|
| Total Wealth | Sum of all sources in the latest real (non-estimated) snapshot |
| Cash | Sum of sources categorised as `cash` |
| Investments | Sum of sources categorised as `investment` |
| Pension | Sum of sources categorised as `pension` |

Each card shows a percentage trend vs. the previous real snapshot (month-on-month by default). Positive trends display in green; negative in red.

---

### Wealth Sources

Wealth is tracked against named **sources** (e.g., "Barclays Current Account", "Vanguard ISA", "Employer Pension"). Each source has:

- **Name** — free text label
- **Category** — `cash`, `investment`, or `pension`
- **Colour** — user-assigned hex colour for chart differentiation

Sources are managed via the **Manage Sources** modal (`WealthSourcesModal.tsx`): create, rename, recolour, and delete.

> Sources can be deleted even if snapshots reference them — the referenced values become orphaned (no display name, excluded from totals). This should be handled more gracefully.

---

### Wealth Snapshots

A snapshot is a single record tying a `year` + `month` to a map of `{ sourceId → value }`. The user adds or updates snapshots via the **Add/Update Entry** modal (`AddEntryModal.tsx`).

- One snapshot per month (the service performs an upsert — existing month/year combos are updated, not duplicated).
- Partial snapshots are supported — not every source needs a value every month.

---

### Source Growth Chart (`WealthChart`)

A **stacked area chart** (Recharts) showing the value of each source over the visible time window.

**View modes:**

| Mode | Window shown |
|------|-------------|
| Monthly | Last 12 months (trailing) |
| Quarterly | Last 8 financial quarters (UK: Q1=Apr–Jun) |
| Yearly | Last 5 financial years |

**Gap filling:** Months without data are filled with the most recent known value and marked as `isEstimate`. Estimated values appear as lighter/italic in the tooltip.

**Legend interaction:** Clicking a legend entry focuses that source; all others are dimmed. Clicking again deselects.

---

### History Grid (`HistoryGrid`)

A tabular view of the same data as the chart — rows are time periods, columns are each source + a total column. Estimated entries are visually distinguished from real data.

---

### Projection Chart (`ProjectionChart`)

A **forward-looking projection chart** showing estimated future wealth based on recent trend.

**Algorithm (in `dataUtils.ts → calculateProjections`):**
1. Process the last 12 months of actual data
2. Calculate monthly change for each period
3. Take the **median** of those changes (to filter outliers such as one-off lump-sum deposits)
4. Project forward from the latest known value using `latestValue + (medianMonthlyGrowth × monthsAhead)`

**Projection timelines:**

| Timeline | History shown | Future shown |
|----------|--------------|-------------|
| Monthly | 2 months back | 12 months ahead |
| Quarterly | 1 quarter back | 20 quarters (5 years) ahead |
| Yearly | 1 year back | 10 years ahead |

Can also be scoped to a single wealth source (not just total).

---

## Data Flow

```
API (GET /api/wealth + /api/wealth/sources)
  → rawSnapshots + sources state (in AssetTracker)
  → processWealthData() [dataUtils.ts]
  → processed WealthEntry[] (with cash/investment/pension sums)
  → WealthChart, HistoryGrid
  → calculateProjections() [dataUtils.ts]
  → ProjectionChart
```

---

## Suggestions

1. **Source deletion does not clean up snapshot values** — when a wealth source is deleted, historical snapshot values tied to that source ID remain stored in the `values` JSON blob on each `WealthSnapshot`. They are simply ignored in rendering. This is silent data loss — the user has no indication that historical values are orphaned. A warning on deletion, or a soft-delete approach for sources with historical data, would improve data integrity.

2. **The "vs last month" label on KPI cards is always shown** — even when `viewMode` is quarterly or yearly. The trend calculation uses the two most recent real snapshots regardless of the selected chart view mode. The card label should reflect the actual comparison period.

3. **Snapshot upsert via month+year key** — only one snapshot per month is allowed (enforced at service level). This is the correct design. It is worth documenting explicitly as a constraint since the UI modal offers "Add/Update" which implies this behaviour.

4. **Chart does not distinguish estimated vs real data visually on the area** — estimated data fills gaps with the last known value. While the tooltip does label estimated values, the chart area itself has no visual difference between a real reading and a filled estimate. A dashed line or reduced opacity for estimated segments would improve clarity.

5. **Financial year quarters are UK-aligned (Apr–Jun as Q1)** — this is correct for the UK market but should be a configurable setting if the application is ever shared with users in other regions. The quarter logic lives entirely in `dataUtils.ts` and would be straightforward to parameterise.

6. **Projection uses a linear model only** — the median monthly growth approach is robust for short-to-medium projections but will produce unrealistic results for assets with highly variable returns (e.g., equity investments). A note in the UI that projections assume consistent recent trends would manage user expectations.
