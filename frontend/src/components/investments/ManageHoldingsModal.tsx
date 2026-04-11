import React, { useState, useEffect } from 'react';
import { X, Trash2, Plus, Loader2, Pencil, Check } from 'lucide-react';
import { clsx } from 'clsx';
import {
    createInvestmentHolding,
    updateInvestmentHolding,
    deleteInvestmentHolding,
    type InvestmentHolding,
} from '../../api';
import type { WealthSource } from '../../api';
import { HOLDING_TYPE_LABELS, type HoldingType } from './types';

const PRESET_COLORS = [
    '#6366F1', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
    '#EC4899', '#06B6D4', '#F97316', '#14B8A6', '#64748B',
    '#84CC16', '#EAB308', '#3B82F6', '#A855F7', '#D946EF', '#F43F5E',
];

const HOLDING_TYPES: HoldingType[] = ['fund', 'etf', 'stock', 'bond', 'other'];

interface ManageHoldingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onChanged: () => void;
    holdings: InvestmentHolding[];
    investmentSources: WealthSource[];
}

export const ManageHoldingsModal: React.FC<ManageHoldingsModalProps> = ({
    isOpen,
    onClose,
    onChanged,
    holdings,
    investmentSources,
}) => {
    const [name, setName] = useState('');
    const [ticker, setTicker] = useState('');
    const [type, setType] = useState<HoldingType>('fund');
    const [wealthSourceId, setWealthSourceId] = useState('');
    const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0]);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Set default wealthSourceId to first available source
    useEffect(() => {
        if (isOpen && !editingId && investmentSources.length > 0) {
            setWealthSourceId(investmentSources[0].id);
        }
    }, [isOpen, investmentSources, editingId]);

    // Auto-pick a color not already in use
    useEffect(() => {
        if (!editingId) {
            const usedColors = new Set(holdings.map(h => h.color));
            const available = PRESET_COLORS.find(c => !usedColors.has(c));
            if (available) setSelectedColor(available);
        }
    }, [holdings, editingId]);

    const resetForm = () => {
        setName('');
        setTicker('');
        setType('fund');
        setWealthSourceId(investmentSources[0]?.id || '');
        setEditingId(null);
        const usedColors = new Set(holdings.map(h => h.color));
        const available = PRESET_COLORS.find(c => !usedColors.has(c)) || PRESET_COLORS[0];
        setSelectedColor(available);
    };

    const handleEditClick = (holding: InvestmentHolding) => {
        setEditingId(holding.id);
        setName(holding.name);
        setTicker(holding.ticker || '');
        setType(holding.type);
        setWealthSourceId(holding.wealthSourceId);
        setSelectedColor(holding.color || PRESET_COLORS[0]);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !wealthSourceId) return;

        try {
            setIsSubmitting(true);
            const payload = {
                name: name.trim(),
                ticker: ticker.trim() || undefined,
                type,
                color: selectedColor,
                wealthSourceId,
            };

            if (editingId) {
                await updateInvestmentHolding(editingId, payload);
            } else {
                await createInvestmentHolding(payload);
            }

            onChanged();
            resetForm();
        } catch (error) {
            console.error('Failed to save holding', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (confirmingDeleteId !== id) {
            setConfirmingDeleteId(id);
            return;
        }
        try {
            await deleteInvestmentHolding(id);
            setConfirmingDeleteId(null);
            if (editingId === id) resetForm();
            onChanged();
        } catch (error) {
            console.error('Failed to delete holding', error);
        }
    };

    if (!isOpen) return null;

    const usedColors = new Set(
        holdings
            .filter(h => h.id !== editingId)
            .map(h => h.color)
            .filter(Boolean) as string[]
    );

    // Group holdings by account for the list view
    const holdingsBySource = investmentSources.map(source => ({
        source,
        holdings: holdings.filter(h => h.wealthSourceId === source.id),
    })).filter(g => g.holdings.length > 0);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl border border-slate-100 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between p-6 border-b border-slate-100 flex-shrink-0">
                    <h2 className="text-xl font-bold text-slate-900">Manage Holdings</h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-lg transition-colors text-slate-400 hover:text-slate-600">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
                    {/* Add / Edit Form */}
                    <form onSubmit={handleSubmit} className="space-y-4 bg-slate-50 p-5 rounded-xl border border-slate-100">
                        <div className="flex justify-between items-center">
                            <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
                                {editingId ? 'Edit Holding' : 'Add New Holding'}
                            </h3>
                        </div>

                        {investmentSources.length === 0 ? (
                            <p className="text-sm text-slate-500 italic">
                                No investment accounts found. Add a WealthSource with category "Investment" or "Pension" first.
                            </p>
                        ) : (
                            <div className="space-y-3">
                                <input
                                    type="text"
                                    placeholder="Holding name (e.g. Vanguard S&P 500 ETF)"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
                                />

                                <input
                                    type="text"
                                    placeholder="TradingView ticker (e.g. LSE:VUSA) — optional"
                                    value={ticker}
                                    onChange={e => setTicker(e.target.value)}
                                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm text-sm"
                                />

                                <div className="grid grid-cols-2 gap-3">
                                    <select
                                        value={type}
                                        onChange={e => setType(e.target.value as HoldingType)}
                                        className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
                                    >
                                        {HOLDING_TYPES.map(t => (
                                            <option key={t} value={t}>{HOLDING_TYPE_LABELS[t]}</option>
                                        ))}
                                    </select>

                                    <select
                                        value={wealthSourceId}
                                        onChange={e => setWealthSourceId(e.target.value)}
                                        className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
                                    >
                                        {investmentSources.map(s => (
                                            <option key={s.id} value={s.id}>{s.name}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Color picker */}
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Colour</label>
                                    <div className="grid grid-cols-8 gap-2">
                                        {PRESET_COLORS.map(color => {
                                            const isUsed = usedColors.has(color);
                                            const isSelected = selectedColor === color;
                                            return (
                                                <button
                                                    key={color}
                                                    type="button"
                                                    disabled={isUsed}
                                                    onClick={() => setSelectedColor(color)}
                                                    className={clsx(
                                                        'w-8 h-8 rounded-full flex items-center justify-center transition-all',
                                                        isUsed ? 'opacity-20 cursor-not-allowed' : 'hover:scale-110 cursor-pointer shadow-sm',
                                                        isSelected && 'ring-2 ring-offset-2 ring-indigo-500 scale-110'
                                                    )}
                                                    style={{ backgroundColor: color }}
                                                >
                                                    {isSelected && <Check size={14} className="text-white drop-shadow-md" />}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="flex gap-2 pt-1">
                                    {editingId && (
                                        <button
                                            type="button"
                                            onClick={resetForm}
                                            className="px-4 py-2.5 rounded-xl bg-white border border-rose-200 text-rose-500 hover:bg-rose-50 transition-colors shadow-sm"
                                        >
                                            <X size={18} />
                                        </button>
                                    )}
                                    <button
                                        type="submit"
                                        disabled={isSubmitting || !name.trim() || !wealthSourceId}
                                        className={clsx(
                                            'flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-colors shadow-sm disabled:opacity-50',
                                            editingId
                                                ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                                                : 'bg-indigo-600 text-white hover:bg-indigo-700'
                                        )}
                                    >
                                        {isSubmitting ? (
                                            <Loader2 className="animate-spin" size={18} />
                                        ) : editingId ? (
                                            <><Check size={18} /> Save</>
                                        ) : (
                                            <><Plus size={18} /> Add Holding</>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}
                    </form>

                    {/* Holdings list grouped by account */}
                    {holdingsBySource.length > 0 && (
                        <div className="space-y-6">
                            <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Current Holdings</h3>
                            {holdingsBySource.map(({ source, holdings: accountHoldings }) => (
                                <div key={source.id} className="space-y-2">
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{source.name}</span>
                                        <div className="h-px bg-slate-100 flex-1" />
                                    </div>
                                    {accountHoldings.map(holding => (
                                        <div
                                            key={holding.id}
                                            className={clsx(
                                                'flex items-center justify-between p-4 bg-white border rounded-xl shadow-sm transition-all',
                                                editingId === holding.id
                                                    ? 'border-indigo-600 border-2 ring-4 ring-indigo-500/10'
                                                    : 'border-slate-100 hover:border-slate-200'
                                            )}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className="w-3 h-3 rounded-full flex-shrink-0"
                                                    style={{ backgroundColor: holding.color || '#64748B' }}
                                                />
                                                <div>
                                                    <p className="font-medium text-slate-900">{holding.name}</p>
                                                    <p className="text-xs text-slate-400">
                                                        {HOLDING_TYPE_LABELS[holding.type]}
                                                        {holding.ticker && <span className="ml-2 font-mono">{holding.ticker}</span>}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => handleEditClick(holding)}
                                                    disabled={!!editingId}
                                                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-lg transition-colors disabled:opacity-40"
                                                >
                                                    <Pencil size={16} />
                                                </button>
                                                {!editingId && (
                                                    <button
                                                        onClick={() => handleDelete(holding.id)}
                                                        className={clsx(
                                                            'px-3 py-1.5 rounded-lg transition-all text-sm font-medium',
                                                            confirmingDeleteId === holding.id
                                                                ? 'bg-rose-600 text-white'
                                                                : 'text-rose-500 hover:bg-rose-50'
                                                        )}
                                                    >
                                                        {confirmingDeleteId === holding.id ? 'Confirm?' : <Trash2 size={16} />}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    )}

                    {holdings.length === 0 && (
                        <p className="text-center text-slate-400 text-sm italic">No holdings added yet.</p>
                    )}
                </div>

                <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex-shrink-0">
                    <button
                        onClick={onClose}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-white transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};
