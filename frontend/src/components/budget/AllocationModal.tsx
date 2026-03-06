import React, { useState, useEffect } from 'react';
import { X, Plus, Loader2, Check } from 'lucide-react';
import {
    createAllocation, updateAllocation, getAccounts,
    type Allocation, type Account, type AllocationCategory
} from '../../api';

interface AllocationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAllocationsChanged: () => void;
    initialCategory?: AllocationCategory;
    editingAllocation?: Allocation | null;
}

export const AllocationModal: React.FC<AllocationModalProps> = ({
    isOpen, onClose, onAllocationsChanged, initialCategory, editingAllocation
}) => {
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [loading, setLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState<number | ''>('');
    const [category, setCategory] = useState<AllocationCategory>('bills');
    const [accountId, setAccountId] = useState('');

    useEffect(() => {
        if (isOpen) {
            fetchAccounts();
            if (editingAllocation) {
                setDescription(editingAllocation.description);
                setAmount(editingAllocation.amount);
                setCategory(editingAllocation.category);
                setAccountId(editingAllocation.accountId);
            } else {
                resetForm();
                if (initialCategory) setCategory(initialCategory);
            }
        }
    }, [isOpen, editingAllocation, initialCategory]);

    const fetchAccounts = async () => {
        try {
            setLoading(true);
            const data = await getAccounts();
            setAccounts(data);
            // Default select first account if adding new and no account selected
            if (!editingAllocation && !accountId && data.length > 0) {
                setAccountId(data[0].id);
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
        setAccountId('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!description.trim() || !amount || !accountId) return;

        try {
            setIsSubmitting(true);
            const payload = {
                description,
                amount: Number(amount),
                category,
                accountId
            };

            if (editingAllocation) {
                await updateAllocation(editingAllocation.id, payload);
            } else {
                await createAllocation(payload);
            }

            onAllocationsChanged();
            onClose();
        } catch (error) {
            console.error('Failed to save allocation', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl border border-slate-100 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between p-6 border-b border-slate-100">
                    <h2 className="text-xl font-bold text-slate-900">
                        {editingAllocation ? 'Edit Allocation' : 'Add Allocation'}
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
                                placeholder="e.g. Weekly Groceries"
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
                                <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
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

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Account</label>
                            <select
                                value={accountId}
                                onChange={(e) => setAccountId(e.target.value)}
                                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                disabled={loading}
                            >
                                <option value="" disabled>Select Account</option>
                                {accounts.map(acc => (
                                    <option key={acc.id} value={acc.id}>{acc.name} ({acc.type})</option>
                                ))}
                            </select>
                            {accounts.length === 0 && !loading && (
                                <p className="text-xs text-rose-500 mt-1">
                                    No accounts found. Please add an account first via "Manage Accounts".
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={isSubmitting || !description.trim() || !amount || !accountId}
                            className="w-full bg-indigo-600 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : editingAllocation ? <Check size={18} /> : <Plus size={18} />}
                            {editingAllocation ? 'Save Changes' : 'Add Allocation'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
