# Session Handover — 25 April 2026

## What this project is

Personal wealth tracker — NestJS 11 backend + React 19 frontend, deployed as a single Docker container on an Unraid server. SQLite locally, PostgreSQL 15 in production. `synchronize: true` is on (schema auto-applies on restart). Manual monthly data entry model. One user.

Run locally with:
```bash
npm run dev   # from repo root — starts backend (port 3000) + frontend (port 5173) concurrently
```

---

## What was done this session

### Structural cleanup — phases completed

All work is tracked in `docs/plans/structural-cleanup.md`. Five of nine phases are now complete:

| Phase | Status | Summary |
|---|---|---|
| 1 — Money at API boundary | **complete** | `decimalTransformer` on all 9 monetary entities; all frontend `Number()` API-cast removed |
| 2 — Entity timestamps | **complete** | `@CreateDateColumn`/`@UpdateDateColumn` on 4 budget entities |
| 3 — Backup correctness | **complete** | All 12 entities in clearAllData/insertBackupData; backup version bumped to 2 |
| 5 — Frontend logging | **complete** | `logger.ts` wrapper; all `console.*` replaced except `ErrorBoundary` |
| 7 — Tailwind class ordering | **complete** | `prettier` + `prettier-plugin-tailwindcss` installed; all 79 files formatted; format-on-save wired in `.vscode/settings.json` |

### New files created this session

- `backend/src/common/transformers/decimal.transformer.ts` — shared TypeORM `ValueTransformer` for decimal columns
- `backend/src/common/filters/http-exception.filter.ts` — global exception filter (structured JSON errors, NestJS logger)
- `frontend/src/utils/logger.ts` — dev-only logging wrapper (`import.meta.env.DEV`)
- `frontend/src/hooks/queries.ts` — all TanStack Query hooks; single source of truth for server state
- `frontend/.prettierrc` — prettier config with tailwind plugin
- `.vscode/settings.json` — format-on-save with prettier
- `.vscode/extensions.json` — recommends `esbenp.prettier-vscode`
- `CLAUDE.md` — project conventions reference (checked in to repo)
- `docs/plans/structural-cleanup.md` — full 9-phase cleanup plan with status markers

### Key architectural changes

**Backend**
- Every monetary entity column now has `transformer: decimalTransformer` — Postgres `numeric` columns return as JS `number`, not string
- `GlobalExceptionFilter` registered in `main.ts` — all errors return `{ statusCode, message, path, timestamp }`
- CORS now conditional on `CORS_ORIGIN` env var (not open by default)
- Backup service covers all 12 entities in correct dependency order; version 2 format

**Frontend**
- TanStack Query (`QueryClientProvider` in `main.tsx`) wraps the whole app; `staleTime: 30_000`, `retry: 1`
- All server state goes through hooks in `hooks/queries.ts` — no more `useState + useEffect + fetch`
- No more `Number(apiValue)` casts anywhere — transformer handles it at the ORM boundary
- `logger.ts` used instead of `console.*` in all components (suppressed in prod builds)

---

## What still needs doing

### Remaining structural cleanup phases

**Phase 6 — BudgetSourcesModal split** (pending)
`frontend/src/components/budget/BudgetSourcesModal.tsx` is 619 lines managing incomes, outgoings, and accounts in one component. Split into separate components under `budget/sources/`. Medium UI risk — test all CRUD paths thoroughly after splitting.

**Phase 8 — Migrate off `synchronize: true`** (pending — needs dedicated session)
Generate baseline TypeORM migration, disable `synchronize` in prod, update Docker entrypoint to run `migration:run` on startup. Highest risk item in the plan — needs a full backup first and a dry run on a copy of prod data. Do not squeeze this in alongside other work.

**Phase 4 — Month storage as integer** (deferred)
Currently stored as 3-letter string (`'Jan'`). Deferred until it causes an actual bug.

### Manual browser testing still outstanding for Phase 1

The API-level checks all passed (all monetary fields confirmed returning as `number`). These still need eyes in a browser:
- Burndown chart renders with a curve (not flat/empty) for liabilities with interest rates
- Credit card utilisation bar appears and percentage looks correct
- Overpayment plan modal shows projected payoff without NaN values
- NaN scan: open browser devtools console on each page and look for warnings while navigating
- Backup round-trip: export → inspect JSON (monetary fields should be numbers, not strings) → re-import → data matches

---

## Test commands

```bash
# Backend unit + backup + burndown tests (20 tests)
cd backend && npx jest

# Backend e2e smoke tests (4 tests)
cd backend && npm run test:e2e

# TypeScript checks
cd backend && npx tsc --noEmit
cd frontend && npx tsc --noEmit

# Format frontend on demand
cd frontend && npx prettier --write "src/**/*.{ts,tsx}"
```

---

## Key conventions (abbreviated — full version in CLAUDE.md)

- **Money columns**: always add `transformer: decimalTransformer` from `common/transformers/decimal.transformer.ts`. Never scatter `Number()` casts in the frontend.
- **New domain modules**: follow the 8-step checklist in `CLAUDE.md` — entity → DTO → service → controller → module → frontend API client → TanStack Query hooks → backup service update.
- **Server state**: TanStack Query hooks in `hooks/queries.ts` only. No `useState + useEffect + fetch`.
- **Logging**: `logger` from `frontend/src/utils/logger.ts`. Never `console.*` in components.
- **Error handling**: NestJS exceptions only (`NotFoundException`, `BadRequestException`, etc.). Never plain `Error`.
- **Commits/pushes**: never without explicit approval.
- **`synchronize: true` is live**: new columns must be nullable or have a default. Never rename/drop without a migration plan.

---

## Decisions made / things to remember

- `BudgetSourcesModal` still uses `useState + useEffect + fetch` internally (predates the TanStack Query refactor). It works but is inconsistent. Phase 6 will fix this as part of the split.
- The `month` field on all snapshot entities is still a 3-letter string (`'Jan'`). Sorting works via array lookup. Phase 4 deferred.
- Backup version 2 format groups data as `{ wealth: {...}, budget: {...}, investments: {...}, liabilities: {...} }`. Version 1 imports are rejected.
- `.vscode/settings.json` sets format-on-save — requires the `esbenp.prettier-vscode` VS Code extension.
