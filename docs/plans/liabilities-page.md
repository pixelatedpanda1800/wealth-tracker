# Liabilities Tracker Page - Implementation Plan

**Status:** Draft — awaiting sign-off (decisions 1–3 confirmed, see §12)
**Created:** 2026-04-18
**Last Updated:** 2026-04-18

---

## 1. Overview

The Liabilities page tracks every outstanding debt so the forthcoming Summary page can report a **true net cash position** (`assets − liabilities`). It mirrors the app's existing manual-monthly-entry model: the user records a balance per liability per month, and the page surfaces totals, a projected **burndown** (debt-free date), and a breakdown by type.

Unlike Asset Tracker's single "add entry" flow, liabilities are deliberately **typed** — the information needed to model a mortgage is very different from a credit card or BNPL plan. The page therefore uses **per-type create wizards** instead of one generic form, and stores per-type metadata in a flexible JSON column so new types can be added without schema churn.

### Key Principles
- Manual monthly entry model, consistent with Asset Tracker and Investments.
- Every liability has a **type** that dictates the form fields, validation, and burndown projection maths.
- Mortgages link to a **Property**, so multiple mortgages (first charge + second charge, re-mortgage period) can attach to one address and the Summary page can compute equity.
- Burndown is computed from amortisation maths off the latest balance, **not** stored — the user's actual snapshots overlay the projection so drift is visible.
- UI follows the existing style: `bg-white`, `rounded-2xl`, indigo primary, rose/amber severity, Recharts, lucide icons, modals that mirror `ManageHoldingsModal` and `AddSnapshotModal`.

---

## 2. Liability Types

Current types requested (mortgage, loans, car loan, credit card) plus the following suggestions — each has meaningfully different repayment mechanics, so modelling them as separate types pays off when projecting burndown and when the Summary page needs to distinguish secured vs unsecured debt.

| Type | Why it needs its own shape |
|------|---------------------------|
| `mortgage` | Links to a property, rate-end dates, repayment vs interest-only, ERCs, overpayment caps |
| `personal_loan` | Fixed APR, fixed term, fixed monthly — the "textbook" amortising loan |
| `car_loan` | Hire Purchase vs PCP — PCP has a **balloon/GMFV** at term end, which dramatically changes the burndown |
| `credit_card` | Revolving, variable APR, intro/promo APR period, minimum payment = max(fixed, % of balance) |
| `student_loan` *(UK)* | Plan-type-dependent interest (RPI-linked), income-contingent repayment, write-off year — not a conventional amortisation |
| `overdraft` | Revolving, high APR (often 35%+), arranged limit; behaves like a credit card without a statement cycle |
| `bnpl` | Klarna/Clearpay etc. — typically 0% over a short fixed schedule, but some are interest-bearing; common enough to warrant its own shape |
| `tax_owed` | HMRC/self-assessment — fixed due date, HMRC late-payment interest rate; short-lived |
| `family_loan` | Informal IOU — usually 0% interest, flexible schedule, but real money against the net position |
| `other` | Catch-all: balance + optional rate + free-text notes |

Secured-vs-unsecured is derived from type (mortgage and car loan = secured; rest = unsecured) rather than a separate field.

---

## 3. Data Model

### 3.1 New Entity: `Property`

Holds the real-world asset that one or more mortgages can reference. Kept deliberately lightweight so it does not creep into a full property-management feature.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | |
| `name` | string | e.g. "12 Acacia Avenue" |
| `estimatedValue` | decimal(12,2), nullable | Current valuation — feeds Summary equity calc |
| `valuationDate` | date, nullable | When the estimate was set |
| `notes` | text, nullable | |
| `createdAt` / `updatedAt` | Date | |

A future enhancement can add property-value snapshots (same pattern as WealthSnapshot) if the user wants to track appreciation — out of scope for v1.

### 3.2 New Entity: `Liability`

