# Investments Tracker Page - Implementation Plan

**Status:** Complete — All 4 phases shipped  
**Created:** 2026-04-09  
**Last Updated:** 2026-04-09

---

## 1. Overview

The Investments page provides a detailed, per-holding view of investment accounts. Each **investment holding** (a fund, ETF, individual stock, etc.) belongs to a parent **investment account** (a WealthSource with category `investment` or `pension`). Users manually enter monthly valuations for each holding, and the page surfaces performance trends, allocation breakdowns, and underperformance warnings.

### Key Principles
- Manual monthly entry model (consistent with the rest of the app)
- Investment accounts are existing WealthSources (category: `investment` | `pension`)
- Holdings are the new concept: individual funds/shares within an account
- The page adds unique value over Asset Tracker by showing **holding-level performance, allocation, and warnings**

---

## 2. Data Model

### 2.1 New Entity: `InvestmentHolding`

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Auto-generated |
| `name` | string | Display name (e.g., "Vanguard S&P 500 ETF") |
| `ticker` | string, nullable | Optional ticker symbol (e.g., "VUSA") |
| `type` | enum | `fund` \| `etf` \| `stock` \| `bond` \| `other` |
| `wealthSourceId` | UUID (FK) | Links to parent WealthSource (investment account) |
| `color` | string, nullable | Hex color for charts |
| `createdAt` | Date | Auto-generated |
| `updatedAt` | Date | Auto-generated |

**Relation:** ManyToOne -> WealthSource (an account has many holdings)

### 2.2 New Entity: `InvestmentSnapshot`

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Auto-generated |
| `holdingId` | UUID (FK) | Links to InvestmentHolding |
| `year` | number | Snapshot year |
| `month` | string | 3-char month (e.g., "Jan") - consistent with WealthSnapshot |
| `units` | decimal(14,4), nullable | Number of units/shares held (optional) |
| `costBasis` | decimal(12,2), nullable | Total amount invested to date (optional) |
| `value` | decimal(12,2) | Current market value |
| `createdAt` | Date | Auto-generated |
| `updatedAt` | Date | Auto-generated |

**Constraint:** UNIQUE(holdingId, year, month)  
**Relation:** ManyToOne -> InvestmentHolding

### 2.3 Entity Relationship Diagram

```
WealthSource (existing)          InvestmentHolding (new)         InvestmentSnapshot (new)
┌──────────────────────┐         ┌──────────────────────┐        ┌──────────────────────┐
│ id                   │────┐    │ id                   │───┐    │ id                   │
│ name                 │    │    │ name                 │   │    │ holdingId (FK)       │
│ category             │    └───>│ ticker               │   └───>│ year                 │
│ color                │  1:many │ type                 │ 1:many │ month                │
│                      │         │ wealthSourceId (FK)  │        │ units                │
└──────────────────────┘         │ color                │        │ costBasis            │
                                 └──────────────────────┘        │ value                │
                                                                 └──────────────────────┘
```

---

## 3. API Endpoints

### Investment Holdings
```
GET    /api/investments/holdings                 # List all holdings (with wealthSource relation)
POST   /api/investments/holdings                 # Create a holding
PUT    /api/investments/holdings/:id             # Update a holding
DELETE /api/investments/holdings/:id             # Delete holding (cascades snapshots)
```

### Investment Snapshots
```
GET    /api/investments/snapshots                # All snapshots (with holding relation)
GET    /api/investments/snapshots?holdingId=X    # Snapshots for a specific holding
POST   /api/investments/snapshots                # Create/update snapshot (upsert on holdingId+year+month)
DELETE /api/investments/snapshots/:id            # Delete a snapshot
```

### Backend Module Structure
```
backend/src/investments/
├── investments.module.ts
├── investments.controller.ts
├── investments.service.ts
├── entities/
│   ├── investment-holding.entity.ts
│   └── investment-snapshot.entity.ts
└── dto/
    ├── create-holding.dto.ts
    ├── update-holding.dto.ts
    ├── create-snapshot.dto.ts
    └── update-snapshot.dto.ts
```

---

## 4. Page Layout & Components

### 4.1 Page Structure (top to bottom)

