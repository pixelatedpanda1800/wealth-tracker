# WealthTracker — Application Overview & Architecture Review

> **Review Date:** March 2026  
> **Version:** 0.2  
> **Scope:** Read-only review — no code changes made. All items are suggestions for future action.

---

## Application Purpose

WealthTracker is a **self-hosted, personal finance management application** designed for a single user (or household) to maintain a complete, real-time picture of their financial health. It consolidates three distinct financial views into one interface:

1. **Asset/Wealth tracking** — monitor net worth across multiple asset types over time
2. **Monthly budgeting** — plan and categorise all income and expenditure each month
3. **Backup/restore** — ensure data durability with portable JSON snapshots

The application is explicitly a *personal* tool (not multi-tenant or SaaS) and is designed for self-hosting, including a ready-made Unraid Community Applications template.

---

## Core Objectives

| # | Objective |
|---|-----------|
| 1 | Allow a user to log their total net wealth by month across named sources (cash, investment, pension) |
| 2 | Visualise wealth growth historically (monthly/quarterly/yearly) and project it forward |
| 3 | Plan a monthly budget by capturing all income streams and categorised outgoings |
| 4 | Allocate income to named bank accounts and spending "pots" within those accounts |
| 5 | Provide a single consolidated Summary view across all financial data (planned, not yet implemented) |
| 6 | Track liabilities separately from assets (planned, not yet implemented) |
| 7 | Track investments at a per-holding level (planned, not yet implemented) |
| 8 | Allow the entire dataset to be exported and restored via a versioned JSON backup |

---

## Technology Stack

### Frontend
| Layer | Technology | Notes |
|-------|-----------|-------|
| Framework | React 18 | Single Page Application |
| Language | TypeScript | Strong typing throughout |
| Build tool | Vite | Dev server + bundler |
| Styling | Tailwind CSS (utility classes via `clsx`) | Applied directly in JSX, no CSS modules |
| Charts | Recharts | AreaChart, stacked by source |
| HTTP client | Axios (via `api.ts`) | Single file, no external state manager |
| Icons | Lucide React | Consistent icon set |

### Backend
| Layer | Technology | Notes |
|-------|-----------|-------|
| Framework | NestJS (Node.js) | Modular, dependency-injected |
| Language | TypeScript | Shared language with frontend |
| ORM | TypeORM | Code-first entity definitions |
| Database | SQLite (dev) / PostgreSQL (production) | Dual-mode via env vars |
| Static serving | `@nestjs/serve-static` | Backend serves the built frontend bundle |
| Config | `@nestjs/config` / `.env` | Environment-based configuration |

### Deployment
| Mode | Description |
|------|-------------|
| Docker (single container) | `Dockerfile` + `supervisord.conf` run both NestJS and PostgreSQL in one container |
| Docker Compose | `docker-compose.yml` for orchestrated multi-container local use |
| Unraid | `wealth-tracker.xml` Unraid Community Applications template |
| Local dev | `dev.sh` / `dev.ps1` scripts; SQLite fallback when no DB env vars set |

---

## Project Structure

```
wealth-tracker/
├── frontend/                  # Vite + React SPA
│   └── src/
│       ├── App.tsx            # Root router (switch on PageId)
│       ├── api.ts             # All API calls (single file)
│       ├── utils/
│       │   ├── dataUtils.ts   # Data processing & projection logic
│       │   └── constants.ts   # MONTHS array
│       └── components/
│           ├── Layout.tsx     # Shell (sidebar + topbar)
│           ├── Sidebar.tsx    # Navigation
│           ├── TopBar.tsx     # Header bar (user type toggle)
│           ├── ErrorBoundary.tsx
│           ├── AssetTracker.tsx      # Page: Asset Tracker
│           ├── SummaryPage.tsx       # Page: Summary (stub)
│           ├── InvestmentsPage.tsx   # Page: Investments (stub)
│           ├── LiabilitiesPage.tsx   # Page: Liabilities (stub)
│           ├── MonthlyBudgetPage.tsx # Page: Monthly Budget
│           ├── BackupPage.tsx        # Page: Backup & Restore
│           ├── WealthChart.tsx       # Stacked area chart
│           ├── ProjectionChart.tsx   # Forward projection chart
│           ├── HistoryGrid.tsx       # Tabular history
│           ├── AddEntryModal.tsx     # Modal: add/edit wealth snapshot
│           ├── WealthSourcesModal.tsx# Modal: manage wealth sources
│           └── budget/              # Budget sub-components
│               ├── IncomeSection.tsx
│               ├── OutgoingsSection.tsx
│               ├── SavingsSection.tsx
│               ├── BudgetAllocationTab.tsx
│               ├── BudgetSourcesModal.tsx
│               ├── ManageAccountsModal.tsx
│               ├── AllocationModal.tsx
│               ├── DocumentationTab.tsx
│               └── types.ts
│
└── backend/                   # NestJS API
    └── src/
        ├── main.ts            # Bootstrap, CORS, global prefix
        ├── app.module.ts      # Root module, DB config
        ├── wealth/            # Wealth module
        │   ├── wealth-snapshot.entity.ts
        │   ├── wealth-source.entity.ts
        │   ├── wealth.service.ts
        │   ├── wealth.controller.ts
        │   └── wealth.module.ts
        ├── budget/            # Budget module
        │   ├── entities/
        │   │   ├── income-source.entity.ts
        │   │   ├── outgoing-source.entity.ts
        │   │   ├── account.entity.ts
        │   │   └── allocation.entity.ts
        │   ├── budget.service.ts
        │   ├── budget.controller.ts
        │   └── budget.module.ts
        └── backup/            # Backup module
            ├── backup.service.ts
            ├── backup.controller.ts
            └── backup.module.ts
```