One row per debt. Common fields as columns; type-specific fields as a JSON blob (`typeMetadata`). This matches the `WealthSnapshot.values` pattern already in the codebase and avoids the nullable-column sprawl that per-type tables would create.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | |
| `name` | string | Display label ("Barclays Visa", "Nationwide Fixed 2.19%") |
| `type` | enum | See Section 2 |
| `propertyId` | UUID (FK), nullable | Only populated for mortgages |
| `currency` | string, default `'GBP'` | Forward-looking — v1 treats everything as base currency |
| `startDate` | date, nullable | When the debt was taken on |
| `originalPrincipal` | decimal(12,2), nullable | Amount originally borrowed (null for revolving) |
| `interestRate` | decimal(6,3), nullable | Annual % — e.g. 22.900 for a credit card |
| `monthlyPayment` | decimal(12,2), nullable | Regular payment (null for revolving) |
| `creditLimit` | decimal(12,2), nullable | Revolving only |
| `termMonths` | int, nullable | Amortising loans only |
| `endDate` | date, nullable | Computed/stored target payoff date |
| `typeMetadata` | simple-json, default `{}` | Per-type structured fields (see 3.4) |
| `recurringOverpayment` | decimal(12,2), nullable | Monthly overpayment applied to every future month by default |
| `color` | string, nullable | Hex for charts |
| `notes` | text, nullable | |
| `archivedAt` | Date, nullable | Soft-delete once paid off (keeps history) |
| `createdAt` / `updatedAt` | Date | |

**Relation:** ManyToOne → Property (optional).

### 3.3 New Entity: `LiabilitySnapshot`

Monthly balance reading — exact mirror of `InvestmentSnapshot`'s shape so the data layer feels familiar.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | |
| `liabilityId` | UUID (FK) | |
| `year` | number | |
| `month` | string(3) | "Jan", "Feb" … — consistent with WealthSnapshot |
| `balance` | decimal(12,2) | Outstanding balance at month end |
| `interestPaid` | decimal(12,2), nullable | Optional — lets burndown compare projected vs actual interest cost |
| `paymentMade` | decimal(12,2), nullable | Optional — lets the chart show actual repayments vs scheduled |
| `createdAt` / `updatedAt` | Date | |

**Constraint:** UNIQUE(liabilityId, year, month)
**Relation:** ManyToOne → Liability with `onDelete: CASCADE`.

### 3.3a New Entity: `LiabilityOverpayment`

Per-month override for projected overpayments. Only present when the user has set a specific month to differ from `Liability.recurringOverpayment`.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | |
| `liabilityId` | UUID (FK) | |
| `year` | number | |
| `month` | string(3) | "Jan", "Feb" … |
| `amount` | decimal(12,2) | Overpayment for this specific month (can be 0 to cancel the recurring value for that month) |
| `createdAt` / `updatedAt` | Date | |

**Constraint:** UNIQUE(liabilityId, year, month)
**Relation:** ManyToOne → Liability with `onDelete: CASCADE`.
**Resolution in burndown:** per-month override → `Liability.recurringOverpayment` → 0.

### 3.4 `typeMetadata` Shape Per Type

Enforced client-side by TypeScript discriminated unions and server-side by a `class-validator` union DTO. Only non-obvious fields are listed — obvious ones (`name`, `interestRate`) already live on the common row.