```
┌─────────────────────────────────────────────────────────────────────┐
│  WARNINGS BAR (conditionally shown)                                 │
│  "VUSA has underperformed in 3 of the last 12 months..."           │
│  "FTSE Global All Cap has underperformed in 4 of the last 12..."   │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  HEADER                                                             │
│  "Investment Breakdown"    [Manage Holdings]  [Add/Update Values]   │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  SUMMARY CARDS                                                      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐              │
│  │ Total    │ │ Total    │ │ Monthly  │ │ Overall  │              │
│  │ Value    │ │ Gain/Loss│ │ Change   │ │ Return % │              │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘              │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  ACCOUNT CHARTS (one per investment account/WealthSource)           │
│                                                                     │
│  ┌─ Vanguard ISA ──────────────────────────────────────────────┐   │
│  │  Stacked area chart: each holding as a layer                │   │
│  │  X-axis: months, Y-axis: £ value                            │   │
│  │  Shows composition of account over time                     │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─ SIPP Pension ──────────────────────────────────────────────┐   │
│  │  Stacked area chart: each holding as a layer                │   │
│  │  X-axis: months, Y-axis: £ value                            │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  ALLOCATION PIE CHART (by holding type)                              │
│                                                                     │
│       ┌───────────────┐                                             │
│       │   Pie/Donut   │   Fund: 45%  |  ETF: 30%  |  Stock: 25%   │
│       │    Chart      │                                             │
│       └───────────────┘                                             │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  HOLDING PERFORMANCE CARDS                                          │
│  Period selector: [1M] [3M] [1Y] [5Y] [All]                        │
│                                                                     │
│  ┌─ VUSA (has ticker) ─────────────────────────────────────────┐   │
│  │ ┌─────────────────────────────────┐  Current: £18,500       │   │
│  │ │  TradingView Mini Chart Widget  │  Change: +£1,200 (+7%)  │   │
│  │ │  (live market data, no API key) │  Cost basis: £15,000    │   │
│  │ │  Period synced with selector    │  Return: +23.3%         │   │
│  │ └─────────────────────────────────┘  [Fund] [Vanguard ISA]  │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─ Bond Fund (no ticker) ─────────────────────────────────────┐   │
│  │ ┌─────────────────────────────────┐  Current: £4,200        │   │
│  │ │  Recharts LineChart (fallback)  │  Change: +£80 (+1.9%)   │   │
│  │ │  Uses your snapshot data        │  Cost basis: £4,000     │   │
│  │ │  Period synced with selector    │  Return: +5.0%          │   │
│  │ └─────────────────────────────────┘  [Bond] [SIPP Pension]  │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

### 4.2 Component Breakdown

```
frontend/src/components/investments/
├── InvestmentsPage.tsx              # Main page (replaces placeholder)
├── InvestmentWarnings.tsx           # Warning banner for underperformers
├── InvestmentSummaryCards.tsx       # Top-level stat cards
├── AccountChart.tsx                 # Stacked area chart per account
├── AllocationChart.tsx               # Pie/donut chart by holding type
├── HoldingPerformanceCard.tsx       # Individual holding card (widget or fallback chart)
├── TradingViewWidget.tsx            # TradingView mini chart embed wrapper
├── ManageHoldingsModal.tsx          # CRUD modal for holdings
├── AddSnapshotModal.tsx             # Modal to enter monthly values
└── types.ts                         # TypeScript interfaces
```

### 4.3 Component Details

#### InvestmentWarnings
- Scans the last 12 months of snapshots for each holding
- If a holding's value decreased in 3+ months (excluding months where deposits were made, detected by costBasis increasing), show a warning
- Warning format: `"{Holding name} has declined in value in {N} of the last 12 months. Review whether growth is driven by deposits rather than performance."`
- Amber warning styling, dismissible per session

#### AccountChart (one per WealthSource)
- Recharts stacked AreaChart (consistent with WealthChart pattern)
- Each holding within the account is a stacked layer
- Clickable legend to focus/isolate holdings (same pattern as WealthChart)
- Title shows account name + total current value
- ResponsiveContainer for sizing

#### HoldingPerformanceCard
- Period selector shared across all cards: 1M, 3M (quarter), 1Y, 5Y, All
- **Hybrid approach:** chart source depends on whether the holding has a ticker
- Each card contains:
  - **With ticker:** TradingView mini chart widget showing live market data
  - **Without ticker:** Recharts LineChart fallback using your snapshot data
  - Current value, absolute change, percentage change (always from your snapshot data)
  - Cost basis and total return (if costBasis data exists)
  - Holding type badge (Fund, ETF, Stock, etc.)
  - Parent account badge
- Cards arranged in a responsive grid (1-2 columns, wider to accommodate chart + stats side by side)

#### TradingViewWidget
- Wraps TradingView's lightweight embeddable mini chart (`MiniWidget`)
- Free for personal use, no API key required
- Props: `ticker` (string), `period` (mapped to TradingView's dateRange: "1M", "3M", "12M", "60M")
- Rendered inside an iframe via TradingView's embed script
- Styled to match the app (dark/light theme, rounded corners)
- Handles load errors gracefully (falls back to "chart unavailable" message)
- Note: Requires internet connectivity; the rest of the app works offline but these widgets won't

#### ManageHoldingsModal
- Lists all holdings grouped by account
- Add new holding: name, ticker (optional), type dropdown, parent account dropdown, color picker
- Edit/delete existing holdings
- Follows existing modal patterns (WealthSourcesModal, BudgetSourcesModal)

#### AddSnapshotModal
- Select month/year (defaulting to current)
- Shows all holdings with input fields for: value (required), units (optional), costBasis (optional)
- Groups holdings by account for clarity
- Upsert behaviour: if snapshot exists for that holding+month+year, update it
- Follows AddEntryModal pattern

---

## 5. Performance Warning Indicators

All indicators use **deposit-adjusted performance** where possible: `performance = value_change - costBasis_change` to strip out the effect of new money being added.

### Indicator 1: Deposit-Masked Growth (Critical)
> "Growth in {holding} over the last 12 months is primarily driven by deposits, not returns."

- **Trigger:** Over a rolling 12-month window, more than 75% of the total value increase is attributable to deposits (costBasis increase) rather than investment return
- **Why it matters:** The headline value is going up, but the investment itself is flat or losing money. This is the most dangerous blind spot for manual trackers.
- **Requires:** costBasis data. If unavailable, indicator is skipped for that holding.

### Indicator 2: Consecutive Negative Return (Warning)
> "{Holding} has had negative real returns for 3 consecutive months."

- **Trigger:** Deposit-adjusted performance is negative for 3+ consecutive months
- **Why it matters:** A single bad month is normal. Three in a row suggests a trend rather than market noise. More actionable than counting scattered bad months.

### Indicator 3: Underwater Position (Critical)
> "{Holding} is currently worth less than the total amount invested."

- **Trigger:** Current value < costBasis (i.e., you're in the red overall)
- **Why it matters:** Direct, unmistakable signal. The user has lost money on this position in absolute terms.
- **Requires:** costBasis data.

### Indicator 4: Stagnant Holding (Info)
> "{Holding} has shown less than 1% real growth over the last 12 months."

- **Trigger:** Deposit-adjusted return over 12 months is between -1% and +1%
- **Why it matters:** Not losing money, but not making any either. Opportunity cost -- the money could be in something better. Lower severity than the others.

### Indicator 5: Significant Drawdown (Warning)
> "{Holding} has dropped {X}% from its peak value in {month}."

- **Trigger:** Current value is more than 15% below the highest recorded value (deposit-adjusted)
- **Why it matters:** Highlights holdings that were once doing well but have fallen substantially. Useful even if the position is still above costBasis overall.

### Severity Levels & Display
| Level | Colour | Indicators |
|-------|--------|------------|
| Critical | Red | Deposit-Masked Growth, Underwater Position |
| Warning | Amber | Consecutive Negative Return, Significant Drawdown |
| Info | Blue | Stagnant Holding |

- Warnings are dismissible per session (not permanently)
- Grouped by severity at the top of the page
- Each warning links/scrolls to the relevant holding card

### Edge Cases
- Holdings with < 6 months of data: no warnings generated (insufficient data)
- Holdings without costBasis data: only Consecutive Negative Return (using raw value change) and Significant Drawdown can fire. Others are skipped with no fallback.
- Months with no snapshot: gap months are skipped, consecutive counts reset at gaps

---

## 6. Frontend Data Flow

### React Query Hooks (new in hooks/queries.ts)
```typescript
useInvestmentHoldings()     // GET /api/investments/holdings
useInvestmentSnapshots()    // GET /api/investments/snapshots
```

### Data Processing (new in utils/investmentUtils.ts)
```typescript
// Group holdings by account (wealthSourceId)
groupHoldingsByAccount(holdings, wealthSources)

