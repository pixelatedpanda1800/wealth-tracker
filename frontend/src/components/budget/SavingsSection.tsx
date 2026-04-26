import React from 'react';
import { PiggyBank, TrendingUp } from 'lucide-react';
import type { OutgoingItem } from './types';
import type { WealthSource } from '../../api';

interface SavingsSectionProps {
  savings: OutgoingItem[];
  wealthSources?: WealthSource[];
}

export const SavingsSection: React.FC<SavingsSectionProps> = ({ savings, wealthSources }) => {
  const totalSavings = savings.reduce((sum, item) => {
    if (item.frequency === 'monthly') return sum + item.amount;
    return sum + item.amount / 12;
  }, 0);

  return (
    <div className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-purple-100 bg-purple-50/50 p-4">
        <div className="flex items-center gap-2">
          <PiggyBank className="text-purple-600" size={20} />
          <h3 className="text-lg font-semibold text-purple-900">Savings</h3>
        </div>
        <span className="rounded bg-purple-200/50 px-2 py-0.5 text-sm font-medium text-purple-700">
          Investments & Savings
        </span>
      </div>

      <div className="p-4">
        {savings.length === 0 ? (
          <div className="py-8 text-center text-sm text-slate-400">No savings goals added yet.</div>
        ) : (
          <div className="space-y-3">
            {savings.map((item) => (
              <div
                key={item.id}
                className="group flex flex-col justify-between rounded-lg border border-slate-100 p-3 transition-all hover:border-purple-100 hover:bg-purple-50/30 sm:flex-row sm:items-center"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-purple-50 p-2 text-purple-600 transition-colors group-hover:bg-purple-100">
                    <TrendingUp size={18} />
                  </div>
                  <div>
                    <h4 className="font-medium text-slate-900">{item.name}</h4>
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-500 capitalize">
                        {item.frequency}
                      </span>
                      {item.wealthSourceId && wealthSources && (
                        <span className="max-w-[150px] overflow-hidden text-xs font-medium text-ellipsis whitespace-nowrap text-purple-600">
                          →{' '}
                          {wealthSources.find((ws) => ws.id === item.wealthSourceId)?.name ||
                            'Linked Account'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="mt-2 text-right font-bold text-slate-900 sm:mt-0">
                  £
                  {item.amount.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                  {item.frequency === 'annual' && (
                    <span className="ml-1 text-[10px] font-normal text-slate-400">/yr</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-slate-100 bg-slate-50 p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-slate-500">Total Monthly Saving</span>
          <span className="text-lg font-bold text-purple-700">
            £
            {totalSavings.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
        </div>
      </div>
    </div>
  );
};
