import React, { useState, useEffect, useMemo } from 'react';
import { X, Loader2, RotateCcw } from 'lucide-react';
import { clsx } from 'clsx';
import { updateLiability, bulkUpsertOverpayments, deleteLiabilityOverpayment, type Liability, type LiabilityOverpayment } from '../../api';
import { MONTHS } from '../../utils/constants';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSaved: () => void;
    liability: Liability;
    existingOverpayments: LiabilityOverpayment[];
}

function generateForwardMonths(count: number): Array<{ year: number; month: string; key: string }> {
    const result = [];
    const now = new Date();
    let y = now.getFullYear();
    let mIdx = now.getMonth(); // 0-based
    for (let i = 0; i < count; i++) {
        result.push({
            year: y,
            month: MONTHS[mIdx],
            key: `${y}-${String(mIdx + 1).padStart(2, '0')}`,
        });
        mIdx++;
        if (mIdx === 12) { mIdx = 0; y++; }
    }
    return result;
}

export const OverpaymentPlanModal: React.FC<Props> = ({
    isOpen, onClose, onSaved, liability, existingOverpayments,
}) => {
    const [recurring, setRecurring] = useState(
        liability.recurringOverpayment != null ? String(liability.recurringOverpayment) : ''
    );
    // per-month grid values keyed by 'YYYY-MM'
    const [gridValues, setGridValues] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const months = useMemo(() => generateForwardMonths(36), []);

    // Seed grid from existing overpayments
    useEffect(() => {
        const init: Record<string, string> = {};
        for (const op of existingOverpayments) {
            const key = `${op.year}-${String(MONTHS.indexOf(op.month) + 1).padStart(2, '0')}`;
            init[key] = String(op.amount);
        }
        setGridValues(init);
    }, [existingOverpayments]);

    const recurringNum = recurring !== '' ? Number(recurring) : 0;

    const setGridValue = (key: string, val: string) =>
        setGridValues(prev => ({ ...prev, [key]: val }));

    const resetMonth = (key: string) =>
        setGridValues(prev => { const next = { ...prev }; delete next[key]; return next; });

    const effectiveValue = (key: string) =>
        key in gridValues ? gridValues[key] : recurring !== '' ? recurring : '';

    const isOverridden = (key: string) => key in gridValues;

    const handleSave = async () => {
        try {
            setIsSubmitting(true);

            // Update recurring on the liability
            await updateLiability(liability.id, {
                recurringOverpayment: recurring !== '' ? Number(recurring) : undefined,
            });

            // Build overpayment rows: only send months that differ from recurring
            const toUpsert: { liabilityId: string; year: number; month: string; amount: number }[] = [];
            const existingMap = new Map(
                existingOverpayments.map(op => [
                    `${op.year}-${String(MONTHS.indexOf(op.month) + 1).padStart(2, '0')}`,
                    op,
                ])
            );

            // Delete rows that are now back to recurring
            for (const [key, op] of existingMap) {
                const gridVal = gridValues[key];
                if (gridVal === undefined || Number(gridVal) === recurringNum) {
                    await deleteLiabilityOverpayment(op.id);
                }
            }

            // Upsert rows that differ from recurring
            for (const { key, year, month } of months) {
                if (isOverridden(key)) {
                    const amount = Number(gridValues[key]);
                    if (amount !== recurringNum) {
                        toUpsert.push({ liabilityId: liability.id, year, month, amount });
                    }
                }
            }

            if (toUpsert.length > 0) {
                await bulkUpsertOverpayments({ liabilityId: liability.id, overpayments: toUpsert });
            }

            onSaved();
            onClose();
        } catch (err) {
            console.error('Failed to save overpayment plan', err);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    const inputCls = 'w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl border border-slate-100 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between p-6 border-b border-slate-100 flex-shrink-0">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">Overpayment Plan</h2>
                        <p className="text-sm text-slate-400 mt-0.5">{liability.name}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-lg transition-colors text-slate-400 hover:text-slate-600"><X size={20} /></button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-5">
                    {/* Recurring overpayment */}
                    <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 space-y-2">
                        <label className="text-sm font-semibold text-indigo-800">Monthly Recurring Overpayment (£)</label>
                        <input
                            type="number"
                            min={0}
                            step="0.01"
                            placeholder="e.g. 200"
                            value={recurring}
                            onChange={e => setRecurring(e.target.value)}
                            className="w-full bg-white border border-indigo-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                        />
                        <p className="text-xs text-indigo-600">Applied to every future month unless overridden below.</p>
                    </div>

                    {/* Per-month grid */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-slate-700">Per-Month Overrides (next 36 months)</h3>
                            <p className="text-xs text-slate-400">Overridden months shown in amber</p>
                        </div>

                        <div className="space-y-1.5">
                            {months.map(({ key, year, month }) => {
                                const overridden = isOverridden(key);
                                const val = effectiveValue(key);
                                return (
                                    <div key={key} className={clsx('flex items-center gap-3 px-3 py-2 rounded-lg transition-colors', overridden ? 'bg-amber-50 border border-amber-200' : 'bg-slate-50 border border-slate-100')}>
                                        <span className={clsx('w-20 text-xs font-medium flex-shrink-0', overridden ? 'text-amber-700' : 'text-slate-500')}>
                                            {month} {year}
                                        </span>
                                        <input
                                            type="number"
                                            min={0}
                                            step="0.01"
                                            placeholder={recurring || '0'}
                                            value={overridden ? gridValues[key] : ''}
                                            onChange={e => setGridValue(key, e.target.value)}
                                            className={clsx(
                                                'flex-1 border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all',
                                                overridden
                                                    ? 'bg-white border-amber-300 focus:border-amber-400'
                                                    : 'bg-white border-slate-200 focus:border-indigo-400 text-slate-400'
                                            )}
                                        />
                                        {overridden && (
                                            <button
                                                type="button"
                                                onClick={() => resetMonth(key)}
                                                title="Reset to recurring"
                                                className="p-1.5 text-amber-500 hover:text-amber-700 hover:bg-amber-100 rounded-md transition-colors flex-shrink-0"
                                            >
                                                <RotateCcw size={13} />
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className="flex gap-3 p-6 border-t border-slate-100 bg-slate-50/50 flex-shrink-0">
                    <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-white transition-colors">Cancel</button>
                    <button
                        onClick={handleSave}
                        disabled={isSubmitting}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50"
                    >
                        {isSubmitting && <Loader2 className="animate-spin" size={18} />}
                        Save Plan
                    </button>
                </div>
            </div>
        </div>
    );
};
