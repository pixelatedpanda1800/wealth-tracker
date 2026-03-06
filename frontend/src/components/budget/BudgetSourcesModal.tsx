import React, { useState, useEffect } from 'react';
import { X, Trash2, Plus, Loader2, Pencil, Check, Home, ChevronDown, ChevronUp, PiggyBank, Banknote } from 'lucide-react';
import { clsx } from 'clsx';
import {
    getIncomes, createIncome, updateIncome, deleteIncome,
    getOutgoings, createOutgoing, updateOutgoing, deleteOutgoing,
    getWealthSources,
    type IncomeSource, type OutgoingSource, type OutgoingType, type Frequency, type WealthSource
} from '../../api';

interface BudgetSourcesModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSourcesChanged: () => void;
}

type TabType = 'incomes' | 'outgoings' | 'savings';

export const BudgetSourcesModal: React.FC<BudgetSourcesModalProps> = ({ isOpen, onClose, onSourcesChanged }) => {
    const [activeTab, setActiveTab] = useState<TabType>('incomes');
    const [incomes, setIncomes] = useState<IncomeSource[]>([]);
    const [outgoings, setOutgoings] = useState<OutgoingSource[]>([]);
    const [wealthSources, setWealthSources] = useState<WealthSource[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Form state for income
    const [incomeName, setIncomeName] = useState('');
    const [incomeCategory, setIncomeCategory] = useState('Salary');
    const [incomeAmount, setIncomeAmount] = useState<number | ''>('');

    // Form state for outgoing
    const [outgoingName, setOutgoingName] = useState('');
    const [outgoingType, setOutgoingType] = useState<OutgoingType>('required');
    const [outgoingFrequency, setOutgoingFrequency] = useState<Frequency>('monthly');
    const [outgoingAmount, setOutgoingAmount] = useState<number | ''>('');
    const [outgoingPaymentDate, setOutgoingPaymentDate] = useState<number | ''>('');
    const [outgoingNotes, setOutgoingNotes] = useState('');
    const [wealthSourceId, setWealthSourceId] = useState('');

    useEffect(() => {
        if (isOpen) {
            fetchData();
        } else {
            resetForm();
        }
    }, [isOpen]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [incomeData, outgoingData, wealthData] = await Promise.all([
                getIncomes(),
                getOutgoings(),
                getWealthSources()
            ]);
            setIncomes(incomeData);
            setOutgoings(outgoingData);
            setWealthSources(wealthData);
        } catch (error) {
            console.error('Failed to fetch budget data', error);
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setEditingId(null);
        setIncomeName('');
        setIncomeCategory('Salary');
        setIncomeAmount('');
        setOutgoingName('');
        setOutgoingType(activeTab === 'savings' ? 'savings' : 'required');
        setOutgoingFrequency('monthly');
        setOutgoingAmount('');
        setOutgoingPaymentDate('');
        setOutgoingNotes('');
        setWealthSourceId('');
    };

    const handleIncomeSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!incomeName.trim() || incomeAmount === '') return;

        try {
            setIsSubmitting(true);
            if (editingId) {
                await updateIncome(editingId, {
                    name: incomeName,
                    category: incomeCategory,
                    amount: Number(incomeAmount)
                });
            } else {
                await createIncome({
                    name: incomeName,
                    category: incomeCategory,
                    amount: Number(incomeAmount)
                });
            }
            await fetchData();
            onSourcesChanged();
            resetForm();
        } catch (error) {
            console.error('Failed to save income', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleOutgoingSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const isSavings = activeTab === 'savings' || outgoingType === 'savings';
        if ((!isSavings && !outgoingName.trim()) || outgoingAmount === '') return;
        if (isSavings && !wealthSourceId) return;

        try {
            setIsSubmitting(true);

            let finalName = outgoingName;
            let finalFrequency = outgoingFrequency;

            if (isSavings) {
                const ws = wealthSources.find(s => s.id === wealthSourceId);
                finalName = ws ? ws.name : outgoingName;
                finalFrequency = 'monthly';
            }

            const payload: Omit<OutgoingSource, 'id'> = {
                name: finalName,
                type: isSavings ? 'savings' : outgoingType,
                frequency: finalFrequency,
                amount: Number(outgoingAmount),
                paymentDate: outgoingPaymentDate ? Number(outgoingPaymentDate) : null,
                notes: outgoingNotes.trim() || null,
                wealthSourceId: isSavings ? wealthSourceId : null
            };

            if (editingId) {
                await updateOutgoing(editingId, payload);
            } else {
                await createOutgoing(payload);
            }
            await fetchData();
            onSourcesChanged();
            resetForm();
        } catch (error) {
            console.error('Failed to save outgoing', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditIncome = (income: IncomeSource) => {
        setEditingId(income.id);
        setIncomeName(income.name);
        setIncomeCategory(income.category);
        setIncomeAmount(income.amount);
    };

    const handleEditOutgoing = (outgoing: OutgoingSource) => {
        setEditingId(outgoing.id);
        setOutgoingName(outgoing.name);
        setOutgoingType(outgoing.type);
        setOutgoingFrequency(outgoing.frequency);
        setOutgoingAmount(outgoing.amount);
        setOutgoingPaymentDate(outgoing.paymentDate ?? '');
        setOutgoingNotes(outgoing.notes ?? '');
        setWealthSourceId(outgoing.wealthSourceId ?? '');

        if (outgoing.type === 'savings') {
            setActiveTab('savings');
        } else {
            setActiveTab('outgoings');
        }
    };

    const handleDeleteIncome = async (id: string) => {
        if (confirmingDeleteId !== id) {
            setConfirmingDeleteId(id);
            return;
        }
        try {
            await deleteIncome(id);
            setConfirmingDeleteId(null);
            if (editingId === id) resetForm();
            await fetchData();
            onSourcesChanged();
        } catch (error) {
            console.error('Failed to delete income', error);
        }
    };

    const handleDeleteOutgoing = async (id: string) => {
        if (confirmingDeleteId !== id) {
            setConfirmingDeleteId(id);
            return;
        }
        try {
            await deleteOutgoing(id);
            setConfirmingDeleteId(null);
            if (editingId === id) resetForm();
            await fetchData();
            onSourcesChanged();
        } catch (error) {
            console.error('Failed to delete outgoing', error);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl border border-slate-100 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between p-6 border-b border-slate-100 flex-shrink-0">
                    <h2 className="text-xl font-bold text-slate-900">Manage Budget Sources</h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-lg transition-colors text-slate-400 hover:text-slate-600">
                        <X size={20} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-100">
                    <button
                        onClick={() => { setActiveTab('incomes'); resetForm(); }}
                        className={clsx(
                            "flex-1 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2",
                            activeTab === 'incomes' ? "text-emerald-600 border-b-2 border-emerald-600" : "text-slate-500 hover:text-slate-700"
                        )}
                    >
                        <Banknote size={16} /> Incomes
                    </button>
                    <button
                        onClick={() => { setActiveTab('outgoings'); resetForm(); }}
                        className={clsx(
                            "flex-1 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2",
                            activeTab === 'outgoings' ? "text-rose-600 border-b-2 border-rose-600" : "text-slate-500 hover:text-slate-700"
                        )}
                    >
                        <Home size={16} /> Outgoings
                    </button>
                    <button
                        onClick={() => { setActiveTab('savings'); resetForm(); }}
                        className={clsx(
                            "flex-1 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2",
                            activeTab === 'savings' ? "text-purple-600 border-b-2 border-purple-600" : "text-slate-500 hover:text-slate-700"
                        )}
                    >
                        <PiggyBank size={16} /> Savings
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {activeTab === 'incomes' ? (
                        <>
                            {/* Income Form */}
                            <form onSubmit={handleIncomeSubmit} className="space-y-4 bg-emerald-50/50 p-4 rounded-xl border border-emerald-100">
                                <h3 className="text-sm font-semibold text-emerald-700 uppercase tracking-wider">
                                    {editingId ? 'Edit Income' : 'Add New Income'}
                                </h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <input
                                        type="text"
                                        placeholder="Name (e.g. Main Salary)"
                                        value={incomeName}
                                        onChange={(e) => setIncomeName(e.target.value)}
                                        className="col-span-2 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                                    />
                                    <input
                                        type="text"
                                        placeholder="Category (e.g. Salary)"
                                        value={incomeCategory}
                                        onChange={(e) => setIncomeCategory(e.target.value)}
                                        className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                                    />
                                    <input
                                        type="number"
                                        placeholder="Amount (£)"
                                        value={incomeAmount}
                                        onChange={(e) => setIncomeAmount(e.target.value ? Number(e.target.value) : '')}
                                        className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                                        min={0}
                                        step="0.01"
                                    />
                                </div>
                                <div className="flex gap-2">
                                    {editingId && (
                                        <button type="button" onClick={resetForm} className="px-3 py-2 rounded-lg border border-slate-200 text-slate-500 text-sm hover:bg-slate-50">
                                            Cancel
                                        </button>
                                    )}
                                    <button
                                        type="submit"
                                        disabled={isSubmitting || !incomeName.trim() || incomeAmount === ''}
                                        className="flex-1 bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : editingId ? <Check size={16} /> : <Plus size={16} />}
                                        {editingId ? 'Save' : 'Add Income'}
                                    </button>
                                </div>
                            </form>

                            {/* Income List */}
                            <div className="space-y-3">
                                <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Current Incomes</h3>
                                {loading ? (
                                    <div className="flex justify-center py-8"><Loader2 className="animate-spin text-emerald-600" size={24} /></div>
                                ) : incomes.length === 0 ? (
                                    <p className="text-center text-slate-400 py-4 text-sm italic">No incomes added yet.</p>
                                ) : (
                                    incomes.map((income) => (
                                        <div key={income.id} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-lg hover:border-emerald-100">
                                            <div>
                                                <p className="font-medium text-slate-900">{income.name}</p>
                                                <p className="text-xs text-slate-500">{income.category} · £{Number(income.amount).toLocaleString()}</p>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <button onClick={() => handleEditIncome(income)} className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-slate-50 rounded-lg"><Pencil size={16} /></button>
                                                <button
                                                    onClick={() => handleDeleteIncome(income.id)}
                                                    className={clsx("px-2 py-1 rounded-lg text-sm", confirmingDeleteId === income.id ? "bg-rose-600 text-white" : "text-rose-500 hover:bg-rose-50")}
                                                >
                                                    {confirmingDeleteId === income.id ? 'Confirm?' : <Trash2 size={16} />}
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </>
                    ) : (
                        <>
                            {/* Outgoing/Savings Form */}
                            <form onSubmit={handleOutgoingSubmit} className={clsx(
                                "space-y-4 p-4 rounded-xl border",
                                activeTab === 'savings' ? "bg-purple-50/50 border-purple-100" : "bg-slate-50 border-slate-200"
                            )}>
                                <h3 className={clsx("text-sm font-semibold uppercase tracking-wider", activeTab === 'savings' ? "text-purple-700" : "text-slate-700")}>
                                    {editingId ? `Edit ${activeTab === 'savings' ? 'Saving' : 'Outgoing'}` : `Add New ${activeTab === 'savings' ? 'Saving' : 'Outgoing'}`}
                                </h3>
                                <div className="grid grid-cols-2 gap-3">
                                    {activeTab !== 'savings' && (
                                        <input
                                            type="text"
                                            placeholder="Name (e.g. Mortgage)"
                                            value={outgoingName}
                                            onChange={(e) => setOutgoingName(e.target.value)}
                                            className="col-span-2 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500"
                                        />
                                    )}

                                    {activeTab === 'savings' ? (
                                        <div className="col-span-2 relative">
                                            <select
                                                value={wealthSourceId}
                                                onChange={(e) => setWealthSourceId(e.target.value)}
                                                disabled={!!editingId}
                                                className={clsx(
                                                    "w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 appearance-none",
                                                    editingId && "opacity-60 cursor-not-allowed bg-slate-50"
                                                )}
                                            >
                                                <option value="">Select Account (Wealth Tracker)</option>
                                                {wealthSources
                                                    .filter(ws =>
                                                        !outgoings.some(o => o.type === 'savings' && o.wealthSourceId === ws.id) ||
                                                        (editingId && outgoings.find(o => o.id === editingId)?.wealthSourceId === ws.id)
                                                    )
                                                    .map(source => (
                                                        <option key={source.id} value={source.id}>{source.name} ({source.category})</option>
                                                    ))}
                                            </select>
                                            {!editingId && (
                                                <div className="absolute right-3 top-2.5 pointer-events-none text-slate-400">
                                                    <ChevronDown size={14} />
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <select
                                            value={outgoingType}
                                            onChange={(e) => setOutgoingType(e.target.value as OutgoingType)}
                                            className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500"
                                        >
                                            <option value="non-negotiable">Non-Negotiable</option>
                                            <option value="required">Required</option>
                                            <option value="optional">Optional</option>
                                        </select>
                                    )}

                                    {activeTab !== 'savings' && (
                                        <select
                                            value={outgoingFrequency}
                                            onChange={(e) => setOutgoingFrequency(e.target.value as Frequency)}
                                            className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500"
                                        >
                                            <option value="monthly">Monthly</option>
                                            <option value="annual">Annual</option>
                                        </select>
                                    )}

                                    <input
                                        type="number"
                                        placeholder="Amount (£)"
                                        value={outgoingAmount}
                                        onChange={(e) => setOutgoingAmount(e.target.value ? Number(e.target.value) : '')}
                                        className={clsx(
                                            "bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500",
                                            activeTab === 'savings' && "col-span-2"
                                        )}
                                        min={0}
                                        step="0.01"
                                    />
                                    {activeTab === 'outgoings' && (
                                        <div className="relative col-span-2">
                                            <select
                                                value={outgoingPaymentDate}
                                                onChange={(e) => setOutgoingPaymentDate(e.target.value ? Number(e.target.value) : '')}
                                                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500 appearance-none"
                                            >
                                                <option value="">Payment Day</option>
                                                {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                                                    <option key={day} value={day}>{day}{
                                                        day === 1 || day === 21 || day === 31 ? 'st' :
                                                            day === 2 || day === 22 ? 'nd' :
                                                                day === 3 || day === 23 ? 'rd' : 'th'
                                                    }</option>
                                                ))}
                                            </select>
                                            <div className="absolute right-3 top-2.5 pointer-events-none text-slate-400">
                                                <ChevronDown size={14} />
                                            </div>
                                        </div>
                                    )}
                                    <textarea
                                        placeholder="Notes (optional)"
                                        value={outgoingNotes}
                                        onChange={(e) => setOutgoingNotes(e.target.value)}
                                        className="col-span-2 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500 resize-none h-16"
                                    />
                                </div>
                                <div className="flex gap-2">
                                    {editingId && (
                                        <button type="button" onClick={resetForm} className="px-3 py-2 rounded-lg border border-slate-200 text-slate-500 text-sm hover:bg-slate-50">
                                            Cancel
                                        </button>
                                    )}
                                    <button
                                        type="submit"
                                        disabled={isSubmitting || (activeTab !== 'savings' && !outgoingName.trim()) || outgoingAmount === '' || (activeTab === 'savings' && !wealthSourceId)}
                                        className={clsx(
                                            "flex-1 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2",
                                            activeTab === 'savings' ? "bg-purple-600 hover:bg-purple-700" : "bg-slate-900 hover:bg-slate-800"
                                        )}
                                    >
                                        {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : editingId ? <Check size={16} /> : <Plus size={16} />}
                                        {editingId ? 'Save' : `Add ${activeTab === 'savings' ? 'Saving' : 'Outgoing'}`}
                                    </button>
                                </div>
                            </form>

                            {/* List */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
                                    {activeTab === 'savings' ? 'Current Savings' : 'Current Outgoings'}
                                </h3>
                                {loading ? (
                                    <div className="flex justify-center py-8"><Loader2 className="animate-spin text-slate-600" size={24} /></div>
                                ) : (activeTab === 'savings' ? outgoings.filter(o => o.type === 'savings') : outgoings.filter(o => o.type !== 'savings')).length === 0 ? (
                                    <p className="text-center text-slate-400 py-4 text-sm italic">Nothing added yet.</p>
                                ) : (
                                    <div className="space-y-4">
                                        {activeTab === 'savings' ? (
                                            <OutgoingSectionGroup
                                                title="Savings & Investments"
                                                items={outgoings.filter(o => o.type === 'savings').sort((a, b) => b.amount - a.amount)}
                                                onEdit={handleEditOutgoing}
                                                onDelete={handleDeleteOutgoing}
                                                confirmingDeleteId={confirmingDeleteId}
                                                wealthSources={wealthSources}
                                                colorClasses={{
                                                    header: "bg-purple-50 hover:bg-purple-100 text-purple-700",
                                                    badge: "bg-purple-200 text-purple-700",
                                                    itemHover: "hover:border-purple-300"
                                                }}
                                            />
                                        ) : (
                                            <>
                                                <OutgoingSectionGroup
                                                    title="Non-Negotiable"
                                                    items={outgoings.filter(o => o.type === 'non-negotiable').sort((a, b) => b.amount - a.amount)}
                                                    onEdit={handleEditOutgoing}
                                                    onDelete={handleDeleteOutgoing}
                                                    confirmingDeleteId={confirmingDeleteId}
                                                    colorClasses={{
                                                        header: "bg-rose-50 hover:bg-rose-100 text-rose-700",
                                                        badge: "bg-rose-200 text-rose-700",
                                                        itemHover: "hover:border-rose-300"
                                                    }}
                                                />
                                                <OutgoingSectionGroup
                                                    title="Required"
                                                    items={outgoings.filter(o => o.type === 'required').sort((a, b) => b.amount - a.amount)}
                                                    onEdit={handleEditOutgoing}
                                                    onDelete={handleDeleteOutgoing}
                                                    confirmingDeleteId={confirmingDeleteId}
                                                    colorClasses={{
                                                        header: "bg-amber-50 hover:bg-amber-100 text-amber-700",
                                                        badge: "bg-amber-200 text-amber-700",
                                                        itemHover: "hover:border-amber-300"
                                                    }}
                                                />
                                                <OutgoingSectionGroup
                                                    title="Optional"
                                                    items={outgoings.filter(o => o.type === 'optional').sort((a, b) => b.amount - a.amount)}
                                                    onEdit={handleEditOutgoing}
                                                    onDelete={handleDeleteOutgoing}
                                                    confirmingDeleteId={confirmingDeleteId}
                                                    colorClasses={{
                                                        header: "bg-blue-50 hover:bg-blue-100 text-blue-700",
                                                        badge: "bg-blue-200 text-blue-700",
                                                        itemHover: "hover:border-blue-300"
                                                    }}
                                                />
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        </>
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

interface OutgoingSectionGroupProps {
    title: string;
    items: OutgoingSource[];
    onEdit: (item: OutgoingSource) => void;
    onDelete: (id: string) => void;
    confirmingDeleteId: string | null;
    wealthSources?: WealthSource[];
    colorClasses: {
        header: string;
        badge: string;
        itemHover: string;
    };
}

const OutgoingSectionGroup: React.FC<OutgoingSectionGroupProps> = ({ title, items, onEdit, onDelete, confirmingDeleteId, wealthSources, colorClasses }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    if (items.length === 0) return null;

    return (
        <div className="border border-slate-100 rounded-xl overflow-hidden bg-white shadow-sm">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className={clsx("w-full flex items-center justify-between p-3 transition-colors", colorClasses.header)}
            >
                <div className="flex items-center gap-2">
                    <span className="font-bold text-sm uppercase tracking-tight">{title}</span>
                    <span className={clsx("text-xs px-1.5 py-0.5 rounded-full font-semibold", colorClasses.badge)}>
                        {items.length}
                    </span>
                </div>
                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {isExpanded && (
                <div className="p-2 space-y-2">
                    {items.map((outgoing) => {
                        const linkedWealthSource = wealthSources?.find(ws => ws.id === outgoing.wealthSourceId);
                        return (
                            <div key={outgoing.id} className={clsx("flex items-center justify-between p-3 bg-white border border-slate-50 rounded-lg group transition-all", colorClasses.itemHover)}>
                                <div className="overflow-hidden">
                                    <p className="font-medium text-slate-900 text-sm truncate">{outgoing.name}</p>
                                    <p className="text-xs text-slate-500">
                                        {outgoing.frequency} · £{Number(outgoing.amount).toLocaleString()}
                                        {linkedWealthSource && <span className="text-emerald-600 font-medium ml-2">→ {linkedWealthSource.name}</span>}
                                    </p>
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => onEdit(outgoing)}
                                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                                    >
                                        <Pencil size={14} />
                                    </button>
                                    <button
                                        onClick={() => onDelete(outgoing.id)}
                                        className={clsx(
                                            "px-2 py-1 rounded-lg text-xs font-semibold transition-all",
                                            confirmingDeleteId === outgoing.id ? "bg-rose-600 text-white shadow-sm" : "text-rose-500 hover:bg-rose-50"
                                        )}
                                    >
                                        {confirmingDeleteId === outgoing.id ? 'Delete?' : <Trash2 size={14} />}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
