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
        return sum + (item.amount / 12);
    }, 0);

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-4 bg-purple-50/50 border-b border-purple-100 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <PiggyBank className="text-purple-600" size={20} />
                    <h3 className="font-semibold text-lg text-purple-900">Savings</h3>
                </div>
                <span className="bg-purple-200/50 text-purple-700 px-2 py-0.5 rounded text-sm font-medium">
                    Investments & Savings
                </span>
            </div>

            <div className="p-4">
                {savings.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 text-sm">
                        No savings goals added yet.
                    </div>
                ) : (
                    <div className="space-y-3">
                        {savings.map((item) => (
                            <div
                                key={item.id}
                                className="group flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg border border-slate-100 hover:border-purple-100 hover:bg-purple-50/30 transition-all"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-purple-50 text-purple-600 group-hover:bg-purple-100 transition-colors">
                                        <TrendingUp size={18} />
                                    </div>
                                    <div>
                                        <h4 className="font-medium text-slate-900">{item.name}</h4>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded capitalize">
                                                {item.frequency}
                                            </span>
                                            {item.wealthSourceId && wealthSources && (
                                                <span className="text-xs text-purple-600 font-medium whitespace-nowrap overflow-hidden text-ellipsis max-w-[150px]">
                                                    → {wealthSources.find(ws => ws.id === item.wealthSourceId)?.name || 'Linked Account'}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-2 sm:mt-0 font-bold text-slate-900 text-right">
                                    £{item.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    {item.frequency === 'annual' && <span className="text-[10px] font-normal text-slate-400 ml-1">/yr</span>}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100">
                <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-500">Total Monthly Saving</span>
                    <span className="text-lg font-bold text-purple-700">
                        £{totalSavings.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                </div>
            </div>
        </div>
    );
};
