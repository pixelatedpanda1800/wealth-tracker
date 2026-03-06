import React, { useState } from 'react';
import { ShoppingBag, Coffee, ChevronDown, ChevronUp, Calendar } from 'lucide-react';
import { clsx } from 'clsx';
import type { OutgoingItem } from './types';

interface SpendingSectionProps {
    spending: OutgoingItem[];
}

export const SpendingSection: React.FC<SpendingSectionProps> = ({ spending }) => {
    // Calculate total monthly impact
    const totalMonthly = spending.reduce((sum, item) => {
        if (item.frequency === 'monthly') return sum + item.amount;
        return sum + (item.amount / 12);
    }, 0);

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-4 bg-indigo-50/50 border-b border-indigo-100 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <ShoppingBag className="text-indigo-600" size={20} />
                    <h3 className="font-semibold text-lg text-indigo-900">Spending</h3>
                </div>
                <span className="bg-indigo-200/50 text-indigo-700 px-2 py-0.5 rounded text-sm font-medium">
                    Required & Optional
                </span>
            </div>

            <div className="p-4">
                {spending.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 text-sm">
                        No discretionary spending added yet.
                    </div>
                ) : (
                    <div className="space-y-2">
                        {spending.sort((a, b) => b.amount - a.amount).map((item) => (
                            <SpendingItemRow key={item.id} item={item} />
                        ))}
                    </div>
                )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100">
                <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-500">Total Monthly Spending</span>
                    <span className="text-lg font-bold text-indigo-700">
                        £{totalMonthly.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                </div>
            </div>
        </div>
    );
};

const SpendingItemRow: React.FC<{ item: OutgoingItem }> = ({ item }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const hasDetails = item.paymentDate || item.notes;

    // Determine color based on type (required vs optional)
    const isOptional = item.type === 'optional';

    return (
        <div className={clsx(
            "rounded-lg border transition-all",
            isOptional ? "border-slate-100 hover:border-blue-200 hover:bg-blue-50/30" : "border-slate-100 hover:border-amber-200 hover:bg-amber-50/30",
            isExpanded && "bg-slate-50"
        )}>
            <div
                className={clsx("p-3 flex items-center justify-between", hasDetails && "cursor-pointer")}
                onClick={() => hasDetails && setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-3">
                    <div className={clsx(
                        "p-2 rounded-lg",
                        isOptional ? "bg-blue-50 text-blue-600" : "bg-amber-50 text-amber-600"
                    )}>
                        {isOptional ? <Coffee size={16} /> : <ShoppingBag size={16} />}
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h4 className="font-medium text-slate-900">{item.name}</h4>
                            {hasDetails && (
                                <span className="text-slate-400">
                                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className={clsx(
                                "text-[10px] px-1.5 py-0.5 rounded font-medium uppercase tracking-wide",
                                isOptional ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"
                            )}>
                                {item.type}
                            </span>
                            {item.frequency === 'annual' && (
                                <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">Annual</span>
                            )}
                        </div>
                    </div>
                </div>
                <div className="text-right">
                    <div className="font-bold text-slate-900">
                        £{item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                    {item.frequency === 'annual' && (
                        <div className="text-[10px] text-slate-400">
                            £{(item.amount / 12).toLocaleString(undefined, { maximumFractionDigits: 0 })}/mo
                        </div>
                    )}
                </div>
            </div>

            {isExpanded && hasDetails && (
                <div className="px-3 pb-3 pt-0 text-sm text-slate-600 flex gap-4 ml-[44px]">
                    {item.paymentDate && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                            <Calendar size={12} />
                            <span>Payment: <strong>{item.paymentDate}</strong></span>
                        </div>
                    )}
                    {item.notes && (
                        <p className="text-xs text-slate-500 italic">{item.notes}</p>
                    )}
                </div>
            )}
        </div>
    );
};
