import { MONTHS } from './constants';
import type { InvestmentHolding, InvestmentSnapshot } from '../components/investments/types';
import type { WealthSource } from '../api';
import { getDefaultColor } from './dataUtils';

export type Period = '1M' | '3M' | '1Y' | '5Y' | 'All';

export const PERIOD_LABELS: Record<Period, string> = {
  '1M': '1 Month',
  '3M': '3 Months',
  '1Y': '1 Year',
  '5Y': '5 Years',
  All: 'All Time',
};

// Map our period to TradingView dateRange param
export const PERIOD_TO_TV: Record<Period, string> = {
  '1M': '1M',
  '3M': '3M',
  '1Y': '12M',
  '5Y': '60M',
  All: 'ALL',
};

// Sort snapshots chronologically
const sortSnapshots = (snapshots: InvestmentSnapshot[]) =>
  [...snapshots].sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year;
    return MONTHS.indexOf(a.month as any) - MONTHS.indexOf(b.month as any);
  });

// Cut off date for a given period (returns a comparable number: year * 12 + monthIdx)
const periodCutoff = (period: Period): number => {
  const now = new Date();
  const nowIndex = now.getFullYear() * 12 + now.getMonth();
  switch (period) {
    case '1M':
      return nowIndex - 1;
    case '3M':
      return nowIndex - 3;
    case '1Y':
      return nowIndex - 12;
    case '5Y':
      return nowIndex - 60;
    case 'All':
      return 0;
  }
};

const snapshotIndex = (s: InvestmentSnapshot) => s.year * 12 + MONTHS.indexOf(s.month as any);

/**
 * Returns a copy of the sorted snapshot array where each entry's costBasis is
 * the most recently recorded non-null value (carried forward from earlier snapshots).
 * Snapshots before any cost basis was ever entered keep null.
 */
const carryForwardCostBasis = (
  sortedSnaps: InvestmentSnapshot[],
): (InvestmentSnapshot & { resolvedCostBasis: number | null })[] => {
  let last: number | null = null;
  return sortedSnaps.map((s) => {
    if (s.costBasis != null) last = s.costBasis;
    return { ...s, resolvedCostBasis: last };
  });
};

// Filter snapshots for a holding to those within the period
export const filterSnapshotsByPeriod = (
  snapshots: InvestmentSnapshot[],
  holdingId: string,
  period: Period,
): InvestmentSnapshot[] => {
  const cutoff = periodCutoff(period);
  return sortSnapshots(
    snapshots.filter((s) => s.holdingId === holdingId && snapshotIndex(s) >= cutoff),
  );
};

// --- Summary stats ---

export interface HoldingStats {
  currentValue: number;
  previousValue: number; // previous month value
  change: number; // currentValue - previousValue
  changePct: number; // % change over period
  periodStartValue: number;
  costBasis: number | null;
  gainLoss: number | null; // null if no cost basis
  returnPct: number | null;
}

export const calculateHoldingStats = (
  snapshots: InvestmentSnapshot[],
  holdingId: string,
  period: Period,
): HoldingStats => {
  const allForHolding = sortSnapshots(snapshots.filter((s) => s.holdingId === holdingId));
  const periodSnaps = filterSnapshotsByPeriod(snapshots, holdingId, period);

  const latest = allForHolding[allForHolding.length - 1];
  const currentValue = latest ? latest.value : 0;

  // Previous month value (second-to-last of all snapshots)
  const previous = allForHolding[allForHolding.length - 2];
  const previousValue = previous ? previous.value : currentValue;

  const periodStart = periodSnaps[0];
  const periodStartValue = periodStart ? periodStart.value : currentValue;

  const change = currentValue - periodStartValue;
  const changePct = periodStartValue > 0 ? (change / periodStartValue) * 100 : 0;

  // Use the most recent snapshot that has a cost basis recorded — not just the latest
  const latestWithBasis = [...allForHolding].reverse().find((s) => s.costBasis != null);
  const costBasis = latestWithBasis != null ? (latestWithBasis.costBasis ?? null) : null;
  const gainLoss = costBasis !== null ? currentValue - costBasis : null;
  const returnPct =
    costBasis != null && costBasis > 0 ? ((currentValue - costBasis) / costBasis) * 100 : null;

  return {
    currentValue,
    previousValue,
    change,
    changePct,
    periodStartValue,
    costBasis,
    gainLoss,
    returnPct,
  };
};

// --- Portfolio-level summary ---

export interface PortfolioSummary {
  totalValue: number;
  totalCostBasis: number | null;
  totalGainLoss: number | null;
  totalReturnPct: number | null;
  monthlyChange: number;
}

