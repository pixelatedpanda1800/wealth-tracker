import { logger } from '../../utils/logger';
import React, { useState, useEffect } from 'react';
import { X, Plus, Loader2, Trash2, CreditCard, Landmark } from 'lucide-react';
import { getAccounts, createAccount, deleteAccount, type Account } from '../../api';

interface ManageAccountsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccountsChanged: () => void;
}

export const ManageAccountsModal: React.FC<ManageAccountsModalProps> = ({
  isOpen,
  onClose,
  onAccountsChanged,
}) => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);

  const [name, setName] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchAccounts();
    } else {
      resetForm();
    }
  }, [isOpen]);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const data = await getAccounts();
      setAccounts(data);
    } catch (error) {
      logger.error('Failed to fetch accounts', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setName('');
    setConfirmingDeleteId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setIsSubmitting(true);
      await createAccount({ name, category: 'spending', allocatedAmount: 0 });
      await fetchAccounts();
      onAccountsChanged();
      resetForm();
    } catch (error) {
      logger.error('Failed to create account', error);
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
      await deleteAccount(id);
      await fetchAccounts();
      onAccountsChanged();
      setConfirmingDeleteId(null);
    } catch (error) {
      logger.error('Failed to delete account', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
      <div className="animate-in fade-in zoom-in-95 w-full max-w-md overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-xl duration-200">
        <div className="flex items-center justify-between border-b border-slate-100 p-6">
          <h2 className="text-xl font-bold text-slate-900">Manage Accounts</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-600"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-6 p-6">
          {/* Add Account Form */}
          <form
            onSubmit={handleSubmit}
            className="space-y-3 rounded-xl border border-slate-100 bg-slate-50 p-4"
          >
            <h3 className="text-sm font-semibold tracking-wider text-slate-700 uppercase">
              Add New Account
            </h3>
            <div className="flex flex-col gap-3">
              <input
                type="text"
                placeholder="Account Name (e.g. Starling)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />}
              Add Account
            </button>
          </form>

          {/* Account List */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold tracking-wider text-slate-700 uppercase">
              Existing Accounts
            </h3>
            {loading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="animate-spin text-indigo-600" size={24} />
              </div>
            ) : accounts.length === 0 ? (
              <p className="py-4 text-center text-sm text-slate-400 italic">
                No accounts added yet.
              </p>
            ) : (
              <div className="space-y-2">
                {accounts.map((account) => (
                  <div
                    key={account.id}
                    className="group flex items-center justify-between rounded-lg border border-slate-100 bg-white p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-slate-50 p-2 text-slate-500">
                        {account.category === 'investment' || account.category === 'saving' ? (
                          <Landmark size={18} />
                        ) : (
                          <CreditCard size={18} />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{account.name}</p>
                        <p className="text-xs text-slate-500 capitalize">
                          {account.category.replace('-', ' ')}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(account.id)}
                      className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
                      title="Delete Account"
                    >
                      {confirmingDeleteId === account.id ? (
                        <Trash2 size={18} className="text-rose-600" />
                      ) : (
                        <Trash2 size={18} />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