---

## Data Model Summary

```
WealthSource        (id, name, category[cash|investment|pension], color)
WealthSnapshot      (id, year, month, values: JSON<sourceId→amount>)

IncomeSource        (id, name, category, amount)
OutgoingSource      (id, name, type[non-negotiable|required|optional|savings],
                    frequency[monthly|annual], amount, paymentDate, notes, wealthSourceId)

Account             (id, name, category[non-negotiable|required|optional|savings|spending],
                    color, allocatedAmount)
Allocation          (id, description, amount, accountId → Account)
```

---

## Architectural Suggestions

> _These are architectural observations. Some have been resolved._

### High Priority

1. ✅ **[Resolved in v0.2] `synchronize: true` in production** — `app.module.ts` uses TypeORM's `synchronize: true` in both SQLite and PostgreSQL modes. In a real (non-dev) PostgreSQL environment this auto-applies schema changes on startup and can cause data loss if an entity changes. Migrations should replace `synchronize` for the PostgreSQL path.

2. **No authentication or access control** — The API has no auth layer (no JWT, session, or API key). Anyone who can reach port 3000 has full read/write access to all financial data. Given the sensitive nature of the data, even a simple single-user password/token guard would be a meaningful improvement.

3. ✅ **[Resolved in v0.2] Backup import uses a merge strategy** — Backup import now completely overwrites (clears) existing application data. A revert system stores the single prior state, which resolves previous issues with orphaned records accumulating.

4. **Three stub pages** — `SummaryPage`, `InvestmentsPage`, and `LiabilitiesPage` are all empty placeholder components. Their backend counterparts (entities, services) do not yet exist either. These should be prioritised once the requirements for each are defined (see individual section docs).

### Medium Priority

5. **`api.ts` is a single flat file** — All API calls (wealth, budget, backup) live in one 200-line file. As the application grows, this should be split into domain modules (e.g., `api/wealth.ts`, `api/budget.ts`, `api/backup.ts`) to improve maintainability.

6. **Month array duplicated** — The ordered `months` array exists in both `wealth.service.ts` (backend) and `constants.ts` (frontend). A single source of truth (or at minimum a comment linking them) would avoid drift.

7. **Currency hardcoded as GBP (£)** — The pound sterling symbol is embedded in many component JSX strings. If multi-currency support is ever required, this will need a systematic refactor. A currency configuration option should be considered early.

8. **`userType` state exists but is unused** — `App.tsx` holds a `userType` ('live' | other) state passed down to `Layout` but no component currently reads or acts on it. This appears to be scaffolding for a future feature (e.g., demo/live mode). It should either be implemented or removed to reduce dead-code confusion.

9. ✅ **[Resolved in v0.2] No loading/error state on Budget Allocation tab** — `BudgetAllocationTab.tsx` silently swallows fetch errors (`console.error` only). The pattern used in `MonthlyBudgetPage.tsx` (loading spinner, error banner) is not applied here consistently.

10. ✅ **[Resolved in v0.2] `SpendingSection.tsx` is in the budget folder** — A `SpendingSection` component exists in `frontend/src/components/budget/` but is not referenced from any page. This may be dead code or an unfinished feature that should be tracked.

### Lower Priority

11. **Docker single-container architecture** — Running PostgreSQL and NestJS in the same container via `supervisord` is convenient for self-hosting but is non-standard. It couples the DB process lifecycle to the app process. A docker-compose deployment is already available as an alternative and is preferable for reliability.

12. **No test coverage** — A `test/` directory exists in the backend with the NestJS scaffold test, but contains only the auto-generated spec. No domain logic is tested. The projection calculations in `dataUtils.ts` in particular would benefit from unit tests given their complexity.

13. ✅ **[Resolved in v0.2] `exportData` / `importData` (CSV) may be superseded** — `api.ts` and `wealth.service.ts` both contain CSV import/export endpoints that predate the JSON backup system. The relationship between CSV and JSON backup should be clarified and any redundancy removed.

14. **Revert state persistence** — The newly added `.backup-revert.json` file is currently saved to the local working directory. In a Docker/Unraid deployment, this file will be lost if the container restarts before the user has a chance to revert. This file should be stored in a persistent mounted volume (e.g., alongside the SQLite db) or inside a dedicated `RevertState` database table to guarantee durability.
