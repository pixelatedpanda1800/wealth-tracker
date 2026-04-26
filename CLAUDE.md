# Wealth Tracker — Codebase Notes

Personal wealth tracking app: manually-entered monthly snapshots of cash, investments, and pensions, plus a budgeting module for incomes / outgoings / account allocations.

## Deployment context

**Live deployment runs in Docker on an Unraid server.** The Docker build and container runtime must keep working — any change to `Dockerfile`, `docker-entrypoint.sh`, `supervisord.conf`, or environment-variable handling needs to be tested for production-readiness, not just local dev.

- Production image: single container with NestJS backend + built React frontend + embedded PostgreSQL 15
- Local dev uses SQLite (no Postgres needed) when `DB_HOST` is unset or `sqlite`
- `synchronize: true` is on — TypeORM auto-applies schema changes to the live database on next container start. Destructive column changes need extra care.

## Tech stack

- **Backend**: NestJS 11 + TypeORM 0.3 + class-validator. Postgres in prod, SQLite in dev.
- **Frontend**: React 19 + Vite 7 + TypeScript + Tailwind 4 + Recharts 3 + TanStack Query 5
- **Container**: node:22-bookworm-slim, Postgres 15, Supervisord

## Local development

```bash
npm run dev              # runs backend (port 3000) + frontend (port 5173) concurrently
```

