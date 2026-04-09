# Section: Liabilities

**Nav Label:** Liabilities  
**Nav Icon:** CreditCard  
**Route ID:** `liabilities`  
**Current Status:** 🔴 Placeholder — not yet implemented

---

## Purpose

The Liabilities section is intended to track all **outstanding financial obligations** — debts, loans, mortgages, and credit balances. Its role is to answer:

> _"What do I owe, to whom, and at what rate — and how is that total changing over time?"_

This is a critical missing piece for a complete financial picture. Without liabilities, the Asset Tracker shows *gross* wealth, not *net* wealth. True net worth = Assets − Liabilities.

---

## Relationship to Asset Tracker

The Asset Tracker currently computes:
```
Total Wealth = sum(all wealth source snapshots)
```

To compute true net worth, this should become:
```
Net Worth = Total Wealth − Total Liabilities
```

The Summary page (once built) should display net worth using both. The Asset Tracker KPI cards could also optionally show a "Net of Liabilities" total once this section is populated.

---

## Types of Liabilities to Track

| Type | Examples |
|------|---------|
| **Mortgage** | Remaining balance, property address |
| **Personal Loan** | Balance, lender, monthly payment |
| **Car Finance** | Balance, lender, monthly payment |
| **Credit Card** | Balance(s), interest rate |
| **Student Loan** | Plan type (UK Plan 1/2/5), balance |
| **Other** | Any other debt obligation |

---

## Potential Features

| Feature | Description |
|---------|-------------|
| Liability list | Name/type, current balance, interest rate, monthly payment, lender |
| Progress tracking | Original vs remaining balance; % paid off |
| Time to payoff | Based on balance + monthly payment |
| Historical snapshots | Track balance over time (reduce to £0 at payoff) |
| Monthly payment surfacing | Link to Budget outgoings (e.g., mortgage payment already exists as a non-negotiable outgoing) |
| Net Worth contribution | Feed into Summary/Asset Tracker for true net worth |

---

## Current Implementation State

`LiabilitiesPage.tsx` is a static stub with only "Liabilities Tracking Coming Soon" placeholder text. No backend entities, services, or endpoints exist for liabilities.

---

## Suggestions

1. **A monthly-snapshot model works well here too** — similar to wealth snapshots, the user records liability balances once per month. This provides consistent trend data without requiring API integration with lenders.

2. **Proposed minimal data model:**
   ```
   LiabilitySource: {
     id, name, type[mortgage|loan|credit|other],
     interestRate?, lender?, startDate?, originalAmount?
   }
   LiabilitySnapshot: {
     id, liabilitySourceId, year, month, balance, monthlyPayment
   }
   ```

3. **Consider reusing the WealthSnapshot pattern** — the wealth snapshot system (source + monthly value map) could potentially be extended with a `polarity` flag (`asset` vs `liability`) rather than creating a parallel system. This would allow the same chart and history grid components to display both assets and liabilities.

4. **The mortgage is likely the largest liability** — for most users this will be the primary entry. Consider building the mortgage case first (with fields like property value, remaining term, fixed-rate expiry date) before generalising to all liability types.

5. **Don't double-count monthly payments** — mortgage/loan payments already exist as `non-negotiable` outgoings in the Budget section. The relationship between a budget outgoing and a liability record should be clear — they are complementary (one shows the cash impact, the other shows the balance reduction).
