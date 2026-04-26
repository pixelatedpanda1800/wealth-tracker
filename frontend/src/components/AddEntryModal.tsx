import { logger } from '../utils/logger';
import React, { useState, useEffect } from 'react';
import { X, Loader2, Lock, AlertTriangle } from 'lucide-react';
import {
  getWealthSources,
  getInvestmentHoldings,
  getInvestmentSnapshots,
  saveWealthSnapshot,
  type WealthSource,
} from '../api';
import type { InvestmentHolding, InvestmentSnapshot } from './investments/types';
import type { WealthEntry } from '../utils/dataUtils';
import { MONTHS } from '../utils/constants';

interface AddEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  existingEntries: WealthEntry[];
}

export const AddEntryModal: React.FC<AddEntryModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  existingEntries,
}) => {
  const currentYear = new Date().getFullYear();
  // currentMonthIndex is 0-based (Jan = year*12+0, Feb = year*12+1, …)
  const currentMonthIndex = currentYear * 12 + new Date().getMonth();

  const [sources, setSources] = useState<WealthSource[]>([]);
  const [holdings, setHoldings] = useState<InvestmentHolding[]>([]);
  const [investmentSnapshots, setInvestmentSnapshots] = useState<InvestmentSnapshot[]>([]);
  const [managedSourceIds, setManagedSourceIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [touchedManagedIds, setTouchedManagedIds] = useState<Set<string>>(new Set());
  // Source IDs whose values were carried from a prior entry (not recorded for this period)
  const [carriedForwardIds, setCarriedForwardIds] = useState<Set<string>>(new Set());

  const [formData, setFormData] = useState<{
    month: string;
    year: string;
    values: Record<string, string>;
  }>({
    month: new Intl.DateTimeFormat('en-US', { month: 'short' }).format(new Date()),
    year: currentYear.toString(),
    values: {},
  });

  const selectedIndex = Number(formData.year) * 12 + MONTHS.indexOf(formData.month as any);
  const isHistorical = selectedIndex < currentMonthIndex;
  const isFutureOrCurrent = selectedIndex >= currentMonthIndex;

  // For the selected period, determine which managed sources are locked.
  // Locked = current/future month, OR historical month where an investment
  // snapshot exists (meaning data came from the Investment Tracker, not manual entry).
  const holdingsBySource = holdings.reduce<Record<string, InvestmentHolding[]>>((acc, h) => {
    (acc[h.wealthSourceId] ??= []).push(h);
    return acc;
  }, {});

  const lockedSourceIds = new Set(
    [...managedSourceIds].filter((sourceId) => {
      if (isFutureOrCurrent) return true;
      // Historical: locked only if this source has investment snapshot data for the period
      const sourceHoldings = holdingsBySource[sourceId] ?? [];
      return sourceHoldings.some((h) =>
        investmentSnapshots.some(
          (s) =>
            s.holdingId === h.id && s.month === formData.month && s.year === Number(formData.year),
        ),
      );
    }),
  );

  useEffect(() => {
    if (isOpen) fetchSources();
  }, [isOpen]);

  // Reset per-period transient state whenever the period changes
  useEffect(() => {
    setTouchedManagedIds(new Set());
    setCarriedForwardIds(new Set());
  }, [formData.month, formData.year]);

  useEffect(() => {
    const existing = existingEntries.find(
      (e) => e.month === formData.month && e.year === Number(formData.year),
    );

    // Build a sorted list of entries strictly before the selected period,
    // used to fill in sources that are absent from the current entry.
    const sortedPrior = [...existingEntries]
      .filter((e) => e.year * 12 + MONTHS.indexOf(e.month as any) < selectedIndex)
      .sort(
        (a, b) =>
          b.year * 12 +
          MONTHS.indexOf(b.month as any) -
          (a.year * 12 + MONTHS.indexOf(a.month as any)),
      );

    const newValues: Record<string, string> = {};
    const newCarried = new Set<string>();

    if (existing) {
      // Start with whatever this period already has recorded
      Object.entries(existing.values).forEach(([id, val]) => {
        newValues[id] = val.toString();
      });
    }

    // For any source not present in the current entry (e.g. cash/pension
    // sources absent from an investment-tracker-generated snapshot), walk
    // back through history per source to find the most recent recorded value
    // and carry it forward, flagging it as unconfirmed for this period.
    sources.forEach((s) => {
      if (newValues[s.id] == null) {
        const priorEntry = sortedPrior.find((e) => e.values[s.id] != null);
        if (priorEntry?.values[s.id] != null) {
          newValues[s.id] = priorEntry.values[s.id].toString();
          newCarried.add(s.id);
        } else {
          newValues[s.id] = '';
        }
      }
    });

    setCarriedForwardIds(newCarried);
    setFormData((prev) => ({ ...prev, values: newValues }));
  }, [formData.month, formData.year, existingEntries, sources]);

  const fetchSources = async () => {
    try {
      setLoading(true);
      const [data, fetchedHoldings, fetchedSnapshots] = await Promise.all([
        getWealthSources(),
        getInvestmentHoldings(),
        getInvestmentSnapshots(),
      ]);
      setSources(data);
      setHoldings(fetchedHoldings);
      setInvestmentSnapshots(fetchedSnapshots);
      setManagedSourceIds(new Set(fetchedHoldings.map((h) => h.wealthSourceId)));
    } catch (error) {
      logger.error('Failed to fetch sources', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name.startsWith('source_')) {
      const sourceId = name.replace('source_', '');
      if (managedSourceIds.has(sourceId)) {
        setTouchedManagedIds((prev) => new Set([...prev, sourceId]));
      }
      // Once the user edits a carried-forward value it becomes confirmed
      setCarriedForwardIds((prev) => {
        const next = new Set(prev);
        next.delete(sourceId);
        return next;
      });
      setFormData((prev) => ({
        ...prev,
        values: { ...prev.values, [sourceId]: value },
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
    try {
      await saveWealthSnapshot({
        month: formData.month,
        year: Number(formData.year),
        values: numericValues,
      } as any);
      onSubmit();
      onClose();
    } catch (error) {
      logger.error('Failed to save snapshot', error);
      alert('Failed to save snapshot. Check terminal.');
    }
  };

  const years = [currentYear - 1, currentYear, currentYear + 1];

  const cashSources = sources.filter((s) => s.category === 'cash');
  const investmentSources = sources.filter((s) => s.category === 'investment');
  const pensionSources = sources.filter((s) => s.category === 'pension');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
      <div className="animate-in fade-in zoom-in w-full max-w-lg overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-xl duration-200">
        <div className="flex items-center justify-between border-b border-slate-100 p-6">
          <h2 className="text-xl font-bold text-slate-900">Add/Update Monthly Entry</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-600"
          >
            <X size={20} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="custom-scrollbar max-h-[80vh] space-y-6 overflow-y-auto p-6"
        >
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Month</label>
              <select
                name="month"
                value={formData.month}
                onChange={handleChange}
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
                name="year"
                value={formData.year}
                onChange={handleChange}
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

          {/* Historical data warning */}
          {isHistorical && (
            <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
              <AlertTriangle size={16} className="mt-0.5 flex-shrink-0 text-amber-500" />
              <p className="text-xs leading-relaxed text-amber-700">
                <span className="font-semibold">You are editing historical data</span> for{' '}
                {formData.month} {formData.year}. Saving will overwrite the previously recorded
                values for this period.
              </p>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="animate-spin text-indigo-600" size={24} />
            </div>
          ) : (
            <div className="space-y-4">
              {cashSources.length > 0 && (
                <SourceSection
                  title="Cash"
                  sources={cashSources}
                  values={formData.values}
                  onChange={handleChange}
                  lockedSourceIds={lockedSourceIds}
                  managedSourceIds={managedSourceIds}
                  touchedManagedIds={touchedManagedIds}
                  carriedForwardIds={carriedForwardIds}
                />
              )}
              {investmentSources.length > 0 && (
                <SourceSection
                  title="Investments"
                  sources={investmentSources}
                  values={formData.values}
                  onChange={handleChange}
                  lockedSourceIds={lockedSourceIds}
                  managedSourceIds={managedSourceIds}
                  touchedManagedIds={touchedManagedIds}
                  carriedForwardIds={carriedForwardIds}
                />
              )}
              {pensionSources.length > 0 && (
                <SourceSection
                  title="Pensions"
                  sources={pensionSources}
                  values={formData.values}
                  onChange={handleChange}
                  lockedSourceIds={lockedSourceIds}
                  managedSourceIds={managedSourceIds}
                  touchedManagedIds={touchedManagedIds}
                  carriedForwardIds={carriedForwardIds}
                />
              )}
              {sources.length === 0 && (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 py-8 text-center">
                  <p className="text-sm text-slate-500">No wealth sources configured.</p>
                  <p className="mt-1 text-xs text-slate-400">
                    Add them via the settings icon on the dashboard.
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="sticky bottom-0 flex gap-3 bg-white pt-4 pb-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 font-medium text-slate-600 transition-colors hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={sources.length === 0}
              className="flex-1 rounded-xl bg-indigo-600 px-4 py-2.5 font-medium text-white shadow-sm shadow-indigo-200 transition-colors hover:bg-indigo-700 disabled:opacity-50"
            >
              Save Entry
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface SourceSectionProps {
  title: string;
  sources: WealthSource[];
  values: Record<string, string>;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  lockedSourceIds: Set<string>;
  managedSourceIds: Set<string>;
  touchedManagedIds: Set<string>;
  carriedForwardIds: Set<string>;
}

const SourceSection = ({
  title,
  sources,
  values,
  onChange,
  lockedSourceIds,
  managedSourceIds,
  touchedManagedIds,
  carriedForwardIds,
}: SourceSectionProps) => (
  <div className="space-y-3">
    <div className="flex items-center gap-3">
      <h3 className="text-xs font-bold tracking-wider text-slate-400 uppercase">{title}</h3>
      <div className="h-px flex-1 bg-slate-100" />
    </div>
    <div className="grid grid-cols-2 gap-4">
      {sources.map((source) => {
        if (lockedSourceIds.has(source.id)) {
          return (
            <LockedField key={source.id} label={source.name} value={values[source.id] || ''} />
          );
        }
        if (managedSourceIds.has(source.id)) {
          return (
            <ManagedInputField
              key={source.id}
              label={source.name}
              name={`source_${source.id}`}
              value={values[source.id] || ''}
              onChange={onChange}
              isTouched={touchedManagedIds.has(source.id)}
            />
          );
        }
        return (
          <InputField
            key={source.id}
            label={`${source.name} (£)`}
            name={`source_${source.id}`}
            value={values[source.id] || ''}
            onChange={onChange}
            isCarriedForward={carriedForwardIds.has(source.id)}
          />
        );
      })}
    </div>
  </div>
);

const InputField = ({
  label,
  name,
  value,
  onChange,
  isCarriedForward = false,
}: {
  label: string;
  name: string;
  value: string;
  onChange: any;
  isCarriedForward?: boolean;
}) => (
  <div className="space-y-2">
    <label
      className={`text-sm font-medium ${isCarriedForward ? 'text-slate-400' : 'text-slate-700'}`}
    >
      {label}
    </label>
    <input
      type="number"
      name={name}
      value={value}
      onChange={onChange}
      placeholder="0.00"
      className={`w-full rounded-xl border bg-white px-4 py-2.5 shadow-sm transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none ${
        isCarriedForward ? 'border-slate-100 text-slate-400' : 'border-slate-200 text-slate-900'
      }`}
    />
    {isCarriedForward && <p className="text-xs text-slate-400">Carried from previous month</p>}
  </div>
);

const LockedField = ({ label, value }: { label: string; value: string }) => (
  <div className="space-y-2">
    <label className="flex items-center gap-1.5 text-sm font-medium text-slate-400">
      <Lock size={12} />
      {label} (£)
    </label>
    <div className="flex w-full flex-col gap-0.5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-400">
      <span className="font-medium text-slate-500">
        {value ? `£${Number(value).toLocaleString()}` : '—'}
      </span>
      <span className="text-xs">Managed via Investments</span>
    </div>
  </div>
);

interface ManagedInputFieldProps {
  label: string;
  name: string;
  value: string;
  onChange: any;
  isTouched: boolean;
}

const ManagedInputField = ({ label, name, value, onChange, isTouched }: ManagedInputFieldProps) => (
  <div className="space-y-2">
    <label
      className={`flex items-center gap-1.5 text-sm font-medium ${isTouched ? 'text-amber-600' : 'text-slate-600'}`}
    >
      {label} (£)
    </label>
    <input
      type="number"
      name={name}
      value={value}
      onChange={onChange}
      placeholder="0.00"
      className={`w-full rounded-xl border bg-white px-4 py-2.5 shadow-sm transition-all focus:ring-2 focus:outline-none ${
        isTouched
          ? 'border-amber-300 focus:border-amber-400 focus:ring-amber-400/20'
          : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20'
      }`}
    />
    {isTouched && (
      <p className="flex items-center gap-1 text-xs text-amber-600">
        <AlertTriangle size={10} />
        Asset Tracker only — Investment Tracker will not be updated
      </p>
    )}
  </div>
);
