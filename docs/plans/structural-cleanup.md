# Structural Cleanup Plan

The codebase has grown through new feature additions (investments, liabilities, properties, overpayments) and inconsistencies have accumulated. This plan groups the cleanup into independently shippable phases. Each phase is testable in isolation and shouldn't block feature work.

Convention reference: see `/CLAUDE.md` for the standards these phases align to.

---

## Phase 1 — Money/numeric handling at the API boundary
> Status: **complete** — shared `decimalTransformer` added to all 9 monetary entities; API-response `Number()` casts removed from all frontend utility and component files; TypeScript check and all 20 backend tests pass.

**Problem.** Postgres returns `numeric` columns as strings. The frontend has 124 `Number(...)` casts scattered across components to compensate. This is fragile — a missed cast becomes a silent string-concatenation bug (e.g. `"10" + "20" === "1020"`).

**Scope.**
- Audit every entity with monetary columns: `IncomeSource.amount`, `OutgoingSource.amount`, `Allocation.amount`, plus any monetary fields on `InvestmentHolding`, `InvestmentSnapshot`, `Liability`, `LiabilitySnapshot`, `LiabilityOverpayment`, `Property`
- Apply a TypeORM transformer that coerces the column to `number` on read:
  ```ts
  @Column('numeric', {
    transformer: { to: (v: number) => v, from: (v: string) => parseFloat(v) },
  })
  amount: number;
  ```
- Remove all `Number(x.amount)` casts from frontend components — let the typed API response stand
- Backup import/export needs to handle this correctly (numbers go in/out as numbers in JSON anyway, so should be fine)

**Risk.** Test math-heavy paths after changing: outgoing totals, allocation totals, projection chart, summary cards.

**Estimated touches.** ~8 entities, ~10 frontend components. Largely mechanical.

---

## Phase 2 — Entity timestamps for all budget entities
> Status: **complete** — `@CreateDateColumn` / `@UpdateDateColumn` added to `IncomeSource`, `OutgoingSource`, `Account`, `Allocation`. Columns auto-created by `synchronize: true` on next container start.

**Problem.** `IncomeSource`, `OutgoingSource`, `Account`, `Allocation` have no `createdAt`/`updatedAt`. The other 9 entities do. When budget data goes weird, there's no audit trail.

**Scope.** Add `@CreateDateColumn` and `@UpdateDateColumn` to the four budget entities.

**Risk.** Very low — TypeORM auto-fills these. With `synchronize: true` on, the columns get added to existing rows with `NOW()` as a default on first run. Existing rows will all show the same timestamp — that's fine, future edits will diverge naturally.

**Estimated touches.** 4 entity files, ~12 lines added.

---

## Phase 3 — Backup service correctness audit
> Status: **complete** — all 12 entities covered in `clearAllData` and `insertBackupData`; liabilities `any` cast removed; backup version bumped to 2; test suite updated with full entity set; all 10 unit tests passing.

**Problem.** The backup service was written when only wealth + budget existed. It now silently ignores investments, liabilities, properties, and overpayments — so users who export then re-import will lose any data in those new domains.

**Scope.**
- Audit `BackupService.clearAllData` and `insertBackupData` against the full entity list registered in `app.module.ts`
- Add the missing entities to both methods, in correct dependency order (children before parents on delete; parents before children on insert)
- Update `BackupDataDto` shape to include investments and liabilities sections
- Update `backup.service.spec.ts` to cover the new shape (linter has already started this)
- Bump backup `version` from 1 to 2; either reject older imports or migrate them on load

**Risk.** Medium. Backup is the user's safety net — if it's wrong, recovery from data loss fails. Test the full round-trip with real data before declaring done.

**Estimated touches.** ~5 files, plus careful manual testing.

---

## Phase 4 — Date/month migration
> Status: **deferred** — acceptable for single-user personal app; revisit if i18n or aggregation features land

**Problem.** `WealthSnapshot.month` is a 3-letter string. Sorting relies on a hardcoded `['Jan','Feb',...]` array in `wealth.service.ts`. Investment and liability snapshots may use the same pattern (worth confirming).

**Scope.**
- Add a new `monthIndex: number` column (1–12) alongside the existing string column
- Backfill on container start (one-shot migration script) by reading existing rows and computing the index from the string
- Update `findAllSnapshots` to sort by `(year, monthIndex)` instead of array lookup
- Update DTOs to accept either string or integer (transform string to integer on input)
- Once stable, remove the string column in a follow-up

**Risk.** Higher than the others — touches existing data. Needs a backup before deploying. Alternative: leave it as-is and accept the fragility (acceptable for a personal app with ~1 user).

**Estimated touches.** Tangential — only worth doing if you ever add quarter/year aggregations or i18n month names.

