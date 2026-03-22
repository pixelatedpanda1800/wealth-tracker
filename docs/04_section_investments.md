# Section: Investments

**Nav Label:** Investments  
**Nav Icon:** PieChart  
**Route ID:** `investments`  
**Current Status:** 🔴 Placeholder — not yet implemented

---

## Purpose

The Investments section is intended to provide a **per-holding breakdown** of investment assets. Its role is to answer:

> _"What specific investments do I hold, what are they worth individually, and how are they performing?"_

This section sits one level below the Asset Tracker. While Asset Tracker tracks the total value of each investment *source* (e.g., "Vanguard ISA" as a whole), the Investments section should track the individual *holdings* within that source (e.g., "VUSA – Vanguard S&P 500 ETF", "VWRL – Vanguard All-World ETF").

---

## Relationship to Asset Tracker

| Asset Tracker | Investments |
|--------------|-------------|
| Tracks total value of named sources (e.g., "Vanguard ISA = £25,000") | Tracks individual holdings within sources (e.g., "VUSA = £18,500, VWRL = £6,500") |
| Sources categorised as `investment` or `pension` would be the parent | Holdings are children of a source |
| Monthly snapshot frequency | Could be real-time, on-demand, or also monthly snapshot |

It is not required that the totals reconcile perfectly (i.e., the sum of holdings does not have to equal the Asset Tracker source value) — but a reconciliation indicator would be useful.

---

## Potential Features

| Feature | Description |
|---------|-------------|
| Holding list | Name, ticker/type, current value, cost basis |
| Gain/Loss tracking | Current value vs purchase cost; total and percentage return |
| Allocation breakdown | What % of investment portfolio is in each holding / asset class |
| Pie or donut chart | Visual split of the investment portfolio |
| Performance over time | Line chart of individual holding values if snapshot history is kept |
| Link to wealth source | Holdings are nested under a parent investment wealth source |

---

## Current Implementation State

`InvestmentsPage.tsx` is a static stub containing only a "Detailed trackers per investment will be available here" placeholder. No backend entities, services, or API endpoints exist for investment holdings.

---

## Suggestions

1. **Define the data model before building** — the key decision is whether to track holdings at a snapshot (point-in-time) level like the Asset Tracker, or in real-time via price feeds. Given the self-hosted personal nature of the app, a manual entry model (similar to wealth snapshots) is the most realistic starting point.

2. **Proposed minimal data model:**
   ```
   InvestmentHolding: {
     id, name, ticker?, parentWealthSourceId,
     units?, costBasis, currentValue, lastUpdated
   }
   ```

3. **Consider whether this page should focus on ISAs, pensions, or all investment types** — the Asset Tracker already treats pensions as a separate category. The Investments section might be most valuable if it focuses on ISA/GIA holdings where individual holding tracking adds real insight.

4. **This section should not duplicate the Asset Tracker chart** — the Investments page should add unique value (holding-level breakdown, gain/loss) rather than replicate the wealth growth charts already shown on the Asset Tracker.

5. **An allocation/diversification view would add significant value** — showing the split between equities, bonds, property, etc. across all holdings is functionality that no other section currently provides.