export const calculatePortfolioSummary = (
  holdings: InvestmentHolding[],
  snapshots: InvestmentSnapshot[],
): PortfolioSummary => {
  let totalValue = 0;
  let costedValue = 0; // current value of only those holdings with a cost basis
  let totalCostBasis = 0;
  let hasCostBasis = false;
  let monthlyChange = 0;

  for (const holding of holdings) {
    const stats = calculateHoldingStats(snapshots, holding.id, '1M');
    totalValue += stats.currentValue;
    monthlyChange += stats.change;
    if (stats.costBasis !== null) {
      costedValue += stats.currentValue;
      totalCostBasis += stats.costBasis;
      hasCostBasis = true;
    }
  }

  // Only compare like-for-like: gain/loss uses only the subset of holdings
  // that have cost basis data, preventing uncosted holdings inflating the return.
  const totalGainLoss = hasCostBasis ? costedValue - totalCostBasis : null;
  const totalReturnPct =
    hasCostBasis && totalCostBasis > 0
      ? ((costedValue - totalCostBasis) / totalCostBasis) * 100
      : null;

  return {
    totalValue,
    totalCostBasis: hasCostBasis ? totalCostBasis : null,
    totalGainLoss,
    totalReturnPct,
    monthlyChange,
  };
};

// --- Account chart data ---

export interface AccountChartPoint {
  displayLabel: string;
  year: number;
  month: string;
  [holdingKey: string]: number | string; // holding_{id}: value
}

export const buildAccountChartData = (
  accountHoldings: InvestmentHolding[],
  snapshots: InvestmentSnapshot[],
): AccountChartPoint[] => {
  if (accountHoldings.length === 0) return [];

  // Collect all unique year/month periods that have any snapshot for this account's holdings
  const holdingIds = new Set(accountHoldings.map((h) => h.id));
  const accountSnaps = snapshots.filter((s) => holdingIds.has(s.holdingId));

  const periodSet = new Set(accountSnaps.map((s) => `${s.year}-${s.month}`));
  const periods = [...periodSet]
    .map((key) => {
      const [year, month] = key.split('-');
      return { year: Number(year), month };
    })
    .sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return MONTHS.indexOf(a.month as any) - MONTHS.indexOf(b.month as any);
    });

  return periods.map(({ year, month }) => {
    const point: AccountChartPoint = {
      displayLabel: `${month} '${year.toString().slice(-2)}`,
      year,
      month,
    };
    for (const holding of accountHoldings) {
      const snap = accountSnaps.find(
        (s) => s.holdingId === holding.id && s.year === year && s.month === month,
      );
      point[`holding_${holding.id}`] = snap ? snap.value : 0;
    }
    return point;
  });
};

// --- Allocation chart data ---

export interface AllocationSlice {
  name: string;
  value: number;
  color: string;
}

const TYPE_COLORS: Record<string, string> = {
  fund: '#6366F1',
  etf: '#10B981',
  stock: '#F59E0B',
  bond: '#64748B',
  crypto: '#F7931A',
  other: '#EC4899',
};

export const buildAllocationData = (
  holdings: InvestmentHolding[],
  snapshots: InvestmentSnapshot[],
): AllocationSlice[] => {
  const totals: Record<string, number> = {};

  for (const holding of holdings) {
    const allForHolding = sortSnapshots(snapshots.filter((s) => s.holdingId === holding.id));
    const latest = allForHolding[allForHolding.length - 1];
    if (!latest) continue;
    const val = latest.value;
    totals[holding.type] = (totals[holding.type] || 0) + val;
  }

  return Object.entries(totals)
    .filter(([, val]) => val > 0)
    .map(([type, value], index) => ({
      name: type.charAt(0).toUpperCase() + type.slice(1),
      value,
      color: TYPE_COLORS[type] || getDefaultColor(index),
    }));
};

// --- Warning detection ---

export type WarningSeverity = 'critical' | 'warning' | 'info';

export interface InvestmentWarning {
  holdingId: string;
  holdingName: string;
  severity: WarningSeverity;
  type: 'deposit-masked' | 'consecutive-negative' | 'underwater' | 'stagnant' | 'drawdown';
  message: string;
}