// Build chart data for a specific account over time
buildAccountChartData(holdings, snapshots)

// Calculate performance for a holding over a period
calculateHoldingPerformance(snapshots, period)

// Detect underperforming holdings
detectUnderperformers(holdings, snapshots): Warning[]
```

---

## 7. Implementation Phases

### Phase 1: Backend Foundation
1. Create `InvestmentHolding` entity
2. Create `InvestmentSnapshot` entity
3. Create DTOs with validation
4. Create `InvestmentsModule` with controller and service
5. Implement WealthSource auto-roll-up (sum holdings → update WealthSnapshot on snapshot save)
6. Register module in `AppModule`
7. Update backup service to include investment data in export/import

### Phase 2: Frontend - Core Page
1. Create TypeScript types in `investments/types.ts`
2. Add React Query hooks
3. Build `ManageHoldingsModal` (so users can create holdings)
4. Build `AddSnapshotModal` (so users can enter values)
5. Replace placeholder `InvestmentsPage` with page shell + header + modals

### Phase 3: Frontend - Charts & Visualisation
1. Build `InvestmentSummaryCards`
2. Build `AccountChart` (stacked area per account)
3. Build `AllocationChart` (pie/donut with type/account toggle)
4. Build `TradingViewWidget` wrapper component
5. Build `HoldingPerformanceCard` (TradingView widget for holdings with ticker, Recharts fallback for those without)
6. Create `investmentUtils.ts` data processing functions
7. Mark investment-type WealthSources as read-only in Asset Tracker's `AddEntryModal`

### Phase 4: Warnings & Polish ✅
1. Implement 5-tier warning detection logic in `investmentUtils.ts` (deposit-masked, consecutive-negative, underwater, stagnant, drawdown)
2. Build `InvestmentWarnings` component (collapsible, dismissible per session, severity badges, scroll-to-holding)
3. Polish: loading states, empty states with contextual guidance, backend error banner
4. Backup/restore covers investment data (backend Phase 1)

---

## 8. WealthSource Auto-Roll-Up (Architecture Change)

Investment holdings become the **source of truth** for investment account totals. When a user enters holding snapshots on the Investments page, the corresponding WealthSource value in Asset Tracker is automatically calculated as the sum of its holdings.

### How It Works
1. User enters monthly values per holding on the Investments page
2. Backend calculates the total for each WealthSource (sum of its holdings' values for that month)
3. The WealthSnapshot `values` map for that source is auto-updated (or a new snapshot is created/updated)
4. Asset Tracker reflects the rolled-up totals without any manual entry for investment-type sources

### Implementation Detail
- When an investment snapshot is created/updated, the backend sums all holding values for that `wealthSourceId + year + month` and writes the total to the corresponding WealthSnapshot
- Investment-type WealthSources are marked as read-only in the AddEntryModal on Asset Tracker (greyed out with a note: "Managed from Investments page")
- Cash and pension sources without holdings continue to be entered manually on Asset Tracker as before
- If a pension source has holdings linked to it, it also becomes auto-managed

### Benefits
- Single point of data entry per investment (no duplication)
- Totals always in sync -- no reconciliation needed
- Asset Tracker charts still work as before (they read WealthSnapshot data, which is now auto-populated)

---

## 9. Decisions Made

| # | Decision | Date |
|---|----------|------|
| 1 | Hybrid TradingView + Recharts fallback for holding charts | 2026-04-09 |
| 2 | Units and costBasis are optional fields | 2026-04-09 |
| 3 | Shared/global period selector across all holding cards | 2026-04-09 |
| 4 | Include allocation pie chart above individual holding breakdowns | 2026-04-09 |
| 5 | Holdings auto-roll-up to WealthSource totals (no separate entry in Asset Tracker) | 2026-04-09 |
| 6 | Auto-assign colours with manual override | 2026-04-09 |
| 7 | Five-tier warning system (see Section 5) replacing simple 3/12 threshold | 2026-04-09 |
| 8 | Single field for TradingView ticker (full symbol e.g. `LSE:VUSA`) | 2026-04-09 |
| 9 | Allocation pie chart grouped by holding type (fund/ETF/stock/bond), no toggle | 2026-04-09 |
| 10 | WealthSource roll-up is immediate/synchronous on snapshot save | 2026-04-09 |

---

## 10. Open Questions for Discussion

No open questions -- all decisions made. Ready for implementation.
