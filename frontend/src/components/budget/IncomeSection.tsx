import React from 'react';
import { Banknote } from 'lucide-react';
import type { IncomeItem } from './types';

interface IncomeSectionProps {
    incomes: IncomeItem[];
}

export const IncomeSection: React.FC<IncomeSectionProps> = ({ incomes }) => {
    const totalIncome = incomes.reduce((sum, item) => sum + item.amount, 0);

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-4 bg-emerald-600 text-white flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <Banknote className="text-emerald-100" size={20} />
                    <h3 className="font-semibold text-lg">Incomes</h3>
                </div>
                <span className="bg-emerald-500/50 px-2 py-0.5 rounded text-sm font-medium">
                    Monthly
                </span>
            </div>

            <div className="p-4">
                {incomes.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 text-sm">
                        No regular incomes added yet.
                    </div>
                ) : (
                    <div className="space-y-3">
                        {incomes.map((income) => (
                            <div
                                key={income.id}
                                className="group flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg border border-slate-100 hover:border-emerald-100 hover:bg-emerald-50/30 transition-all"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100 transition-colors">
                                        <Banknote size={18} />
                                    </div>
                                    <div>
                                        <h4 className="font-medium text-slate-900">{income.name}</h4>
                                        <span className="text-xs text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                                            {income.category}
                                        </span>
                                    </div>
                                </div>
                                <div className="mt-2 sm:mt-0 font-bold text-slate-900">
                                    £{income.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100">
                <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-500">Total Regular Income</span>
                    <span className="text-lg font-bold text-emerald-700">
                        £{totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                </div>
            </div>
        </div>
    );
};