export const detectWarnings = (
  holdings: InvestmentHolding[],
  snapshots: InvestmentSnapshot[],
): InvestmentWarning[] => {
  const warnings: InvestmentWarning[] = [];

  for (const holding of holdings) {
    const holdingSnaps = sortSnapshots(snapshots.filter((s) => s.holdingId === holding.id));
    if (holdingSnaps.length < 6) continue; // insufficient data

    // Resolve cost basis for every snapshot, carrying forward the most recent
    // non-null entry so gaps in data entry don't silently zero-out the basis.
    const resolved = carryForwardCostBasis(holdingSnaps);

    const latest = resolved[resolved.length - 1];
    const currentValue = latest.value;
    const hasCostBasis = resolved.some((s) => s.resolvedCostBasis != null);

    // Last 12 months of data (or all if fewer)
    const last12 = resolved.slice(-12);
    const name = holding.name;

    // ── Indicator 1: Deposit-Masked Growth (Critical) ──────────────────────
    // Requires costBasis. Fires when >75% of 12-month value increase is from deposits.
    if (hasCostBasis && last12.length >= 6) {
      const first = last12[0];
      const last = last12[last12.length - 1];
      const totalValueIncrease = last.value - first.value;

      if (totalValueIncrease > 0) {
        const firstBasis = first.resolvedCostBasis;
        const lastBasis = last.resolvedCostBasis;

        if (firstBasis !== null && lastBasis !== null) {
          const depositIncrease = lastBasis - firstBasis;
          const depositFraction = depositIncrease / totalValueIncrease;

          if (depositFraction > 0.75) {
            warnings.push({
              holdingId: holding.id,
              holdingName: name,
              severity: 'critical',
              type: 'deposit-masked',
              message: `${name}: Growth over the last 12 months appears to be driven primarily by deposits rather than investment performance. Review whether the fund is actually growing.`,
            });
          }
        }
      }
    }

    // ── Indicator 2: Consecutive Negative Return (Warning) ─────────────────
    // Uses deposit-adjusted return where costBasis available, else raw value change.
    // Fires when 3+ consecutive months of negative real return.
    let consecutiveNeg = 0;
    let maxConsecutive = 0;

    for (let i = 1; i < last12.length; i++) {
      const prev = last12[i - 1];
      const curr = last12[i];

      // Only compare consecutive calendar months (skip gaps)
      const prevIdx = snapshotIndex(prev);
      const currIdx = snapshotIndex(curr);
      if (currIdx - prevIdx > 1) {
        consecutiveNeg = 0; // gap resets streak
        continue;
      }

      const valueChange = curr.value - prev.value;
      const depositChange =
        curr.resolvedCostBasis != null && prev.resolvedCostBasis != null
          ? curr.resolvedCostBasis - prev.resolvedCostBasis
          : 0;
      const realReturn = valueChange - depositChange;

      if (realReturn < 0) {
        consecutiveNeg++;
        maxConsecutive = Math.max(maxConsecutive, consecutiveNeg);
      } else {
        consecutiveNeg = 0;
      }
    }

    if (maxConsecutive >= 3) {
      warnings.push({
        holdingId: holding.id,
        holdingName: name,
        severity: 'warning',
        type: 'consecutive-negative',
        message: `${name}: Has shown negative real returns for ${maxConsecutive} consecutive months. This may indicate a sustained decline rather than short-term volatility.`,
      });
    }

    // ── Indicator 3: Underwater Position (Critical) ────────────────────────
    // Requires costBasis. Fires when current value < total invested.
    if (latest.resolvedCostBasis != null) {
      const costBasis = latest.resolvedCostBasis;
      if (costBasis > 0 && currentValue < costBasis) {
        const lossAmount = costBasis - currentValue;
        const lossPct = (lossAmount / costBasis) * 100;
        warnings.push({
          holdingId: holding.id,
          holdingName: name,
          severity: 'critical',
          type: 'underwater',
          message: `${name}: Currently worth £${currentValue.toLocaleString(undefined, { maximumFractionDigits: 0 })} — £${lossAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })} (${lossPct.toFixed(1)}%) below the total amount invested.`,
        });
      }
    }

    // ── Indicator 4: Stagnant Holding (Info) ───────────────────────────────
    // Fires when deposit-adjusted 12-month return is between -1% and +1%.
    // Requires costBasis for accuracy; skips if unavailable.
    if (hasCostBasis && last12.length >= 6) {
      const first = last12[0];
      const last = last12[last12.length - 1];
      const valueChange = last.value - first.value;
      const depositChange =
        first.resolvedCostBasis != null && last.resolvedCostBasis != null
          ? last.resolvedCostBasis - first.resolvedCostBasis
          : 0;
      const realReturn = valueChange - depositChange;
      const startValue = first.value;
      const realReturnPct = startValue > 0 ? (realReturn / startValue) * 100 : 0;

      if (realReturnPct > -1 && realReturnPct < 1) {
        warnings.push({
          holdingId: holding.id,
          holdingName: name,
          severity: 'info',
          type: 'stagnant',
          message: `${name}: Real return over the last 12 months is ${realReturnPct.toFixed(2)}% — effectively flat after accounting for deposits. Consider whether this holding is working hard enough.`,
        });
      }
    }

    // ── Indicator 5: Significant Drawdown (Warning) ────────────────────────
    // Fires when current deposit-adjusted value is >15% below its peak.
    // Uses raw value if no costBasis available.
    const baseResolved = resolved[0].resolvedCostBasis ?? 0;

    const peakSnap = resolved.reduce((best, snap) => {
      const depositsSinceStart = (snap.resolvedCostBasis ?? baseResolved) - baseResolved;
      const adjusted = snap.value - depositsSinceStart;
      const bestDeposits = (best.resolvedCostBasis ?? baseResolved) - baseResolved;
      const bestAdjusted = best.value - bestDeposits;
      return adjusted > bestAdjusted ? snap : best;
    }, resolved[0]);

    const peakDeposits = (peakSnap.resolvedCostBasis ?? baseResolved) - baseResolved;
    const peakAdjusted = peakSnap.value - peakDeposits;
    const currentDeposits = (latest.resolvedCostBasis ?? baseResolved) - baseResolved;
    const currentAdjusted = currentValue - currentDeposits;

    if (peakAdjusted > 0 && peakSnap.id !== latest.id) {
      const drawdownPct = ((peakAdjusted - currentAdjusted) / peakAdjusted) * 100;
      if (drawdownPct >= 15) {
        warnings.push({
          holdingId: holding.id,
          holdingName: name,
          severity: 'warning',
          type: 'drawdown',
          message: `${name}: Down ${drawdownPct.toFixed(1)}% from its peak value recorded in ${peakSnap.month} ${peakSnap.year}. This may represent a significant drawdown worth monitoring.`,
        });
      }
    }
  }

  // Sort: critical first, then warning, then info
  const severityOrder: Record<WarningSeverity, number> = { critical: 0, warning: 1, info: 2 };
  return warnings.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
};

