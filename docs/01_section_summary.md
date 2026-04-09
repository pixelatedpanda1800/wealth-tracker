# Section: Summary

**Nav Label:** Summary  
**Nav Icon:** LayoutDashboard  
**Route ID:** `summary`  
**Current Status:** 🔴 Placeholder — not yet implemented

---

## Purpose

The Summary page is intended to be the **first thing a user sees** — a single-screen financial health dashboard that brings together data from all other sections. Its role is to answer the question:

> _"How am I doing financially, right now, at a glance?"_

It should replace the need to navigate to individual sections just to get an overall status. Think of it as the "home base" of the application.

---

## Intended Functionality

| Area | What it should show |
|------|---------------------|
| **Net Worth** | Total current wealth (cash + investments + pension), with month-on-month change |
| **Budget health** | Current month income vs total outgoings; whether the user is in surplus or deficit |
| **Savings rate** | Percentage of income being directed to savings/investments |
| **Top-level assets** | Breakdown of total wealth by category (cash / investments / pension) |
| **Liabilities** | Total outstanding liabilities and net worth after deductions (when Liabilities section is built) |
| **Upcoming payments** | Payment dates for outgoings entered with a `paymentDate` (next 7–14 days) |
| **Projection snapshot** | High-level chart of projected total wealth to a meaningful horizon (e.g., 5 years) |

---

## Data Sources

All data required for this page already exists in the backend; it is a matter of aggregation:

- `GET /api/wealth` → latest snapshot for net worth cards
- `GET /api/wealth/sources` → category breakdown
- `GET /api/budget/incomes` → total income
- `GET /api/budget/outgoings` → outgoings for budget health and upcoming payments

---

## Current Implementation State

`SummaryPage.tsx` is a static stub containing only a "Coming Soon" placeholder. No API calls, no child components, no state.

---

## Suggestions

1. **Define the data hierarchy for this page before building** — this should be the primary "executive view" so it needs input on what KPIs matter most to the user (net worth prioritised? savings rate? budget remaining?).

2. **Reuse existing child components** — `StatCard` (from `AssetTracker.tsx`) and `SummaryCard` (from `MonthlyBudgetPage.tsx`) are already built to a high standard and should be extracted into shared components and reused here rather than duplicated.

3. **Consider making this the default landing page** — currently the app defaults to `'assets'` on load. Once the Summary page is built, it would be a better default as it provides the broadest overview. The default is set in `App.tsx` line 14.

4. **Do not overload it** — resist adding every metric. Aim for 6–8 KPI cards + 1 chart. Navigation to the detailed sections should handle the rest.