| Type | typeMetadata fields |
|------|--------------------|
| `mortgage` | `rateType` ('fixed' \| 'variable' \| 'tracker' \| 'svr'), `rateEndDate` (date), `repaymentType` ('repayment' \| 'interest_only' \| 'part_and_part'), `overpaymentAnnualCapPct` (number), `ercApplies` (bool), `ercEndDate` (date) |
| `credit_card` | `promoApr` (number), `promoEndDate` (date), `minPaymentPct` (number, e.g. 2.5), `minPaymentFloor` (number, e.g. 25), `statementDay` (1–28) |
| `car_loan` | `subType` ('hp' \| 'pcp' \| 'loan'), `balloonPayment` (number, PCP only), `gmfv` (number, PCP only), `mileageCap` (number, PCP only) |
| `personal_loan` | *(empty — all fields on the common row)* |
| `student_loan` | `planType` ('plan_1' \| 'plan_2' \| 'plan_4' \| 'plan_5' \| 'postgrad'), `writeOffYear` (number), `salaryThreshold` (number) |
| `overdraft` | `arrangedLimit` (number) — distinct from `creditLimit` so it is clear this is an overdraft facility |
| `bnpl` | `provider` (string — Klarna/Clearpay/etc.), `instalmentCount` (number), `instalmentsPaid` (number) |
| `tax_owed` | `authority` (string, default 'HMRC'), `dueDate` (date) |
| `family_loan` | `counterparty` (string), `agreedSchedule` (string — free text) |
| `other` | *(empty — use notes field)* |

### 3.5 Entity Relationship Diagram

```
Property (new)               Liability (new)                  LiabilitySnapshot (new)
┌────────────────────┐       ┌───────────────────────┐        ┌────────────────────┐
│ id                 │       │ id                    │───┐    │ id                 │
│ name               │───┐   │ name                  │   │    │ liabilityId (FK)   │
│ estimatedValue     │   │   │ type (enum)           │   │    │ year / month       │
│ valuationDate      │   └──>│ propertyId (FK, opt)  │   └───>│ balance            │
│                    │ 1:many│ interestRate          │ 1:many │ interestPaid (opt) │
└────────────────────┘       │ monthlyPayment        │        │ paymentMade  (opt) │
                             │ termMonths / endDate  │        └────────────────────┘
                             │ typeMetadata (jsonb)  │
                             │ archivedAt            │
                             └───────────────────────┘
```

---

## 4. API Endpoints

```
# Properties
GET    /api/liabilities/properties
POST   /api/liabilities/properties
PUT    /api/liabilities/properties/:id
DELETE /api/liabilities/properties/:id

# Liabilities
GET    /api/liabilities                       # list, with property + latest snapshot joined
POST   /api/liabilities                       # create — body validated by type-specific DTO
PUT    /api/liabilities/:id
POST   /api/liabilities/:id/archive           # mark paid off / close, keeps history
DELETE /api/liabilities/:id                   # hard delete — cascades snapshots

# Snapshots
GET    /api/liabilities/snapshots?liabilityId=X
POST   /api/liabilities/snapshots             # upsert on (liabilityId, year, month)
DELETE /api/liabilities/snapshots/:id

# Overpayments
GET    /api/liabilities/overpayments?liabilityId=X
POST   /api/liabilities/overpayments          # upsert on (liabilityId, year, month)
DELETE /api/liabilities/overpayments/:id
```

### Backend Module Structure

```
backend/src/liabilities/
├── liabilities.module.ts
├── liabilities.controller.ts
├── liabilities.service.ts
├── burndown.service.ts              # Pure amortisation maths — unit-testable
├── entities/
│   ├── property.entity.ts
│   ├── liability.entity.ts
│   └── liability-snapshot.entity.ts
└── dto/
    ├── create-property.dto.ts
    ├── update-property.dto.ts
    ├── create-liability.dto.ts      # Discriminated union by `type`
    ├── update-liability.dto.ts
    ├── create-snapshot.dto.ts
    └── type-metadata/               # One validator class per type (Mortgage, CreditCard, etc.)
```

### DTO Validation Strategy

Use `class-validator` + `class-transformer`'s discriminator pattern on `type`:

```ts
@ValidateNested()
@Type(() => Object, {
  discriminator: {
    property: 'type',
    subTypes: [
      { value: MortgageMetadataDto,   name: 'mortgage'     },
      { value: CreditCardMetadataDto, name: 'credit_card'  },
      // …
    ],
  },
  keepDiscriminatorProperty: true,
})
typeMetadata: MortgageMetadataDto | CreditCardMetadataDto | /* … */;
```

