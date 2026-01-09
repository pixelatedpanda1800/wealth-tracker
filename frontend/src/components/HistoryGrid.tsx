import React from 'react';
import { clsx } from 'clsx';
import type { WealthEntry } from '../utils/dataUtils';
import { type WealthSource } from '../api';

interface HistoryGridProps {
    data: WealthEntry[];
    sources: WealthSource[];
}

export const HistoryGrid: React.FC<HistoryGridProps> = ({ data, sources }) => {
    // Data is already processed by Dashboard
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
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 overflow-x-auto">
            <h3 className="text-lg font-semibold mb-6 text-slate-900">Historical Entries (12 Months)</h3>
            <table className="w-full text-sm text-left border-collapse">
                <thead>
                    <tr className="text-slate-500 border-b border-slate-100">
                        <th className="pb-4 font-medium min-w-[150px]">Wealth Source</th>
                        {history.map((d, i) => (
                            <th key={`${d.month}-${d.year}-${i}`} className={clsx(
                                "pb-4 font-medium text-right whitespace-nowrap px-4",
                                d.isEstimate && "text-slate-400 italic font-normal"
                            )}>
                                {d.month} '{d.year.toString().slice(-2)}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                    {sortedSources.map((source) => (
                        <tr key={source.id} className="group hover:bg-slate-50 transition-colors">
                            <td className="py-4">
                                <span className="font-medium text-slate-700">{source.name}</span>
                                <span className="ml-2 px-1.5 py-0.5 text-[10px] uppercase tracking-wider font-bold bg-slate-100 text-slate-500 rounded">
                                    {source.category}
                                </span>
                            </td>
                            {history.map((d, i) => {
                                const val = d.values?.[source.id] || 0;
                                return (
                                    <td key={`${source.id}-${d.month}-${d.year}-${i}`} className={clsx(
                                        "py-4 text-right transition-colors px-4",
                                        d.isEstimate ? "text-slate-400" : "text-slate-600 font-medium"
                                    )}>
                                        £{val.toLocaleString()}
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                    {/* Total Row */}
                    <tr className="bg-slate-50 font-bold border-t-2 border-slate-200">
                        <td className="py-4 text-indigo-700">Total Wealth</td>
                        {history.map((d, i) => (
                            <td key={`total-${d.month}-${d.year}-${i}`} className={clsx(
                                "py-4 text-right px-4",
                                d.isEstimate ? "text-slate-400" : "text-indigo-600"
                            )}>
                                £{(d.total || 0).toLocaleString()}
                            </td>
                        ))}
                    </tr>
                </tbody>
            </table>
        </div>
    );
};
