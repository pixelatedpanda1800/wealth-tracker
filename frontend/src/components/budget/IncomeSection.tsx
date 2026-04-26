import React from 'react';
import { Banknote } from 'lucide-react';
import type { IncomeItem } from './types';

interface IncomeSectionProps {
  incomes: IncomeItem[];
}

export const IncomeSection: React.FC<IncomeSectionProps> = ({ incomes }) => {
  const totalIncome = incomes.reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm">
      <div className="flex items-center justify-between bg-emerald-600 p-4 text-white">
        <div className="flex items-center gap-2">
          <Banknote className="text-emerald-100" size={20} />
          <h3 className="text-lg font-semibold">Incomes</h3>
        </div>
        <span className="rounded bg-emerald-500/50 px-2 py-0.5 text-sm font-medium">Monthly</span>
      </div>

      <div className="p-4">
        {incomes.length === 0 ? (
          <div className="py-8 text-center text-sm text-slate-400">
            No regular incomes added yet.
          </div>
        ) : (
          <div className="space-y-3">
            {incomes.map((income) => (
              <div
                key={income.id}
                className="group flex flex-col justify-between rounded-lg border border-slate-100 p-3 transition-all hover:border-emerald-100 hover:bg-emerald-50/30 sm:flex-row sm:items-center"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600 transition-colors group-hover:bg-emerald-100">
                    <Banknote size={18} />
                  </div>
                  <div>
                    <h4 className="font-medium text-slate-900">{income.name}</h4>
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-500">
                      {income.category}
                    </span>
                  </div>
                </div>
                <div className="mt-2 font-bold text-slate-900 sm:mt-0">
                  £
                  {income.amount.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-slate-100 bg-slate-50 p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-slate-500">Total Regular Income</span>
          <span className="text-lg font-bold text-emerald-700">
            £
            {totalIncome.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
        </div>
      </div>
    </div>
  );
};
