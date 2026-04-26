import React, { useMemo } from 'react';
import { Pencil, AlertCircle } from 'lucide-react';
import { clsx } from 'clsx';
import type { SpendingCategory, Transaction } from './types';

interface Props {
  transactions: Transaction[];
  categoriesById: Map<string, SpendingCategory>;
  onReassign: (txn: Transaction) => void;
  filterCategoryId: string | 'all' | '__uncategorised__';
  onFilterChange: (id: string | 'all' | '__uncategorised__') => void;
  topLevelCategories: SpendingCategory[];
}

export const TransactionList: React.FC<Props> = ({
  transactions,
  categoriesById,
  onReassign,
  filterCategoryId,
  onFilterChange,
  topLevelCategories,
}) => {
  const filtered = useMemo(() => {
    if (filterCategoryId === 'all') return transactions;
    if (filterCategoryId === '__uncategorised__') {
      return transactions.filter((t) => t.needsReview || !t.categoryId);
    }
    return transactions.filter((t) => {
      if (!t.categoryId) return false;
      const cat = categoriesById.get(t.categoryId);
      if (!cat) return false;
      return cat.id === filterCategoryId || cat.parentId === filterCategoryId;
    });
  }, [transactions, filterCategoryId, categoriesById]);

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-6 py-4">
        <h3 className="font-semibold text-slate-800">Transactions</h3>
        <select
          value={filterCategoryId}
          onChange={(e) => onFilterChange(e.target.value as any)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm"
        >
          <option value="all">All categories</option>
          <option value="__uncategorised__">Needs review</option>
          {topLevelCategories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div className="max-h-96 divide-y divide-slate-100 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="px-6 py-8 text-center text-sm text-slate-400">
            No transactions match this filter.
          </div>
        ) : (
          filtered.map((txn) => {
            const cat = txn.categoryId ? categoriesById.get(txn.categoryId) : null;
            return (
              <div key={txn.id} className="flex items-center gap-3 px-6 py-3 hover:bg-slate-50">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium text-slate-800">
                      {txn.description}
                    </span>
                    {txn.needsReview && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-rose-100 bg-rose-50 px-2 py-0.5 text-xs text-rose-700">
                        <AlertCircle size={12} /> Needs review
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 text-xs text-slate-400">{txn.date}</div>
                </div>
                <div className="flex items-center gap-3">
                  {cat ? (
                    <span
                      className={clsx(
                        'rounded-full border px-2 py-0.5 text-xs',
                        'border-slate-200 bg-slate-50 text-slate-600',
                      )}
                      style={{ borderColor: `${cat.color}33`, color: cat.color }}
                    >
                      {cat.name}
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400 italic">Uncategorised</span>
                  )}
                  <span className="w-20 text-right text-sm font-semibold text-slate-800">
                    £
                    {txn.amount.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                  <button
                    onClick={() => onReassign(txn)}
                    className="rounded-md p-1.5 text-slate-500 hover:bg-slate-200"
                    title="Reassign category"
                  >
                    <Pencil size={14} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