// --- Holding colour with fallback ---

export const holdingColor = (holding: InvestmentHolding, index: number) =>
  holding.color || getDefaultColor(index);

// --- Group holdings by ticker ---

export interface HoldingGroup {
  /** Shared ticker, or null for ungrouped (no-ticker) holdings */
  ticker: string | null;
  holdings: InvestmentHolding[];
}

/**
 * Holdings that share a ticker are collapsed into a single group.
 * Holdings without a ticker each get their own group.
 * Original order is preserved (first occurrence of a ticker determines position).
 */
export const groupHoldingsByTicker = (holdings: InvestmentHolding[]): HoldingGroup[] => {
  const tickerMap = new Map<string, InvestmentHolding[]>();
  const groups: HoldingGroup[] = [];

  for (const holding of holdings) {
    if (holding.ticker) {
      const key = holding.ticker.toUpperCase();
      if (!tickerMap.has(key)) {
        const list: InvestmentHolding[] = [];
        tickerMap.set(key, list);
        groups.push({ ticker: key, holdings: list });
      }
      tickerMap.get(key)!.push(holding);
    } else {
      groups.push({ ticker: null, holdings: [holding] });
    }
  }

  return groups;
};

/** Aggregate HoldingStats across all holdings in a group */
export const calculateGroupStats = (
  holdings: InvestmentHolding[],
  snapshots: InvestmentSnapshot[],
  period: Period,
): HoldingStats => {
  let totalCurrentValue = 0;
  let totalPreviousValue = 0;
  let totalPeriodStartValue = 0;
  let totalCostBasis = 0;
  // All holdings in the group must have a cost basis — partial data produces
  // misleading gain/loss figures (e.g. one AAPL account costed, another not).
  let allHaveCostBasis = holdings.length > 0;

  for (const holding of holdings) {
    const stats = calculateHoldingStats(snapshots, holding.id, period);
    totalCurrentValue += stats.currentValue;
    totalPreviousValue += stats.previousValue;
    totalPeriodStartValue += stats.periodStartValue;
    if (stats.costBasis !== null) {
      totalCostBasis += stats.costBasis;
    } else {
      allHaveCostBasis = false;
    }
  }

  const change = totalCurrentValue - totalPeriodStartValue;
  const changePct = totalPeriodStartValue > 0 ? (change / totalPeriodStartValue) * 100 : 0;
  const costBasis = allHaveCostBasis ? totalCostBasis : null;
  const gainLoss = costBasis !== null ? totalCurrentValue - costBasis : null;
  const returnPct =
    costBasis != null && costBasis > 0 ? ((totalCurrentValue - costBasis) / costBasis) * 100 : null;

  return {
    currentValue: totalCurrentValue,
    previousValue: totalPreviousValue,
    change,
    changePct,
    periodStartValue: totalPeriodStartValue,
    costBasis,
    gainLoss,
    returnPct,
  };
};

// --- Group holdings by account ---

export const groupHoldingsByAccount = (
  holdings: InvestmentHolding[],
  sources: WealthSource[],
): Array<{ source: WealthSource; holdings: InvestmentHolding[] }> => {
  return sources
    .filter((s) => s.category === 'investment' || s.category === 'pension')
    .map((source) => ({
      source,
      holdings: holdings.filter((h) => h.wealthSourceId === source.id),
    }))
    .filter((g) => g.holdings.length > 0);
};
