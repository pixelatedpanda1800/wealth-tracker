import { logger } from '../../utils/logger';
import React, { useState, useEffect } from 'react';
import { X, Loader2, Info } from 'lucide-react';
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

  // Populate fields when month/year or holdings change.
  // Priority: (1) exact match for selected period, (2) most recent prior snapshot, (3) blank.
  useEffect(() => {
    const selectedIndex = Number(year) * 12 + MONTHS.indexOf(month as any);

    const newFields: FieldValues = {};
    for (const holding of holdings) {
      const holdingSnaps = existingSnapshots.filter((s) => s.holdingId === holding.id);

      const exact = holdingSnaps.find((s) => s.year === Number(year) && s.month === month);

      if (exact) {
        newFields[holding.id] = {
          value: exact.value.toString(),
          units: exact.units != null ? exact.units.toString() : '',
          costBasis: exact.costBasis != null ? exact.costBasis.toString() : '',
        };
      } else {
        // Find the most recent snapshot strictly before the selected period
        const prior = holdingSnaps
          .filter((s) => s.year * 12 + MONTHS.indexOf(s.month as any) < selectedIndex)
          .sort(
            (a, b) =>
              b.year * 12 +
              MONTHS.indexOf(b.month as any) -
              (a.year * 12 + MONTHS.indexOf(a.month as any)),
          )[0];

        newFields[holding.id] = {
          value: prior ? prior.value.toString() : '',
          units: prior?.units != null ? prior.units.toString() : '',
          costBasis: prior?.costBasis != null ? prior.costBasis.toString() : '',
        };
      }
    }
    setFields(newFields);
  }, [month, year, holdings, existingSnapshots]);

  const handleFieldChange = (
    holdingId: string,
    field: 'value' | 'units' | 'costBasis',
    val: string,
  ) => {
    setFields((prev) => ({
      ...prev,
      [holdingId]: { ...prev[holdingId], [field]: val },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const saves = holdings
        .filter((h) => fields[h.id]?.value !== '')
        .map((h) =>
          saveInvestmentSnapshot({
            holdingId: h.id,
            year: Number(year),
            month,
            value: Number(fields[h.id].value) || 0,
            units: fields[h.id].units !== '' ? Number(fields[h.id].units) : undefined,
            costBasis: fields[h.id].costBasis !== '' ? Number(fields[h.id].costBasis) : undefined,
          }),
        );
      await Promise.all(saves);
      onSubmit();
      onClose();
    } catch (error) {
      logger.error('Failed to save snapshots', error);
      alert('Failed to save. Check terminal.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  // Group holdings by account
  const holdingsBySource = investmentSources
    .map((source) => ({
      source,
      holdings: holdings.filter((h) => h.wealthSourceId === source.id),
    }))
    .filter((g) => g.holdings.length > 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
      <div className="animate-in fade-in zoom-in flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-xl duration-200">
        <div className="flex flex-shrink-0 items-center justify-between border-b border-slate-100 p-6">
          <h2 className="text-xl font-bold text-slate-900">Add / Update Values</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-600"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
          <div className="custom-scrollbar flex-1 space-y-6 overflow-y-auto p-6">
            {/* Month / Year picker */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Month</label>
                <select
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                >
                  {MONTHS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Year</label>
                <select
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                >
                  {years.map((y) => (
                    <option key={y} value={y.toString()}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {holdings.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 py-8 text-center">
                <p className="text-sm text-slate-500">No holdings configured.</p>
                <p className="mt-1 text-xs text-slate-400">
                  Add holdings via "Manage Holdings" first.
                </p>
              </div>
            ) : (
              holdingsBySource.map(({ source, holdings: accountHoldings }) => (
                <div key={source.id} className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold tracking-wider text-slate-400 uppercase">
                      {source.name}
                    </span>
                    <div className="h-px flex-1 bg-slate-100" />
                  </div>
                  {accountHoldings.map((holding) => (
                    <div
                      key={holding.id}
                      className="space-y-3 rounded-xl border border-slate-100 bg-slate-50 p-4"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
                          style={{ backgroundColor: holding.color || '#64748B' }}
                        />
                        <span className="text-sm font-medium text-slate-800">{holding.name}</span>
                        <span className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-xs text-slate-400">
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
                            onChange={(e) => handleFieldChange(holding.id, 'value', e.target.value)}
                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-slate-500">Units</label>
                          <input
                            type="number"
                            placeholder="optional"
                            value={fields[holding.id]?.units || ''}
                            onChange={(e) => handleFieldChange(holding.id, 'units', e.target.value)}
                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500 transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="flex items-center gap-1 text-xs font-medium text-slate-500">
                            Cost Basis (£)
                            <span className="group/tooltip relative">
                              <Info size={11} className="cursor-help text-slate-400" />
                              <span className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 w-56 -translate-x-1/2 rounded-xl bg-slate-800 px-3 py-2.5 text-xs leading-relaxed text-slate-100 opacity-0 shadow-lg transition-opacity duration-150 group-hover/tooltip:opacity-100">
                                The total amount you have{' '}
                                <span className="font-semibold text-white">paid in</span> — i.e. the
                                sum of all contributions or purchase costs, not the current market
                                value. Used to calculate your real return.
                                <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800" />
                              </span>
                            </span>
                          </label>
                          <input
                            type="number"
                            placeholder="optional"
                            value={fields[holding.id]?.costBasis || ''}
                            onChange={(e) =>
                              handleFieldChange(holding.id, 'costBasis', e.target.value)
                            }
                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500 transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ))
            )}

            <p className="text-center text-xs text-slate-400">
              Holdings with no value entered will be skipped. Values update the Asset Tracker
              automatically.
            </p>
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
              type="submit"
              disabled={isSubmitting || holdings.length === 0}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 font-medium text-white shadow-sm shadow-indigo-200 transition-colors hover:bg-indigo-700 disabled:opacity-50"
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