Each per-type DTO enforces required fields for that type — e.g. `MortgageMetadataDto` requires `rateType`; `CarLoanMetadataDto` requires `subType` and makes `balloonPayment` required when `subType === 'pcp'`.

---

## 5. Page Layout & Components

### 5.1 Page Structure (top to bottom)

```
┌────────────────────────────────────────────────────────────────────────┐
│  HEADER                                                                │
│  "Liabilities"   [Manage Properties]  [Manage Liabilities]  [+ Add]    │
└────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────┐
│  TOP BANNER — TOTAL OUTSTANDING                                        │
│  ┌────────────────┐ ┌────────────────┐ ┌────────────────┐             │
│  │ Total Debt     │ │ Secured Debt   │ │ Unsecured Debt │             │
│  │ £284,120       │ │ £271,000       │ │ £13,120        │             │
│  │ ↓ £1,430 MoM   │ │ mortgage/car   │ │ cards/loans    │             │
│  └────────────────┘ └────────────────┘ └────────────────┘             │
│                                                                        │
│  ┌────────────────────────┐ ┌────────────────────────┐                │
│  │ Monthly Repayments     │ │ Weighted Avg APR       │                │
│  │ £1,780 /mo             │ │ 4.8%                   │                │
│  └────────────────────────┘ └────────────────────────┘                │
└────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────┐
│  BURNDOWN CHART                                                        │
│  [Scope: All | Secured | Unsecured] [View: Stacked | Per-liability]   │
│                                                                        │
│  £                                                                     │
│  │█████████                                                            │
│  │████████▓▓▓▓▓                         ← actual (filled)              │
│  │███████▓▓▓▓▓▓▓▓▓░░░                   ← projected (dashed)           │
│  │██████▓▓▓▓▓▓▓▓▓▓▓░░░░░░                                              │
│  │──────────────────────────────────→ month                            │
│          now              debt-free: 2039-07                           │
└────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────┐
│  BREAKDOWN BY TYPE (donut) + LIABILITY LIST                            │
│  ┌──────────────┐  ┌────────────────────────────────────────────┐     │
│  │  Donut       │  │ Nationwide Mortgage      £245,000          │     │
│  │  Mortgage 86%│  │ 2.19% fixed · ends 2027-06  [Edit] [Snap]  │     │
│  │  Car 5%      │  ├────────────────────────────────────────────┤     │
│  │  Cards 4%    │  │ Barclays Visa           £3,450 / £8,000    │     │
│  │  Loans 4%    │  │ 22.9% APR · min £85        [Edit] [Snap]   │     │
│  │  …           │  ├────────────────────────────────────────────┤     │
│  └──────────────┘  │ VW Golf PCP             £12,340            │     │
│                    │ 6.9% · balloon £8,200 · 18mo [Edit] [Snap] │     │
│                    └────────────────────────────────────────────┘     │
└────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────┐
│  PROPERTIES (only shown if any mortgages exist)                        │
│  ┌────────────────────────────────────────────────────────────────┐   │
│  │ 12 Acacia Avenue · Est. value £420,000                         │   │
│  │ Mortgages: Nationwide Fixed £245,000 + Second Charge £12,000   │   │
│  │ Equity: £163,000 (39%)                                         │   │
│  └────────────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────────────┘
```

### 5.2 Component Breakdown