**Recommendation:** Defer this one until it actually causes a bug.

---

## Phase 5 — Frontend logging cleanup
> Status: **complete** — `logger.ts` utility created in `frontend/src/utils/`; suppressed in production builds (`import.meta.env.DEV`); all 34 component-level `console.*` calls replaced with `logger.*`; `ErrorBoundary` kept using raw `console.error` (correct for that context).

**Problem.** 34 `console.error`/`console.log` calls scattered across components. With TanStack Query now in place, error states are surfaced in the UI — these console calls are noise.

**Scope.**
- Remove `console.error` calls from mutation handlers — TanStack Query's `onError` (or the `error` state) is the right place
- Remove `console.log` debug statements entirely
- If a few warrant keeping (e.g. "feature flag fired"), move them behind a `logger.ts` wrapper that respects `import.meta.env.DEV`

**Risk.** Very low. Worst case: a silent failure stays silent — but the global exception filter on the backend already logs every error.

**Estimated touches.** ~15 component files, mostly deletions.

---

## Phase 6 — Component split: BudgetSourcesModal
> Status: **pending**

**Problem.** [BudgetSourcesModal.tsx](frontend/src/components/budget/BudgetSourcesModal.tsx) is 619 lines and handles three different resource types (incomes, outgoings, accounts) with full CRUD UI for each. It violates the ~250-line guideline and the single-responsibility principle.

**Scope.**
- Split into three modals: `IncomeSourcesModal`, `OutgoingSourcesModal`, `AccountSourcesModal` (or one shell + three tab content components if a unified entry point is wanted)
- Each new component lives in `frontend/src/components/budget/sources/`
- Shared form pieces (e.g. amount input, type dropdown) extracted to that folder if reused

**Risk.** Medium UI risk — easy to introduce subtle behavior regressions in form state. Test each form thoroughly: create, edit, delete, validation errors, modal close/reopen, keyboard navigation.

**Estimated touches.** 1 file becomes 4–6 files, ~100–250 lines each.

---

## Phase 7 — Tailwind class ordering
> Status: **complete** — `prettier` and `prettier-plugin-tailwindcss` installed; `.prettierrc` created with `singleQuote`, `trailingComma: all`, `printWidth: 100`; all 79 frontend source files formatted; TypeScript still clean.

**Problem.** Class ordering is inconsistent across components — adds review friction.

**Scope.**
- Install `prettier-plugin-tailwindcss` as a dev dep in the frontend
- Add to `prettier` config (or create one if absent)
- Run prettier across the whole frontend once to normalize

**Risk.** Zero functional impact. One large diff that's purely cosmetic.

**Estimated touches.** One config change + one bulk format commit.

---

## Phase 8 — Migrations strategy (move off `synchronize: true`)
> Status: **pending** — schedule as a dedicated session; requires full backup before deploying

**Problem.** Schema changes auto-apply on container restart. Renaming or removing a column silently destroys data. As the schema grows, this gets riskier.

**Scope.**
- Generate an initial baseline migration from the current schema using `typeorm migration:generate`
- Disable `synchronize` in production config (keep it on in dev)
- Update Docker entrypoint to run `typeorm migration:run` on startup
- All future schema changes go through a migration file checked into git

**Risk.** High — getting this wrong on the live Unraid deployment loses data. Needs:
- Full backup before switching
- Test the migration flow end-to-end on a copy of production data first
- Rollback plan documented

**Estimated touches.** New `backend/src/migrations/` folder, config changes, entrypoint script update, docs.

**Recommendation.** Schedule this when you're ready to commit a focused half-day to it — don't squeeze it in alongside features.

---

## Phase 9 — New module checklist enforcement (process, not code)

**Problem.** When new domains were added, some pieces drifted from the established pattern (the backup service gap from Phase 3 is the symptom). The checklist now in `CLAUDE.md` should prevent this going forward.

**Scope.** Documentation-only — relies on following the checklist when adding new domains.

---

## Suggested order

1. **Phase 2** (timestamps) — trivial, no risk, nice to have done
2. **Phase 5** (console cleanup) — small, safe, removes noise
3. **Phase 7** (tailwind ordering) — one config change, large mechanical diff
4. **Phase 1** (money handling) — meaningful correctness improvement, mostly mechanical
5. **Phase 3** (backup audit) — important for data safety, do before users get burned
6. **Phase 6** (component split) — UX risk, do when a feature lands in that area anyway
7. **Phase 8** (migrations) — biggest risk/reward; schedule deliberately
8. **Phase 4** (date migration) — defer

Phases 1, 2, 5, 7 can be done as standalone PRs without disrupting feature work. Phases 3 and 8 deserve their own focused session.
