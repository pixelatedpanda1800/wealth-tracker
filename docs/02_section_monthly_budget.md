# Section: Monthly Budget

**Nav Label:** Monthly Budget  
**Nav Icon:** Banknote  
**Route ID:** `budget`  
**Current Status:** 🟢 Substantially implemented — two functional tabs

---

## Purpose

The Monthly Budget section is the **cashflow planning hub**. Its role is to answer:

> _"Where does my money come from, where does it go, and how should I allocate what's left?"_

It is built around a monthly view of recurring finances — not one-off transactions. It does not track historical cashflow over time; it represents the ongoing, stable financial picture of a given month.

---

## Tabs

### Tab 1: Budget

The core view of income vs expenditure.

**Objective:** Allow the user to see and manage all regular income sources and all regular outgoing commitments categorised by their nature. Calculate the net position and highlight any deficit immediately.

| Sub-section | Purpose |
|-------------|---------|
| **Income** | Lists all income streams (salary, rental income, etc.) with amounts. Managed via `BudgetSourcesModal`. |
| **Outgoings** | Lists all outgoing items split by type (non-negotiable, required, optional). Supports monthly and annual frequencies — annual amounts are normalised to a monthly equivalent for display. |
| **Savings** | A sub-view of outgoings filtered to `type === 'savings'`, displayed separately to surface savings/investment contributions distinctly from spending. Linked to wealth sources via `wealthSourceId`. |

**Summary Cards (top of page):**

| Card | Calculation |
|------|-------------|
| Total Income | Sum of all income source amounts |
| Fixed Costs | Sum of `non-negotiable` outgoings (normalised to monthly) |
| Discretionary | Sum of `required` + `optional` outgoings (normalised to monthly) |
| Savings | Sum of `savings` outgoings |
| Remaining to Spend | Total Income − (Fixed + Discretionary + Savings) |

> **Note:** A deficit alert is shown when "Remaining to Spend" is negative.

---

### Tab 2: Budget Allocation

A deeper layer of budget management that mirrors a real-world "envelope" or "pot" system.

**Objective:** Allow the user to map their total income to named bank accounts, then subdivide each account's allocation into named spending pots (e.g., "Holiday Fund", "Car Insurance").

**Key concepts:**

| Concept | Description |
|---------|-------------|
| **Account** | Represents a real bank account. Has a category, colour, and an `allocatedAmount` (the portion of monthly income directed to it). |
| **Pot** | An `Allocation` record — a named sub-division of an account's allocation. Helps budget within an account (e.g., a current account might have pots for food, utilities, entertainment). |
| **Remaining to Allocate** | Total income minus the sum of all account `allocatedAmount` values. Shown prominently with an over-allocation warning. |

**Account categories (5 types):**

| Category | Colour | Meaning |
|----------|--------|---------|
| `non-negotiable` | Rose | Essential committed spend (mortgage, bills) |
| `required` | Amber | Needed but with some flexibility (food, fuel) |
| `optional` | Blue | Discretionary (subscriptions, entertainment) |
| `savings` | Emerald | Savings and investment accounts |
| `spending` | Indigo | Day-to-day spending money |

---

## Data Model

```
IncomeSource:    { id, name, category, amount }
OutgoingSource:  { id, name, type, frequency, amount, paymentDate, notes, wealthSourceId }
Account:         { id, name, category, color, allocatedAmount }
Allocation:      { id, description, amount, accountId }
```

All entities are stored in the backend database via the `BudgetModule`.

---

## Suggestions

1. **Budget is static/non-historical** — the system captures the current budget setup, not a per-month history of budgets. If the user wants to compare this month's budget to last month's, or track how their spend plan has evolved, that would require a versioning or date-scoping mechanism. This should be a deliberate future decision.

2. **Outgoing `type` and Account `category` use the same 4-value vocabulary but are separate concepts** — the `type` on an `OutgoingSource` classifies the *nature* of the expense, while an `Account`'s `category` classifies the *account's role*. The `spending` category exists on accounts but not on outgoings. This distinction is not currently explained in the UI and may confuse users. Consider adding tooltip or documentation copy.

3. **`wealthSourceId` on OutgoingSource is a loose FK** — this column links a savings outgoing to a wealth source (e.g., a pension contribution to a pension source). However, there is no enforced referential integrity and no UI enforces the link on the wealth-source side. If the linked wealth source is deleted, no cascade or update occurs.

4. **`paymentDate` is currently stored but not displayed** — the `OutgoingSource` entity has a `paymentDate` field (integer, 1–31) but no UI in the Budget tab displays upcoming payments by date. This data exists and should be surfaced — ideally on the Summary page.

5. **`SpendingSection.tsx` appears to be unused dead code** — the file exists in `components/budget/` but is not imported or used anywhere in the current application. Its purpose should be clarified and it should either be wired up or removed.

6. **Annual amounts are normalised to monthly for all display and summary calculations** — this is correct for budget planning purposes. However the raw annual amount is what is stored. There is no indication in the UI that displayed values are normalised, which could confuse a user adding a £1,200 annual insurance premium and seeing £100/month. Consider adding a "/ 12" label or tooltip where the normalisation is applied.

7. **No error handling on the Budget Allocation tab** — `BudgetAllocationTab.tsx` uses `console.error` only. The consistent pattern elsewhere (loading spinner, error banner) should be applied here.