```
frontend/src/components/liabilities/
├── LiabilitiesPage.tsx                # Main page (replaces placeholder)
├── LiabilitySummaryCards.tsx          # Top banner: totals, split, MoM change, avg APR
├── BurndownChart.tsx                  # Recharts composed chart: actual + projection
├── BurndownControls.tsx               # Scope/view toggles for the chart
├── LiabilityBreakdownDonut.tsx        # Donut by type
├── LiabilityList.tsx                  # Row-per-liability list with inline actions
├── LiabilityRow.tsx                   # One row — per-type compact summary
├── PropertyPanel.tsx                  # Per-property equity card
├── ManagePropertiesModal.tsx          # CRUD for Property
├── ManageLiabilitiesModal.tsx         # CRUD list entry point, launches wizard
├── AddLiabilityWizard.tsx             # Step 1: type picker → Step 2: per-type form
├── AddSnapshotModal.tsx               # Monthly balance entry across all liabilities
├── OverpaymentPlanModal.tsx           # Recurring overpayment + per-month grid override
├── forms/
│   ├── MortgageForm.tsx
│   ├── CreditCardForm.tsx
│   ├── CarLoanForm.tsx
│   ├── PersonalLoanForm.tsx
│   ├── StudentLoanForm.tsx
│   ├── OverdraftForm.tsx
│   ├── BnplForm.tsx
│   ├── TaxOwedForm.tsx
│   ├── FamilyLoanForm.tsx
│   └── OtherForm.tsx
└── types.ts                           # Discriminated union types
```

### 5.3 Component Details

