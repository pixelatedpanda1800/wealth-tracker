import type {
  CategorySpend,
  MonthlySpend,
  SpendingCategory,
  SpendingSummary,
  Transaction,
} from './types';

export function monthKeyOf(dateStr: string): string {
  return dateStr.slice(0, 7);
}

export function formatMonthLabel(monthKey: string): string {
  const [year, month] = monthKey.split('-');
  const d = new Date(Number(year), Number(month) - 1, 1);
  return d.toLocaleDateString(undefined, { month: 'short', year: '2-digit' });
}

export function listMonthKeys(from: string, to: string): string[] {
  const keys: string[] = [];
  const [fy, fm] = from.split('-').map(Number);
  const [ty, tm] = to.split('-').map(Number);
  let y = fy;
  let m = fm;
  while (y < ty || (y === ty && m <= tm)) {
    keys.push(`${y}-${String(m).padStart(2, '0')}`);
    m += 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
  }
  return keys;
}

export function shiftMonth(monthKey: string, delta: number): string {
  const [y, m] = monthKey.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

interface BuildArgs {
  transactions: Transaction[];
  categories: SpendingCategory[];
  accountId: string | 'all';
  monthKey: string;
  previousMonthKey: string;
  topLevelCategoryOf: (id: string | null) => SpendingCategory | null;
}

function filterScope(
  txns: Transaction[],
  accountId: string | 'all',
  monthKey: string,
): Transaction[] {
  return txns.filter((t) => {
    if (accountId !== 'all' && t.accountId !== accountId) return false;
    return monthKeyOf(t.date) === monthKey;
  });
}

export function buildSummary(args: BuildArgs): SpendingSummary {
  const { transactions, categories, accountId, monthKey, previousMonthKey, topLevelCategoryOf } =
    args;

  const current = filterScope(transactions, accountId, monthKey);
  const previous = filterScope(transactions, accountId, previousMonthKey);

  const totalSpent = current.reduce((sum, t) => sum + t.amount, 0);
  const previousTotal = previous.reduce((sum, t) => sum + t.amount, 0);

  const totalsByTop = new Map<string, number>();
  let uncategorisedAmount = 0;
  let uncategorisedCount = 0;
  current.forEach((t) => {
    if (!t.categoryId || t.needsReview) {
      uncategorisedAmount += t.amount;
      uncategorisedCount += 1;
      return;
    }
    const top = topLevelCategoryOf(t.categoryId);
    if (!top) return;
    totalsByTop.set(top.id, (totalsByTop.get(top.id) ?? 0) + t.amount);
  });

  let largest: { name: string; amount: number } | null = null;
  totalsByTop.forEach((amount, id) => {
    if (!largest || amount > largest.amount) {
      const cat = categories.find((c) => c.id === id);
      if (cat) largest = { name: cat.name, amount };
    }
  });

  const changeAbsolute = totalSpent - previousTotal;
  const changePercent = previousTotal === 0 ? 0 : (changeAbsolute / previousTotal) * 100;

  return {
    totalSpent,
    largestCategory: largest,
    uncategorisedAmount,
    uncategorisedCount,
    previousTotal,
    changeAbsolute,
    changePercent,
  };
}

export function buildCategoryBreakdown(args: BuildArgs): CategorySpend[] {
  const { transactions, categories, accountId, monthKey } = args;

  const current = filterScope(transactions, accountId, monthKey);

  const byCategoryAmount = new Map<string, number>();
  const byCategoryCount = new Map<string, number>();
  current.forEach((t) => {
    const id = t.categoryId ?? '__uncategorised__';
    byCategoryAmount.set(id, (byCategoryAmount.get(id) ?? 0) + t.amount);
    byCategoryCount.set(id, (byCategoryCount.get(id) ?? 0) + 1);
  });

  const topLevels = categories.filter((c) => c.parentId === null);
  const result: CategorySpend[] = topLevels.map((top) => {
    const children = categories.filter((c) => c.parentId === top.id);
    const childSpends: CategorySpend[] = children
      .map((child) => ({
        categoryId: child.id,
        categoryName: child.name,
        color: child.color,
        amount: byCategoryAmount.get(child.id) ?? 0,
        transactionCount: byCategoryCount.get(child.id) ?? 0,
        children: [],
      }))
      .filter((c) => c.amount > 0);

    const selfAmount = byCategoryAmount.get(top.id) ?? 0;
    const selfCount = byCategoryCount.get(top.id) ?? 0;
    const amount = childSpends.reduce((s, c) => s + c.amount, 0) + selfAmount;
    const count = childSpends.reduce((s, c) => s + c.transactionCount, 0) + selfCount;

    return {
      categoryId: top.id,
      categoryName: top.name,
      color: top.color,
      amount,
      transactionCount: count,
      children: childSpends.sort((a, b) => b.amount - a.amount),
    };
  });

  const uncategorisedAmount = byCategoryAmount.get('__uncategorised__') ?? 0;
  const uncategorisedCount = byCategoryCount.get('__uncategorised__') ?? 0;
  if (uncategorisedAmount > 0) {
    result.push({
      categoryId: '__uncategorised__',
      categoryName: 'Needs review',
      color: '#f43f5e',
      amount: uncategorisedAmount,
      transactionCount: uncategorisedCount,
      children: [],
    });
  }

  return result.filter((c) => c.amount > 0).sort((a, b) => b.amount - a.amount);
}

interface TrendArgs {
  transactions: Transaction[];
  categories: SpendingCategory[];
  accountId: string | 'all';
  monthKeys: string[];
  topLevelCategoryOf: (id: string | null) => SpendingCategory | null;
}

export function buildMonthlyTrend(args: TrendArgs): MonthlySpend[] {
  const { transactions, accountId, monthKeys, topLevelCategoryOf } = args;

  return monthKeys.map((monthKey) => {
    const scoped = filterScope(transactions, accountId, monthKey);
    const totals: Record<string, number> = {};
    scoped.forEach((t) => {
      const top = topLevelCategoryOf(t.categoryId);
      const key = top ? top.id : '__uncategorised__';
      totals[key] = (totals[key] ?? 0) + t.amount;
    });
    return {
      monthKey,
      label: formatMonthLabel(monthKey),
      totalsByTopCategoryId: totals,
    };
  });
}
