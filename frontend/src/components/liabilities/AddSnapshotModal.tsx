import React, { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { saveLiabilitySnapshot, type Liability, type LiabilitySnapshot } from '../../api';
import { MONTHS } from '../../utils/constants';
import { LIABILITY_TYPE_LABELS, type LiabilityType } from './types';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: () => void;
    liabilities: Liability[];
    existingSnapshots: LiabilitySnapshot[];
}

type FieldValues = Record<string, { balance: string; paymentMade: string; interestPaid: string }>;

export const AddSnapshotModal: React.FC<Props> = ({
    isOpen, onClose, onSubmit, liabilities, existingSnapshots,
}) => {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Intl.DateTimeFormat('en-US', { month: 'short' }).format(new Date());
    const years = [currentYear - 2, currentYear - 1, currentYear, currentYear + 1];

    const [month, setMonth] = useState(currentMonth);
    const [year, setYear] = useState(String(currentYear));
    const [fields, setFields] = useState<FieldValues>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const active = liabilities.filter(l => !l.archivedAt);

    useEffect(() => {
        const selectedIndex = Number(year) * 12 + MONTHS.indexOf(month as any);
        const newFields: FieldValues = {};
        for (const l of active) {
            const snaps = existingSnapshots.filter(s => s.liabilityId === l.id);
            const exact = snaps.find(s => s.year === Number(year) && s.month === month);
            if (exact) {
                newFields[l.id] = {
                    balance: String(exact.balance),
                    paymentMade: exact.paymentMade != null ? String(exact.paymentMade) : '',
                    interestPaid: exact.interestPaid != null ? String(exact.interestPaid) : '',
                };
            } else {
                const prior = snaps
                    .filter(s => s.year * 12 + MONTHS.indexOf(s.month as any) < selectedIndex)
                    .sort((a, b) => (b.year * 12 + MONTHS.indexOf(b.month as any)) - (a.year * 12 + MONTHS.indexOf(a.month as any)))[0];
                newFields[l.id] = {
                    balance: prior ? String(prior.balance) : '',
                    paymentMade: '',
                    interestPaid: '',
                };
            }
        }
        setFields(newFields);
    }, [month, year, liabilities, existingSnapshots]);

    const setField = (id: string, key: 'balance' | 'paymentMade' | 'interestPaid', val: string) =>
        setFields(prev => ({ ...prev, [id]: { ...prev[id], [key]: val } }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setIsSubmitting(true);
            const saves = active
                .filter(l => fields[l.id]?.balance !== '')
                .map(l => saveLiabilitySnapshot({
                    liabilityId: l.id,
                    year: Number(year),
                    month,
                    balance: Number(fields[l.id].balance) || 0,
                    paymentMade: fields[l.id].paymentMade !== '' ? Number(fields[l.id].paymentMade) : undefined,
                    interestPaid: fields[l.id].interestPaid !== '' ? Number(fields[l.id].interestPaid) : undefined,
                }));
            await Promise.all(saves);
            onSubmit();
            onClose();
        } catch (err) {
            console.error('Failed to save snapshots', err);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    // Group by type
    const byType = (Object.keys(LIABILITY_TYPE_LABELS) as LiabilityType[])
        .map(type => ({ type, items: active.filter(l => l.type === type) }))
        .filter(g => g.items.length > 0);

    const inputCls = 'w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl border border-slate-100 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between p-6 border-b border-slate-100 flex-shrink-0">
                    <h2 className="text-xl font-bold text-slate-900">Add / Update Balances</h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-lg transition-colors text-slate-400 hover:text-slate-600"><X size={20} /></button>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
                        {/* Month / Year */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Month</label>
                                <select value={month} onChange={e => setMonth(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all">
                                    {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Year</label>
                                <select value={year} onChange={e => setYear(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all">
                                    {years.map(y => <option key={y} value={String(y)}>{y}</option>)}
                                </select>
                            </div>
                        </div>

                        {active.length === 0 ? (
                            <div className="py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                <p className="text-slate-500 text-sm">No active liabilities.</p>
                            </div>
                        ) : (
                            byType.map(({ type, items }) => (
                                <div key={type} className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{LIABILITY_TYPE_LABELS[type]}</span>
                                        <div className="h-px bg-slate-100 flex-1" />
                                    </div>
                                    {items.map(l => (
                                        <div key={l.id} className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: l.color ?? '#64748B' }} />
                                                <span className="font-medium text-slate-800 text-sm">{l.name}</span>
                                            </div>
                                            <div className="grid grid-cols-3 gap-3">
                                                <div className="space-y-1">
                                                    <label className="text-xs font-medium text-slate-600">Balance (£) *</label>
                                                    <input type="number" min={0} step="0.01" placeholder="0.00" value={fields[l.id]?.balance ?? ''} onChange={e => setField(l.id, 'balance', e.target.value)} className={inputCls} />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-xs font-medium text-slate-500">Payment Made (£)</label>
                                                    <input type="number" min={0} step="0.01" placeholder="optional" value={fields[l.id]?.paymentMade ?? ''} onChange={e => setField(l.id, 'paymentMade', e.target.value)} className={inputCls} />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-xs font-medium text-slate-500">Interest Paid (£)</label>
                                                    <input type="number" min={0} step="0.01" placeholder="optional" value={fields[l.id]?.interestPaid ?? ''} onChange={e => setField(l.id, 'interestPaid', e.target.value)} className={inputCls} />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ))
                        )}

                        <p className="text-xs text-slate-400 text-center">Liabilities with no balance entered will be skipped.</p>
                    </div>

                    <div className="flex gap-3 p-6 border-t border-slate-100 bg-slate-50/50 flex-shrink-0">
                        <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-white transition-colors">Cancel</button>
                        <button type="submit" disabled={isSubmitting || active.length === 0} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50">
                            {isSubmitting && <Loader2 className="animate-spin" size={18} />}
                            Save Balances
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
