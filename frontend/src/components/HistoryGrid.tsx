import React from 'react';
import { clsx } from 'clsx';
import type { WealthEntry } from '../utils/dataUtils';
import { type WealthSource } from '../api';

interface HistoryGridProps {
  data: WealthEntry[];
  sources: WealthSource[];
}

export const HistoryGrid: React.FC<HistoryGridProps> = ({ data, sources }) => {
  // Data is already processed by AssetTracker
  const history = data;

  // Sort sources by category: cash, investment, pension
  const sortedSources = [...sources].sort((a, b) => {
    const categoryOrder = { cash: 0, investment: 1, pension: 2 };
    const orderA = categoryOrder[a.category] ?? 3;
    const orderB = categoryOrder[b.category] ?? 3;
    if (orderA !== orderB) return orderA - orderB;
    // Within same category, sort alphabetically by name
    return a.name.localeCompare(b.name);
  });

  if (history.length === 0) return null;

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
      <h3 className="mb-6 text-lg font-semibold text-slate-900">Historical Entries (12 Months)</h3>
      <table className="w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-slate-100 text-slate-500">
            <th className="min-w-[150px] pb-4 font-medium">Wealth Source</th>
            {history.map((d, i) => (
              <th
                key={`${d.month}-${d.year}-${i}`}
                className={clsx(
                  'px-4 pb-4 text-right font-medium whitespace-nowrap',
                  d.isEstimate && 'font-normal text-slate-400 italic',
                )}
              >
                {d.month} '{d.year.toString().slice(-2)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {sortedSources.map((source) => (
            <tr key={source.id} className="group transition-colors hover:bg-slate-50">
              <td className="py-4">
                <span className="font-medium text-slate-700">{source.name}</span>
                <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                  {source.category}
                </span>
              </td>
              {history.map((d, i) => {
                const val = d.values?.[source.id] || 0;
                return (
                  <td
                    key={`${source.id}-${d.month}-${d.year}-${i}`}
                    className={clsx(
                      'px-4 py-4 text-right transition-colors',
                      d.isEstimate ? 'text-slate-400' : 'font-medium text-slate-600',
                    )}
                  >
                    £{val.toLocaleString()}
                  </td>
                );
              })}
            </tr>
          ))}
          {/* Total Row */}
          <tr className="border-t-2 border-slate-200 bg-slate-50 font-bold">
            <td className="py-4 text-indigo-700">Total Wealth</td>
            {history.map((d, i) => (
              <td
                key={`total-${d.month}-${d.year}-${i}`}
                className={clsx(
                  'px-4 py-4 text-right',
                  d.isEstimate ? 'text-slate-400' : 'text-indigo-600',
                )}
              >
                £{(d.total || 0).toLocaleString()}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
};
