import { useCallback, useMemo, useState } from 'react';
import { defaultCategories, TOP_LEVEL_COLORS } from './defaultCategories';
import { buildMockTransactions, mockAccounts } from './mockData';
import type { MockAccount, SpendingCategory, Transaction } from './types';

let idCounter = 0;
const nextId = (prefix: string) => `${prefix}-${Date.now()}-${++idCounter}`;

const FALLBACK_COLORS = [
  '#0ea5e9',
  '#f97316',
  '#a855f7',
  '#22c55e',
  '#eab308',
  '#ef4444',
  '#06b6d4',
];

export function useSpendingMockStore() {
  const [categories, setCategories] = useState<SpendingCategory[]>(defaultCategories);
  const [transactions, setTransactions] = useState<Transaction[]>(() => buildMockTransactions());
  const [accounts] = useState<MockAccount[]>(mockAccounts);

  const reassignCategory = useCallback((transactionId: string, categoryId: string | null) => {
    setTransactions((prev) =>
      prev.map((t) =>
        t.id === transactionId ? { ...t, categoryId, needsReview: categoryId === null } : t,
      ),
    );
  }, []);

  const addCategory = useCallback((name: string, parentId: string | null) => {
    setCategories((prev) => {
      const color = parentId
        ? prev.find((c) => c.id === parentId)?.color || TOP_LEVEL_COLORS.other
        : FALLBACK_COLORS[prev.filter((c) => c.parentId === null).length % FALLBACK_COLORS.length];
      return [
        ...prev,
        {
          id: nextId('cat'),
          name,
          parentId,
          color,
        },
      ];
    });
  }, []);

  const renameCategory = useCallback((id: string, name: string) => {
    setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, name } : c)));
  }, []);

  const deleteCategory = useCallback((id: string) => {
    setCategories((prev) => {
      const toRemove = new Set<string>([id]);
      prev.forEach((c) => {
        if (c.parentId === id) toRemove.add(c.id);
      });
      return prev.filter((c) => !toRemove.has(c.id));
    });
    setTransactions((prev) =>
      prev.map((t) =>
        t.categoryId && t.categoryId === id ? { ...t, categoryId: null, needsReview: true } : t,
      ),
    );
  }, []);

  const simulateUpload = useCallback((accountId: string, monthKey: string) => {
    const [yearStr, monthStr] = monthKey.split('-');
    const year = Number(yearStr);
    const monthIndex = Number(monthStr) - 1;
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

    const fresh: Transaction[] = [
      { desc: 'NEW MERCHANT *IMPORT', amount: 42.5, cat: null, review: true },
      { desc: 'COFFEE SHOP', amount: 4.2, cat: 'food-eating-out', review: false },
      { desc: 'UNKNOWN VENDOR', amount: 18.75, cat: null, review: true },
    ].map((s, i) => ({
      id: nextId('upload'),
      accountId,
      date: `${yearStr}-${monthStr}-${String(Math.min(daysInMonth, 5 + i * 3)).padStart(2, '0')}`,
      description: s.desc,
      amount: s.amount,
      categoryId: s.cat,
      needsReview: s.review,
    }));

    setTransactions((prev) => [...fresh, ...prev]);
    return fresh.length;
  }, []);

  const categoriesById = useMemo(() => {
    const map = new Map<string, SpendingCategory>();
    categories.forEach((c) => map.set(c.id, c));
    return map;
  }, [categories]);

  const topLevelCategoryOf = useCallback(
    (categoryId: string | null): SpendingCategory | null => {
      if (!categoryId) return null;
      const cat = categoriesById.get(categoryId);
      if (!cat) return null;
      if (cat.parentId === null) return cat;
      return categoriesById.get(cat.parentId) ?? null;
    },
    [categoriesById],
  );

  return {
    categories,
    categoriesById,
    accounts,
    transactions,
    topLevelCategoryOf,
    reassignCategory,
    addCategory,
    renameCategory,
    deleteCategory,
    simulateUpload,
  };
}

export type SpendingMockStore = ReturnType<typeof useSpendingMockStore>;