- Frontend at [http://localhost:5173](http://localhost:5173) — Vite proxies `/api` → backend
- Backend at [http://localhost:3000](http://localhost:3000) — uses SQLite via `backend/wealth.sqlite`
- `backend/.env` controls DB selection (`DB_HOST=sqlite` for local) and `CORS_ORIGIN`

## Repository layout

```
backend/src/
├── main.ts                        # bootstrap: validation pipe, global filter, CORS, /api prefix
├── app.module.ts                  # dynamic Postgres/SQLite selection via DB_HOST
├── common/filters/                # GlobalExceptionFilter — structured JSON errors + logging
├── wealth/                        # snapshots + sources
│   ├── dto/                       # CreateWealthSnapshot, CreateWealthSource, UpdateWealthSource
│   └── *.spec.ts                  # service unit tests
├── budget/                        # incomes, outgoings, accounts, allocations
└── backup/                        # full-DB export/import/revert (transactional)

frontend/src/
├── api.ts                         # axios client + endpoint functions + types
├── hooks/queries.ts               # TanStack Query hooks — single source of truth for server state
├── components/
│   ├── AssetTracker.tsx           # main wealth page
│   ├── MonthlyBudgetPage.tsx      # budget page
│   ├── BackupPage.tsx
│   └── budget/                    # budget sub-components
└── utils/dataUtils.ts             # wealth aggregation/projection logic
```

## Conventions

### Backend
- **All controller endpoints take typed DTOs**, never `any`. Validation runs globally via `ValidationPipe` in `main.ts`.
- **Services throw NestJS exceptions** (`NotFoundException`, `BadRequestException`, etc.) — never plain `Error`. The global filter in `common/filters/http-exception.filter.ts` translates them to structured JSON responses.
- **Multi-entity DB operations use transactions** via `DataSource.transaction(async (manager) => …)`. See `BackupService.importFullBackup` for the pattern.
- **DTOs live in `<module>/dto/`** with class-validator decorators.

### Frontend
- **Server state goes through TanStack Query hooks** in `hooks/queries.ts` — never `useState`+`useEffect`+manual fetch. After mutations, call `queryClient.invalidateQueries({ queryKey: QueryKeys.x })`.
- **Types are duplicated** between `frontend/src/api.ts` and backend entities. Be aware these can drift — update both when changing a shape.
- The frontend is served as static files by NestJS in production (`ServeStaticModule`), so frontend builds must produce a working `dist/` that the backend can serve from `client/`.

## Data conventions

### Money / numeric values
The API must return money as `number`, not string. Postgres returns `numeric` columns as strings by default — fix this once at the entity column with a TypeORM transformer (or cast in the service) rather than scattering `Number(x.amount)` calls across the frontend. The frontend should never have to coerce types it received from the API.

### Dates and months
Don't store calendar months as 3-letter strings (`'Jan'`, `'Feb'`, etc.) — sort order then depends on a hardcoded array lookup which breaks silently. Store as integer 1–12 and format for display only. Same principle applies anywhere date-like data is stored.

### Entity timestamps
Every persisted entity must have `@CreateDateColumn` and `@UpdateDateColumn` columns. Free auditing, free debugging when data goes weird. No exceptions.

### Migrations
`synchronize: true` is currently on — schema changes auto-apply on container restart. Until that's replaced with proper migrations:
- New columns must be nullable or have a default
- Renaming or dropping columns requires a deliberate plan (write a one-off migration script, run it, then update the entity)
- Never assume schema drift won't lose data — back up before risky changes

## Code conventions

### No `console.*` in committed frontend code
Use `logger` from `frontend/src/utils/logger.ts` instead. It is suppressed automatically in production builds (`import.meta.env.DEV`). Use the TanStack Query `error` state to surface failures in the UI. The only permitted raw `console.error` is inside `ErrorBoundary` — that is conventional and intentional.

### Component size
Soft limit: ~250 lines per component. If a component exceeds that or has more than ~3 distinct responsibilities (data fetching + form state + multiple sub-views), split it. Sub-components live in a sibling folder named after the parent.

### Comments
Default to none. Identifier names should carry the intent. Add a comment only when the *why* is non-obvious — a hidden constraint, a workaround for a known bug, a non-trivial invariant. Don't comment on what the code does, what task introduced it, or which caller relies on it.

### Tailwind class ordering
Currently inconsistent. Run `prettier-plugin-tailwindcss` to normalise on save — adding it is a one-line config change and it sorts classes deterministically.

## API conventions

### Response shapes
- Resource endpoints (`GET /resource`, `POST /resource`, `PUT /resource/:id`) return the resource or array of resources directly — no wrapper object
- Action endpoints (e.g. `POST /backup/import`) return `{ success: boolean; message: string; ...extras }`
- Errors always return `{ statusCode, message, path, timestamp }` (handled by `GlobalExceptionFilter`)

### URL patterns
- All routes mounted under `/api` via `setGlobalPrefix('api')`
- Plural resource names: `/wealth`, `/budget/incomes`, `/budget/outgoings`
- IDs are UUIDs; never expose internal numeric IDs

## Adding a new domain module

When adding a new domain (e.g. the way Investments and Liabilities were added), follow this checklist to keep modules consistent:

1. **Entity** in `<module>/entities/` with `@PrimaryGeneratedColumn('uuid')`, timestamps, and any FK relations
2. **DTOs** in `<module>/dto/` — separate `Create*Dto` and `Update*Dto`, all fields validated with class-validator. Never `any`.
3. **Service** with typed method signatures; throws NestJS exceptions, not `Error`
4. **Controller** with typed DTO bodies, never `@Body() data: any`
5. **Module** registers the entities via `TypeOrmModule.forFeature([...])` and is imported in `app.module.ts`
6. **Frontend API client functions** in `api.ts` with explicit return types
7. **TanStack Query hooks** in `hooks/queries.ts` — add the resource to `QueryKeys` and create one `useX()` hook per query
8. **Backup service** must be updated to include the new entities in `clearAllData` and `insertBackupData` (otherwise import/export silently drops the data)

## Testing

```bash
cd backend
npx jest --testPathPatterns="service.spec"   # unit tests (mocked repos)
npm run test:e2e                              # smoke tests against running app
```

Frontend has no tests yet.

## Plans / design docs

Architecture and feature design notes live in `docs/plans/`. When implementing a planned feature, reference the relevant plan rather than re-deriving from scratch.

## Git policy

**Never commit, push, or merge without explicit approval.** This applies even when changes look obviously correct — wait to be told.
