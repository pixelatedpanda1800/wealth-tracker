import { logger } from '../../utils/logger';
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
  '#6366F1',
  '#10B981',
  '#F59E0B',
  '#EF4444',
  '#8B5CF6',
  '#EC4899',
  '#06B6D4',
  '#F97316',
  '#14B8A6',
  '#64748B',
  '#84CC16',
  '#EAB308',
  '#3B82F6',
  '#A855F7',
  '#D946EF',
  '#F43F5E',
];

const HOLDING_TYPES: HoldingType[] = ['fund', 'etf', 'stock', 'bond', 'crypto', 'other'];

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
      const usedColors = new Set(holdings.map((h) => h.color));
      const available = PRESET_COLORS.find((c) => !usedColors.has(c));
      if (available) setSelectedColor(available);
    }
  }, [holdings, editingId]);

  const resetForm = () => {
    setName('');
    setTicker('');
    setType('fund');
    setWealthSourceId(investmentSources[0]?.id || '');
    setEditingId(null);
    const usedColors = new Set(holdings.map((h) => h.color));
    const available = PRESET_COLORS.find((c) => !usedColors.has(c)) || PRESET_COLORS[0];
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
      logger.error('Failed to save holding', error);
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
      logger.error('Failed to delete holding', error);
    }
  };

  if (!isOpen) return null;

  const usedColors = new Set(
    holdings
      .filter((h) => h.id !== editingId)
      .map((h) => h.color)
      .filter(Boolean) as string[],
  );

  // Group holdings by account for the list view
  const holdingsBySource = investmentSources
    .map((source) => ({
      source,
      holdings: holdings.filter((h) => h.wealthSourceId === source.id),
    }))
    .filter((g) => g.holdings.length > 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
      <div className="animate-in fade-in zoom-in flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-xl duration-200">
        <div className="flex flex-shrink-0 items-center justify-between border-b border-slate-100 p-6">
          <h2 className="text-xl font-bold text-slate-900">Manage Holdings</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-600"
          >
            <X size={20} />
          </button>
        </div>

        <div className="custom-scrollbar flex-1 space-y-8 overflow-y-auto p-6">
          {/* Add / Edit Form */}
          <form
            onSubmit={handleSubmit}
            className="space-y-4 rounded-xl border border-slate-100 bg-slate-50 p-5"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold tracking-wider text-slate-700 uppercase">
                {editingId ? 'Edit Holding' : 'Add New Holding'}
              </h3>
            </div>

            {investmentSources.length === 0 ? (
              <p className="text-sm text-slate-500 italic">
                No investment accounts found. Add a WealthSource with category "Investment" or
                "Pension" first.
              </p>
            ) : (
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Holding name (e.g. Vanguard S&P 500 ETF)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 shadow-sm transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                />

                <input
                  type="text"
                  placeholder="TradingView ticker (e.g. LSE:VUSA) — optional"
                  value={ticker}
                  onChange={(e) => setTicker(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm shadow-sm transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                />

                <div className="grid grid-cols-2 gap-3">
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as HoldingType)}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 shadow-sm transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                  >
                    {HOLDING_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {HOLDING_TYPE_LABELS[t]}
                      </option>
                    ))}
                  </select>

                  <select
                    value={wealthSourceId}
                    onChange={(e) => setWealthSourceId(e.target.value)}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 shadow-sm transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                  >
                    {investmentSources.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Color picker */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
                    Colour
                  </label>
                  <div className="grid grid-cols-8 gap-2">
                    {PRESET_COLORS.map((color) => {
                      const isUsed = usedColors.has(color);
                      const isSelected = selectedColor === color;
                      return (
                        <button
                          key={color}
                          type="button"
                          disabled={isUsed}
                          onClick={() => setSelectedColor(color)}
                          className={clsx(
                            'flex h-8 w-8 items-center justify-center rounded-full transition-all',
                            isUsed
                              ? 'cursor-not-allowed opacity-20'
                              : 'cursor-pointer shadow-sm hover:scale-110',
                            isSelected && 'scale-110 ring-2 ring-indigo-500 ring-offset-2',
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
                      className="rounded-xl border border-rose-200 bg-white px-4 py-2.5 text-rose-500 shadow-sm transition-colors hover:bg-rose-50"
                    >
                      <X size={18} />
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={isSubmitting || !name.trim() || !wealthSourceId}
                    className={clsx(
                      'flex items-center gap-2 rounded-xl px-5 py-2.5 font-medium shadow-sm transition-colors disabled:opacity-50',
                      editingId
                        ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700',
                    )}
                  >
                    {isSubmitting ? (
                      <Loader2 className="animate-spin" size={18} />
                    ) : editingId ? (
                      <>
                        <Check size={18} /> Save
                      </>
                    ) : (
                      <>
                        <Plus size={18} /> Add Holding
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </form>

          {/* Holdings list grouped by account */}
          {holdingsBySource.length > 0 && (
            <div className="space-y-6">
              <h3 className="text-sm font-semibold tracking-wider text-slate-700 uppercase">
                Current Holdings
              </h3>
              {holdingsBySource.map(({ source, holdings: accountHoldings }) => (
                <div key={source.id} className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold tracking-wider text-slate-400 uppercase">
                      {source.name}
                    </span>
                    <div className="h-px flex-1 bg-slate-100" />
                  </div>
                  {accountHoldings.map((holding) => (
                    <div
                      key={holding.id}
                      className={clsx(
                        'flex items-center justify-between rounded-xl border bg-white p-4 shadow-sm transition-all',
                        editingId === holding.id
                          ? 'border-2 border-indigo-600 ring-4 ring-indigo-500/10'
                          : 'border-slate-100 hover:border-slate-200',
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="h-3 w-3 flex-shrink-0 rounded-full"
                          style={{ backgroundColor: holding.color || '#64748B' }}
                        />
                        <div>
                          <p className="font-medium text-slate-900">{holding.name}</p>
                          <p className="text-xs text-slate-400">
                            {HOLDING_TYPE_LABELS[holding.type]}
                            {holding.ticker && (
                              <span className="ml-2 font-mono">{holding.ticker}</span>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleEditClick(holding)}
                          disabled={!!editingId}
                          className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-50 hover:text-indigo-600 disabled:opacity-40"
                        >
                          <Pencil size={16} />
                        </button>
                        {!editingId && (
                          <button
                            onClick={() => handleDelete(holding.id)}
                            className={clsx(
                              'rounded-lg px-3 py-1.5 text-sm font-medium transition-all',
                              confirmingDeleteId === holding.id
                                ? 'bg-rose-600 text-white'
                                : 'text-rose-500 hover:bg-rose-50',
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
            <p className="text-center text-sm text-slate-400 italic">No holdings added yet.</p>
          )}
        </div>

        <div className="flex-shrink-0 border-t border-slate-100 bg-slate-50/50 p-6">
          <button
            onClick={onClose}
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 font-medium text-slate-600 transition-colors hover:bg-white"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
