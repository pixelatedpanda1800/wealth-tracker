import React, { useState, useEffect } from 'react';
import { X, Loader2, Lock } from 'lucide-react';
import { getWealthSources, getInvestmentHoldings, saveWealthSnapshot, type WealthSource } from '../api';
import type { WealthEntry } from '../utils/dataUtils';
import { MONTHS } from '../utils/constants';

interface AddEntryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: () => void;
    existingEntries: WealthEntry[];
}

export const AddEntryModal: React.FC<AddEntryModalProps> = ({ isOpen, onClose, onSubmit, existingEntries }) => {
    const currentYear = new Date().getFullYear();
    const [sources, setSources] = useState<WealthSource[]>([]);
    const [managedSourceIds, setManagedSourceIds] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState<{
        month: string;
        year: string;
        values: Record<string, string>;
    }>({
        month: new Intl.DateTimeFormat('en-US', { month: 'short' }).format(new Date()),
        year: currentYear.toString(),
        values: {},
    });

    useEffect(() => {
        if (isOpen) {
            fetchSources();
        }
    }, [isOpen]);

    useEffect(() => {
        const existing = existingEntries.find(
            e => e.month === formData.month && e.year === Number(formData.year)
        );

        if (existing) {
            const newValues: Record<string, string> = {};
            Object.entries(existing.values).forEach(([id, val]) => {
                newValues[id] = val.toString();
            });
            sources.forEach(s => {
                if (newValues[s.id] === undefined) {
                    newValues[s.id] = '';
                }
            });
            setFormData(prev => ({ ...prev, values: newValues }));
        } else {
            const emptyValues: Record<string, string> = {};
            sources.forEach(s => emptyValues[s.id] = '');
            setFormData(prev => ({ ...prev, values: emptyValues }));
        }
    }, [formData.month, formData.year, existingEntries, sources]);

    const fetchSources = async () => {
        try {
            setLoading(true);
            const [data, holdings] = await Promise.all([
                getWealthSources(),
                getInvestmentHoldings(),
            ]);
            setSources(data);
            // Sources that have holdings are auto-managed — mark them read-only
            const managedIds = new Set(holdings.map(h => h.wealthSourceId));
            setManagedSourceIds(managedIds);
        } catch (error) {
            console.error('Failed to fetch sources', error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        if (name.startsWith('source_')) {
            const sourceId = name.replace('source_', '');
            setFormData((prev) => ({
                ...prev,
                values: { ...prev.values, [sourceId]: value }
            }));
        } else {
            setFormData((prev) => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const numericValues: Record<string, number> = {};
        Object.entries(formData.values).forEach(([id, val]) => {
            numericValues[id] = Number(val) || 0;
        });

        const snapshotData = {
            month: formData.month,
            year: Number(formData.year),
            values: numericValues,
        };

        try {
            await saveWealthSnapshot(snapshotData as any);
            onSubmit();
            onClose();
        } catch (error) {
            console.error('Failed to save snapshot', error);
            alert('Failed to save snapshot. Check terminal.');
        }
    };

    const years = [currentYear - 1, currentYear, currentYear + 1];

    const cashSources = sources.filter(s => s.category === 'cash');
    const investmentSources = sources.filter(s => s.category === 'investment');
    const pensionSources = sources.filter(s => s.category === 'pension');

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl border border-slate-100 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="flex items-center justify-between p-6 border-b border-slate-100">
                    <h2 className="text-xl font-bold text-slate-900">Add/Update Monthly Entry</h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-lg transition-colors text-slate-400 hover:text-slate-600">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Month</label>
                            <select
                                name="month"
                                value={formData.month}
                                onChange={handleChange}
                                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                            >
                                {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Year</label>
                            <select
                                name="year"
                                value={formData.year}
                                onChange={handleChange}
                                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                            >
                                {years.map(y => <option key={y} value={y.toString()}>{y}</option>)}
                            </select>
                        </div>

                        {loading ? (
                            <div className="col-span-2 flex justify-center py-8">
                                <Loader2 className="animate-spin text-indigo-600" size={24} />
                            </div>
                        ) : (
                            <>
                                {cashSources.length > 0 && <SourceSection title="Cash" sources={cashSources} values={formData.values} onChange={handleChange} managedSourceIds={managedSourceIds} />}
                                {investmentSources.length > 0 && <SourceSection title="Investments" sources={investmentSources} values={formData.values} onChange={handleChange} managedSourceIds={managedSourceIds} />}
                                {pensionSources.length > 0 && <SourceSection title="Pensions" sources={pensionSources} values={formData.values} onChange={handleChange} managedSourceIds={managedSourceIds} />}

                                {sources.length === 0 && (
                                    <div className="col-span-2 py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                        <p className="text-slate-500 text-sm">No wealth sources configured.</p>
                                        <p className="text-slate-400 text-xs mt-1">Add them via the settings icon on the dashboard.</p>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    <div className="flex gap-3 pt-4 sticky bottom-0 bg-white pb-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={sources.length === 0}
                            className="flex-1 px-4 py-2.5 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200 disabled:opacity-50"
                        >
                            Save Entry
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const SourceSection = ({ title, sources, values, onChange, managedSourceIds }: { title: string, sources: WealthSource[], values: Record<string, string>, onChange: any, managedSourceIds: Set<string> }) => (
    <div className="col-span-2 space-y-4">
        <div className="flex items-center gap-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">{title}</h3>
            <div className="h-px bg-slate-100 flex-1" />
        </div>
        <div className="grid grid-cols-2 gap-4">
            {sources.map(source => (
                managedSourceIds.has(source.id) ? (
                    <ManagedField key={source.id} label={source.name} value={values[source.id] || ''} />
                ) : (
                    <InputField
                        key={source.id}
                        label={`${source.name} (£)`}
                        name={`source_${source.id}`}
                        value={values[source.id] || ''}
                        onChange={onChange}
                    />
                )
            ))}
        </div>
    </div>
);

const InputField = ({ label, name, value, onChange }: { label: string, name: string, value: string, onChange: any }) => (
    <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">{label}</label>
        <input
            type="number"
            name={name}
            value={value}
            onChange={onChange}
            placeholder="0.00"
            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
        />
    </div>
);

const ManagedField = ({ label, value }: { label: string, value: string }) => (
    <div className="space-y-2">
        <label className="text-sm font-medium text-slate-400 flex items-center gap-1.5">
            <Lock size={12} />
            {label} (£)
        </label>
        <div className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-400 text-sm flex items-center justify-between">
            <span>{value ? `£${Number(value).toLocaleString()}` : '—'}</span>
            <span className="text-xs">Managed via Investments</span>
        </div>
    </div>
);
