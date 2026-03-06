import React, { useState, useEffect } from 'react';
import { X, ArrowRightLeft, Loader2, Check, Plus } from 'lucide-react';
import {
    createIncomeTransfer, updateIncomeTransfer, getAccounts,
    type IncomeTransfer, type Account, type AllocationCategory
} from '../../api';

interface IncomeTransferModalProps {
    isOpen: boolean;
    onClose: () => void;
    onTransfersChanged: () => void;
    initialCategory?: AllocationCategory;
    editingTransfer?: IncomeTransfer | null;
}

export const IncomeTransferModal: React.FC<IncomeTransferModalProps> = ({
    isOpen, onClose, onTransfersChanged, initialCategory, editingTransfer
}) => {
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [loading, setLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState<number | ''>('');
    const [category, setCategory] = useState<AllocationCategory>('bills');
    const [sourceAccountId, setSourceAccountId] = useState('');
    const [targetAccountId, setTargetAccountId] = useState('');

    useEffect(() => {
        if (isOpen) {
            fetchAccounts();
            if (editingTransfer) {
                setDescription(editingTransfer.description);
                setAmount(editingTransfer.amount);
                setCategory(editingTransfer.category);
                setSourceAccountId(editingTransfer.sourceAccountId);
                setTargetAccountId(editingTransfer.targetAccountId);
            } else {
                resetForm();
                if (initialCategory) setCategory(initialCategory);
            }
        }
    }, [isOpen, editingTransfer, initialCategory]);

    const fetchAccounts = async () => {
        try {
            setLoading(true);
            const data = await getAccounts();
            setAccounts(data);

            if (!editingTransfer) {
                // If we have accounts, pick reasonable defaults
                if (data.length >= 2) {
                    if (!sourceAccountId) setSourceAccountId(data[0].id);
                    if (!targetAccountId) setTargetAccountId(data[1].id);
                } else if (data.length === 1) {
                    if (!sourceAccountId) setSourceAccountId(data[0].id);
                    if (!targetAccountId) setTargetAccountId(data[0].id);
                }
            }
        } catch (error) {
            console.error('Failed to fetch accounts', error);
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setDescription('');
        setAmount('');
        setCategory(initialCategory || 'bills');
        setSourceAccountId('');
        setTargetAccountId('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!description.trim() || !amount || !sourceAccountId || !targetAccountId) return;

        try {
            setIsSubmitting(true);
            const payload = {
                description,
                amount: Number(amount),
                category,
                sourceAccountId,
                targetAccountId
            };

            if (editingTransfer) {
                await updateIncomeTransfer(editingTransfer.id, payload);
            } else {
                await createIncomeTransfer(payload);
            }

            onTransfersChanged();
            onClose();
        } catch (error) {
            console.error('Failed to save transfer', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl border border-slate-100 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between p-6 border-b border-slate-100">
                    <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <ArrowRightLeft className="text-indigo-600" size={24} />
                        {editingTransfer ? 'Edit Transfer Rule' : 'Add Allocation Rule'}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-lg transition-colors text-slate-400 hover:text-slate-600">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                            <input
                                type="text"
                                placeholder="e.g. Bills Transfer"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                autoFocus
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Amount</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2 text-slate-400">£</span>
                                    <input
                                        type="number"
                                        placeholder="0.00"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value ? Number(e.target.value) : '')}
                                        className="w-full bg-white border border-slate-200 rounded-lg pl-6 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                        min={0}
                                        step="0.01"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Section</label>
                                <select
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value as AllocationCategory)}
                                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                >
                                    <option value="bills">Bills</option>
                                    <option value="spending">Spending</option>
                                    <option value="savings">Savings</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">From Account</label>
                                <select
                                    value={sourceAccountId}
                                    onChange={(e) => setSourceAccountId(e.target.value)}
                                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                    disabled={loading}
                                >
                                    <option value="" disabled>Select Source</option>
                                    {accounts.map(acc => (
                                        <option key={acc.id} value={acc.id}>{acc.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">To Account</label>
                                <select
                                    value={targetAccountId}
                                    onChange={(e) => setTargetAccountId(e.target.value)}
                                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                    disabled={loading}
                                >
                                    <option value="" disabled>Select Target</option>
                                    {accounts.map(acc => (
                                        <option key={acc.id} value={acc.id}>{acc.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={isSubmitting || !description.trim() || !amount || !sourceAccountId || !targetAccountId}
                            className="w-full bg-indigo-600 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : editingTransfer ? <Check size={18} /> : <Plus size={18} />}
                            {editingTransfer ? 'Save Changes' : 'Add Rule'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
