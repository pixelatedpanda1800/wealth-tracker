import { logger } from '../../utils/logger';
import React, { useState, useEffect } from 'react';
import { X, Plus, Loader2, Check } from 'lucide-react';
import {
  createAllocation,
  updateAllocation,
  getAccounts,
  type Allocation,
  type Account,
} from '../../api';

interface AllocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAllocationsChanged: () => void;
  initialAccountId?: string;
  editingAllocation?: Allocation | null;
}

export const AllocationModal: React.FC<AllocationModalProps> = ({
  isOpen,
  onClose,
  onAllocationsChanged,
  initialAccountId,
  editingAllocation,
}) => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [accountId, setAccountId] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchAccounts();
      if (editingAllocation) {
        setDescription(editingAllocation.description);
        setAmount(editingAllocation.amount);
        setAccountId(editingAllocation.accountId);
      } else {
        resetForm();
        if (initialAccountId) setAccountId(initialAccountId);
      }
    }
  }, [isOpen, editingAllocation, initialAccountId]);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const data = await getAccounts();
      setAccounts(data);
      // Default select first account if adding new and no account selected
      if (!editingAllocation && !accountId && data.length > 0 && !initialAccountId) {
        setAccountId(data[0].id);
      }
    } catch (error) {
      logger.error('Failed to fetch accounts', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setDescription('');
    setAmount('');
    setAccountId(initialAccountId || '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !amount || !accountId) return;

    try {
      setIsSubmitting(true);
      const payload = {
        description,
        amount: Number(amount),
        accountId,
        sortOrder: editingAllocation ? editingAllocation.sortOrder : 0,
      };

      if (editingAllocation) {
        await updateAllocation(editingAllocation.id, payload);
      } else {
        await createAllocation(payload);
      }

      onAllocationsChanged();
      onClose();
    } catch (error) {
      logger.error('Failed to save allocation', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
      <div className="animate-in fade-in zoom-in-95 w-full max-w-md overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-xl duration-200">
        <div className="flex items-center justify-between border-b border-slate-100 p-6">
          <h2 className="text-xl font-bold text-slate-900">
            {editingAllocation ? 'Edit Allocation' : 'Add Allocation'}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-600"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Description</label>
              <input
                type="text"
                placeholder="e.g. Weekly Groceries"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                autoFocus
              />
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Amount</label>
                <div className="relative">
                  <span className="absolute top-2 left-3 text-slate-400">£</span>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value ? Number(e.target.value) : '')}
                    className="w-full rounded-lg border border-slate-200 bg-white py-2 pr-3 pl-6 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                    min={0}
                    step="0.01"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Account</label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                disabled={loading}
              >
                <option value="" disabled>
                  Select Account
                </option>
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name}
                  </option>
                ))}
              </select>
              {accounts.length === 0 && !loading && (
                <p className="mt-1 text-xs text-rose-500">
                  No accounts found. Please add an account first via "Manage Accounts".
                </p>
              )}
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting || !description.trim() || !amount || !accountId}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="animate-spin" size={18} />
              ) : editingAllocation ? (
                <Check size={18} />
              ) : (
                <Plus size={18} />
              )}
              {editingAllocation ? 'Save Changes' : 'Add Allocation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