#### LiabilitySummaryCards
- Five tiles: Total, Secured, Unsecured, Monthly Repayments, Weighted Avg APR.
- Total card shows **MoM change** using the two most recent snapshot months (rose if up, emerald if down — inverted from Asset Tracker's palette since debt-going-down is positive).
- Layout matches `InvestmentSummaryCards` — `grid grid-cols-5 gap-4`, `bg-white rounded-2xl p-5`, indigo accent on the primary tile.

#### BurndownChart
- Recharts `ComposedChart` with three series:
  - **Actual balance** — solid area, from `LiabilitySnapshot.balance` summed across scope.
  - **Projected balance** — dashed line, computed client-side from `burndownUtils.ts`.
  - **Debt-free marker** — `ReferenceLine` at the month projected balance hits zero.
- Scope toggle: All / Secured / Unsecured / specific type.
- View toggle: Stacked (one layer per liability, coloured by `liability.color`) vs Total (single line).
- X-axis extends 6 months past the latest projected payoff, or to mortgage term end, whichever is later.
- Empty state: if no snapshots exist yet, show CTA to add the first snapshot.

#### LiabilityList / LiabilityRow
- One row per active liability. Archived liabilities hidden by default behind a "Show archived (N)" toggle.
- Each row renders a type-specific compact summary:
  - Mortgage: `{rate}% {rateType} · ends {rateEndDate}`
  - Credit card: `{apr}% APR · min £{calc} · £{balance}/£{limit}` with a utilisation bar
  - Car loan PCP: `{apr}% · balloon £{n} · {remainingMonths}mo`
  - Credit card in promo: amber pill "0% until Mar 2027"
- Inline actions: Edit, Add/Update Snapshot, Archive.

#### AddLiabilityWizard
- Step 1: a grid of 10 type tiles (icon + label + one-line hint). Clicking a tile advances to Step 2.
- Step 2: renders the matching type form. Shared top section (name, start date, colour, notes) plus type-specific fields below.
- Cancel returns to Step 1 without losing shared-section input.

#### AddSnapshotModal
- Behaves like Investments' `AddSnapshotModal`: pick a month, see every active liability, enter `balance` (required), `paymentMade` and `interestPaid` optional.
- Groups liabilities by type for readability.
- Upsert on `(liabilityId, year, month)`.

#### OverpaymentPlanModal
- Launched from a liability row ("Plan overpayments").
- Top section: `recurringOverpayment` input — applies to every future month by default.
- Below: a scrollable 36-month forward grid starting from the current month. Each row is pre-filled from `recurringOverpayment`; editing a row creates/updates a `LiabilityOverpayment` entry for that specific month. "Reset to recurring" clears the override.
- Save does two calls: `PUT /api/liabilities/:id` (for `recurringOverpayment`) then a bulk upsert/delete for the diverging months.
- Live preview on the right: a mini burndown showing the debt-free date with and without the current plan so the user sees the impact before saving.

#### PropertyPanel
- One card per `Property` that has at least one linked mortgage.
- Shows `estimatedValue`, sum of linked mortgage balances, **equity** = value − mortgages, and equity % of value.
- Warns if `estimatedValue` is missing or older than 12 months ("Valuation out of date — update for accurate equity").

---

## 6. Burndown Projection Logic (`burndownUtils.ts`)

Pure functions, no React. Same file shape as `investmentUtils.ts`.

### 6.1 Amortising loan (mortgage, personal loan, car loan HP/straight)

Standard amortisation formula from current balance `B`, monthly rate `r = APR/12`, monthly payment `P`, plus any overpayment `O_m` for month `m`:

```
O_m           = LiabilityOverpayment[m]?.amount ?? recurringOverpayment ?? 0
balance_next  = balance * (1 + r) − (P + O_m)
```

Projection emits a monthly series from the latest snapshot month until balance reaches zero (or termEndDate, whichever first). Because `O_m` is resolved per-month, the closed-form `months_to_zero` is replaced with iteration — still fast since we cap at 360 months (30 years).

### 6.2 PCP (car loan subType = 'pcp')

Same amortisation as above, but floor the projected balance at `balloonPayment` for the remainder of the term, then drop to 0 if the user has indicated the balloon will be paid, or keep at balloon if not. UI surfaces the balloon explicitly — `"projection excludes balloon: £{n}"` with a checkbox in the chart controls to include it.

### 6.3 Credit card / overdraft (revolving)

Minimum-payment projection: each month, `payment = max(minPaymentFloor, balance * minPaymentPct / 100) + O_m`, interest accrues at `monthlyRate = APR/12`. Converges slowly without overpayments — cap the projection at 30 years and show a warning badge if it would run longer: *"At minimum payments this card would take >30 years to clear."*

Promo APR: if `promoEndDate > today`, use 0% until that date, then flip to the standard `interestRate`.

### 6.4 Student loan (UK)

Too path-dependent (depends on salary, threshold uplifts, write-off) to project accurately. **Skip projection** — show the current balance flat with a note *"UK student loan repayment depends on income and plan-specific thresholds. Not modelled."* Still contributes to `total outstanding`.

### 6.5 BNPL / tax / family loan

- BNPL: straight-line to zero over remaining instalments.
- Tax: flat until `dueDate`, then a warning if unpaid past it.
- Family loan: flat unless `agreedSchedule` is a structured payment plan (v1: flat).

### 6.6 Aggregation

`buildBurndownSeries(liabilities, snapshots, scope)` produces a single month-indexed array where each point has:
- `month: 'YYYY-MM'`
- `actual: number | null` (null for months past "today")
- `projected: number`
- `byLiability: Record<liabilityId, number>` (only for stacked view)

---

## 7. Frontend Data Flow

### React Query Hooks (new in `hooks/queries.ts`)

```ts
useLiabilities()              // GET /api/liabilities
useLiabilitySnapshots()       // GET /api/liabilities/snapshots
useLiabilityOverpayments()    // GET /api/liabilities/overpayments
useProperties()               // GET /api/liabilities/properties
```

### QueryKeys additions

```ts
liabilities: ['liabilities'] as const,
liabilitySnapshots: ['liabilitySnapshots'] as const,
liabilityOverpayments: ['liabilityOverpayments'] as const,
properties: ['properties'] as const,
```

### Mutations
Handled by per-modal submit handlers that call `api.ts` methods and invalidate the three query keys above. Adding or removing a liability also invalidates `wealthSnapshots` if we eventually roll liability totals into the Summary page.

---

## 8. Summary Page Integration (contract only)

The Summary page is out of scope for this plan, but the Liabilities module must expose what it needs:

- **Net position** = sum of latest WealthSnapshot values − sum of latest LiabilitySnapshot balances per active liability.
- **Property equity** = `property.estimatedValue − sum(linked mortgage latest balances)` per property.
- **Monthly cash commitment** = sum of `monthlyPayment` across active liabilities (for the Summary's cashflow view).

These are derivable from the endpoints in Section 4 — no extra API needed.

---

## 9. Backup / Restore

Extend `backup.service.ts` so export/import round-trips:
- `properties`
- `liabilities` (including `typeMetadata` and `recurringOverpayment`)
- `liability_snapshots`
- `liability_overpayments`

Matches the pattern used when investments were added. Needs to go in the same phase as the backend entities to keep backup files forward/backward compatible.

---

## 10. Implementation Phases

### Phase 1 — Backend Foundation
1. Create `Property`, `Liability`, `LiabilitySnapshot`, `LiabilityOverpayment` entities.
2. Create per-type metadata DTO classes + discriminated `CreateLiabilityDto`.
3. Create `LiabilitiesModule`, controller, service, and `burndown.service.ts` (server-side is optional — projection can be client-side only; service is where we'd put it if we later move it).
4. Register module in `AppModule`.
5. Extend `BackupService` to include the four new tables.
6. Unit tests for amortisation maths (happy path + promo APR + balloon + overpayment override chain).

### Phase 2 — Frontend Core Page
1. Types file + React Query hooks + QueryKey entries.
2. `ManagePropertiesModal` (simplest CRUD, unlocks mortgages).
3. `AddLiabilityWizard` shell + type picker + all 10 type forms (can stagger: Mortgage/CreditCard/PersonalLoan/CarLoan first, then the remaining six, all within this phase).
4. `AddSnapshotModal`.
5. `OverpaymentPlanModal` with recurring field + per-month grid + diff-save logic.
6. Replace placeholder `LiabilitiesPage.tsx` with header + modals + empty state.

### Phase 3 — Visualisations
1. `LiabilitySummaryCards`.
2. `burndownUtils.ts` + unit tests.
3. `BurndownChart` + controls.
4. `LiabilityBreakdownDonut`.
5. `LiabilityList` + per-type `LiabilityRow` renderers.

### Phase 4 — Polish
1. `PropertyPanel` with equity calc.
2. Archive flow + "Show archived" toggle.
3. Loading, empty, and error states to match Investments page.
4. Warning badges: minimum-payment-over-30-years, tax due date passed, valuation stale.
5. Live burndown preview inside `OverpaymentPlanModal` (with vs without plan).

---

## 11. Open Questions (still to resolve)

1. **Currency** — v1 treats everything as GBP. Should the `currency` field be user-visible now or deferred? (Leaning: deferred, kept as a column for future use.)
2. **Interest accrual vs. user entry** — should the app auto-accrue interest onto balances if a monthly snapshot is missed, or only reflect what the user manually records? (Leaning: only what the user records — consistent with Asset Tracker's "what you see is what you entered" model; burndown projection is separate.)
3. **Overpayment cap warnings** — mortgages often have an annual overpayment cap (`overpaymentAnnualCapPct`). Should the app warn when planned overpayments in a calendar year exceed the cap? (Leaning: yes — lightweight and high-value.)
4. **Auto-compute monthly payment** — when the user fills in principal + APR + term on a personal loan, should the form auto-fill `monthlyPayment`? (Leaning: yes, as a suggested default the user can override.)

---

## 12. Decisions Made

| # | Decision | Date |
|---|----------|------|
| 1 | Support all 10 liability types in v1 (mortgage, personal_loan, car_loan, credit_card, student_loan, overdraft, bnpl, tax_owed, family_loan, other) | 2026-04-18 |
| 2 | Per-liability overpayments with both a recurring default and per-month overrides. Resolution chain: per-month override → `recurringOverpayment` → 0. Modelled as `Liability.recurringOverpayment` column plus a dedicated `LiabilityOverpayment` entity for diverging months. | 2026-04-18 |
| 3 | No `userSharePct` in v1 — joint-liability share weighting deferred to v2. | 2026-04-18 |
