import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import type { SpendingCategory, Transaction } from './types';

interface Props {
  isOpen: boolean;
  transaction: Transaction | null;
  categories: SpendingCategory[];
  onClose: () => void;
  onSubmit: (transactionId: string, categoryId: string | null) => void;
}

export const ReassignCategoryModal: React.FC<Props> = ({
  isOpen,
  transaction,
  categories,
  onClose,
  onSubmit,
}) => {
  const [selected, setSelected] = useState<string>('');

  useEffect(() => {
    if (transaction) setSelected(transaction.categoryId ?? '');
  }, [transaction]);

  if (!isOpen || !transaction) return null;

  const topLevels = categories.filter((c) => c.parentId === null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(transaction.id, selected || null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h3 className="font-semibold text-slate-800">Reassign category</h3>
          <button onClick={onClose} className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-4">
          <div className="rounded-lg bg-slate-50 p-3 text-sm">
            <div className="font-medium text-slate-800">{transaction.description}</div>
            <div className="mt-0.5 text-xs text-slate-500">
              {transaction.date} · £
              {transaction.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
          </div>
          <label className="block">
            <span className="text-xs font-medium tracking-wider text-slate-500 uppercase">
              Category
            </span>
            <select
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            >
              <option value="">— Leave uncategorised —</option>
              {topLevels.map((top) => {
                const children = categories.filter((c) => c.parentId === top.id);
                return (
                  <optgroup key={top.id} label={top.name}>
                    <option value={top.id}>{top.name} (general)</option>
                    {children.map((child) => (
                      <option key={child.id} value={child.id}>
                        {child.name}
                      </option>
                    ))}
                  </optgroup>
                );
              })}
            </select>
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
