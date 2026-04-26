import { logger } from '../../utils/logger';
import React, { useState, useEffect, useMemo } from 'react';
import { X, Loader2, RotateCcw } from 'lucide-react';
import { clsx } from 'clsx';
import {
  updateLiability,
  bulkUpsertOverpayments,
  deleteLiabilityOverpayment,
  type Liability,
  type LiabilityOverpayment,
} from '../../api';
import { MONTHS } from '../../utils/constants';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  liability: Liability;
  existingOverpayments: LiabilityOverpayment[];
}

function generateForwardMonths(count: number): Array<{ year: number; month: string; key: string }> {
  const result = [];
  const now = new Date();
  let y = now.getFullYear();
  let mIdx = now.getMonth(); // 0-based
  for (let i = 0; i < count; i++) {
    result.push({
      year: y,
      month: MONTHS[mIdx],
      key: `${y}-${String(mIdx + 1).padStart(2, '0')}`,
    });
    mIdx++;
    if (mIdx === 12) {
      mIdx = 0;
      y++;
    }
  }
  return result;
}

export const OverpaymentPlanModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSaved,
  liability,
  existingOverpayments,
}) => {
  const [recurring, setRecurring] = useState(
    liability.recurringOverpayment != null ? String(liability.recurringOverpayment) : '',
  );
  // per-month grid values keyed by 'YYYY-MM'
  const [gridValues, setGridValues] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const months = useMemo(() => generateForwardMonths(36), []);

  // Seed grid from existing overpayments
  useEffect(() => {
    const init: Record<string, string> = {};
    for (const op of existingOverpayments) {
      const key = `${op.year}-${String(MONTHS.indexOf(op.month as (typeof MONTHS)[number]) + 1).padStart(2, '0')}`;
      init[key] = String(op.amount);
    }
    setGridValues(init);
  }, [existingOverpayments]);

  const recurringNum = recurring !== '' ? Number(recurring) : 0;

  const setGridValue = (key: string, val: string) =>
    setGridValues((prev) => ({ ...prev, [key]: val }));

  const resetMonth = (key: string) =>
    setGridValues((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });

  const isOverridden = (key: string) => key in gridValues;

  const handleSave = async () => {
    try {
      setIsSubmitting(true);

      // Update recurring on the liability
      await updateLiability(liability.id, {
        recurringOverpayment: recurring !== '' ? Number(recurring) : undefined,
      });

      // Build overpayment rows: only send months that differ from recurring
      const toUpsert: { liabilityId: string; year: number; month: string; amount: number }[] = [];
      const existingMap = new Map(
        existingOverpayments.map((op) => [
          `${op.year}-${String(MONTHS.indexOf(op.month as (typeof MONTHS)[number]) + 1).padStart(2, '0')}`,
          op,
        ]),
      );

      // Delete rows that are now back to recurring
      for (const [key, op] of existingMap) {
        const gridVal = gridValues[key];
        if (gridVal === undefined || Number(gridVal) === recurringNum) {
          await deleteLiabilityOverpayment(op.id);
        }
      }

      // Upsert rows that differ from recurring
      for (const { key, year, month } of months) {
        if (isOverridden(key)) {
          const amount = Number(gridValues[key]);
          if (amount !== recurringNum) {
            toUpsert.push({ liabilityId: liability.id, year, month, amount });
          }
        }
      }

      if (toUpsert.length > 0) {
        await bulkUpsertOverpayments({ liabilityId: liability.id, overpayments: toUpsert });
      }

      onSaved();
      onClose();
    } catch (err) {
      logger.error('Failed to save overpayment plan', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
      <div className="animate-in fade-in zoom-in flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-xl duration-200">
        <div className="flex flex-shrink-0 items-center justify-between border-b border-slate-100 p-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Overpayment Plan</h2>
            <p className="mt-0.5 text-sm text-slate-400">{liability.name}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-600"
          >
            <X size={20} />
          </button>
        </div>

        <div className="custom-scrollbar flex-1 space-y-5 overflow-y-auto p-6">
          {/* Recurring overpayment */}
          <div className="space-y-2 rounded-xl border border-indigo-100 bg-indigo-50 p-4">
            <label className="text-sm font-semibold text-indigo-800">
              Monthly Recurring Overpayment (£)
            </label>
            <input
              type="number"
              min={0}
              step="0.01"
              placeholder="e.g. 200"
              value={recurring}
              onChange={(e) => setRecurring(e.target.value)}
              className="w-full rounded-xl border border-indigo-200 bg-white px-4 py-2.5 text-sm transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
            />
            <p className="text-xs text-indigo-600">
              Applied to every future month unless overridden below.
            </p>
          </div>

          {/* Per-month grid */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-700">
                Per-Month Overrides (next 36 months)
              </h3>
              <p className="text-xs text-slate-400">Overridden months shown in amber</p>
            </div>

            <div className="space-y-1.5">
              {months.map(({ key, year, month }) => {
                const overridden = isOverridden(key);

                return (
                  <div
                    key={key}
                    className={clsx(
                      'flex items-center gap-3 rounded-lg px-3 py-2 transition-colors',
                      overridden
                        ? 'border border-amber-200 bg-amber-50'
                        : 'border border-slate-100 bg-slate-50',
                    )}
                  >
                    <span
                      className={clsx(
                        'w-20 flex-shrink-0 text-xs font-medium',
                        overridden ? 'text-amber-700' : 'text-slate-500',
                      )}
                    >
                      {month} {year}
                    </span>
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      placeholder={recurring || '0'}
                      value={overridden ? gridValues[key] : ''}
                      onChange={(e) => setGridValue(key, e.target.value)}
                      className={clsx(
                        'flex-1 rounded-lg border px-3 py-1.5 text-sm transition-all focus:ring-2 focus:ring-indigo-500/20 focus:outline-none',
                        overridden
                          ? 'border-amber-300 bg-white focus:border-amber-400'
                          : 'border-slate-200 bg-white text-slate-400 focus:border-indigo-400',
                      )}
                    />
                    {overridden && (
                      <button
                        type="button"
                        onClick={() => resetMonth(key)}
                        title="Reset to recurring"
                        className="flex-shrink-0 rounded-md p-1.5 text-amber-500 transition-colors hover:bg-amber-100 hover:text-amber-700"
                      >
                        <RotateCcw size={13} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex flex-shrink-0 gap-3 border-t border-slate-100 bg-slate-50/50 p-6">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 font-medium text-slate-600 transition-colors hover:bg-white"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSubmitting}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 font-medium text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:opacity-50"
          >
            {isSubmitting && <Loader2 className="animate-spin" size={18} />}
            Save Plan
          </button>
        </div>
      </div>
    </div>
  );
};
