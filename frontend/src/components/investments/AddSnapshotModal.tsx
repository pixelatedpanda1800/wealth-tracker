import React, { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { saveInvestmentSnapshot, type InvestmentHolding, type InvestmentSnapshot } from '../../api';
import { MONTHS } from '../../utils/constants';
import { HOLDING_TYPE_LABELS } from './types';
import type { WealthSource } from '../../api';

interface AddSnapshotModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: () => void;
    holdings: InvestmentHolding[];
    existingSnapshots: InvestmentSnapshot[];
    investmentSources: WealthSource[];
}

type FieldValues = Record<string, { value: string; units: string; costBasis: string }>;

export const AddSnapshotModal: React.FC<AddSnapshotModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    holdings,
    existingSnapshots,
    investmentSources,
}) => {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Intl.DateTimeFormat('en-US', { month: 'short' }).format(new Date());

    const [month, setMonth] = useState(currentMonth);
    const [year, setYear] = useState(currentYear.toString());
    const [fields, setFields] = useState<FieldValues>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const years = [currentYear - 2, currentYear - 1, currentYear, currentYear + 1];

    // Populate fields when month/year or holdings change
    useEffect(() => {
        const newFields: FieldValues = {};
        for (const holding of holdings) {
            const existing = existingSnapshots.find(
                s => s.holdingId === holding.id && s.year === Number(year) && s.month === month
            );
            newFields[holding.id] = {
                value: existing ? existing.value.toString() : '',
                units: existing?.units != null ? existing.units.toString() : '',
                costBasis: existing?.costBasis != null ? existing.costBasis.toString() : '',
            };
        }
        setFields(newFields);
    }, [month, year, holdings, existingSnapshots]);

    const handleFieldChange = (holdingId: string, field: 'value' | 'units' | 'costBasis', val: string) => {
        setFields(prev => ({
            ...prev,
            [holdingId]: { ...prev[holdingId], [field]: val },
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setIsSubmitting(true);
            const saves = holdings
                .filter(h => fields[h.id]?.value !== '')
                .map(h => saveInvestmentSnapshot({
                    holdingId: h.id,
                    year: Number(year),
                    month,
                    value: Number(fields[h.id].value) || 0,
                    units: fields[h.id].units !== '' ? Number(fields[h.id].units) : undefined,
                    costBasis: fields[h.id].costBasis !== '' ? Number(fields[h.id].costBasis) : undefined,
                }));
            await Promise.all(saves);
            onSubmit();
            onClose();
        } catch (error) {
            console.error('Failed to save snapshots', error);
            alert('Failed to save. Check terminal.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    // Group holdings by account
    const holdingsBySource = investmentSources.map(source => ({
        source,
        holdings: holdings.filter(h => h.wealthSourceId === source.id),
    })).filter(g => g.holdings.length > 0);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl border border-slate-100 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between p-6 border-b border-slate-100 flex-shrink-0">
                    <h2 className="text-xl font-bold text-slate-900">Add / Update Values</h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-lg transition-colors text-slate-400 hover:text-slate-600">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
                        {/* Month / Year picker */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Month</label>
                                <select
                                    value={month}
                                    onChange={e => setMonth(e.target.value)}
                                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                >
                                    {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Year</label>
                                <select
                                    value={year}
                                    onChange={e => setYear(e.target.value)}
                                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                >
                                    {years.map(y => <option key={y} value={y.toString()}>{y}</option>)}
                                </select>
                            </div>
                        </div>

                        {holdings.length === 0 ? (
                            <div className="py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                <p className="text-slate-500 text-sm">No holdings configured.</p>
                                <p className="text-slate-400 text-xs mt-1">Add holdings via "Manage Holdings" first.</p>
                            </div>
                        ) : (
                            holdingsBySource.map(({ source, holdings: accountHoldings }) => (
                                <div key={source.id} className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{source.name}</span>
                                        <div className="h-px bg-slate-100 flex-1" />
                                    </div>
                                    {accountHoldings.map(holding => (
                                        <div key={holding.id} className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: holding.color || '#64748B' }} />
                                                <span className="font-medium text-slate-800 text-sm">{holding.name}</span>
                                                <span className="text-xs text-slate-400 bg-white border border-slate-200 rounded-md px-2 py-0.5">
                                                    {HOLDING_TYPE_LABELS[holding.type]}
                                                </span>
                                            </div>
                                            <div className="grid grid-cols-3 gap-3">
                                                <div className="space-y-1">
                                                    <label className="text-xs font-medium text-slate-600">Value (£) *</label>
                                                    <input
                                                        type="number"
                                                        placeholder="0.00"
                                                        value={fields[holding.id]?.value || ''}
                                                        onChange={e => handleFieldChange(holding.id, 'value', e.target.value)}
                                                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-xs font-medium text-slate-500">Units</label>
                                                    <input
                                                        type="number"
                                                        placeholder="optional"
                                                        value={fields[holding.id]?.units || ''}
                                                        onChange={e => handleFieldChange(holding.id, 'units', e.target.value)}
                                                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-500"
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-xs font-medium text-slate-500">Cost Basis (£)</label>
                                                    <input
                                                        type="number"
                                                        placeholder="optional"
                                                        value={fields[holding.id]?.costBasis || ''}
                                                        onChange={e => handleFieldChange(holding.id, 'costBasis', e.target.value)}
                                                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-500"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ))
                        )}

                        <p className="text-xs text-slate-400 text-center">
                            Holdings with no value entered will be skipped. Values update the Asset Tracker automatically.
                        </p>
                    </div>

                    <div className="flex gap-3 p-6 border-t border-slate-100 bg-slate-50/50 flex-shrink-0">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-white transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting || holdings.length === 0}
                            className="flex-1 px-4 py-2.5 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : null}
                            Save Values
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
