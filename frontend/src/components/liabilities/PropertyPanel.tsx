import React from 'react';
import { Home, AlertTriangle } from 'lucide-react';
import { clsx } from 'clsx';
import { type Property, type Liability, type LiabilitySnapshot, latestSnapshot } from './types';

const fmt = (n: number) =>
  '£' + n.toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

const STALE_MONTHS = 12;

function isStaleValuation(valuationDate: string | undefined): boolean {
  if (!valuationDate) return true;
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - STALE_MONTHS);
  return new Date(valuationDate) < cutoff;
}

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
  } catch {
    return iso;
  }
}

interface Props {
  properties: Property[];
  liabilities: Liability[];
  snapshots: LiabilitySnapshot[];
}

export const PropertyPanel: React.FC<Props> = ({ properties, liabilities, snapshots }) => {
  if (properties.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold tracking-wider text-slate-500 uppercase">Properties</h3>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {properties.map((p) => {
          const linkedMortgages = liabilities.filter(
            (l) => l.propertyId === p.id && l.type === 'mortgage' && !l.archivedAt,
          );
          const totalMortgageBalance = linkedMortgages.reduce((sum, l) => {
            const snap = latestSnapshot(snapshots, l.id);
            return sum + (snap ? snap.balance : 0);
          }, 0);

          const estimatedValue = p.estimatedValue ?? null;
          const equity = estimatedValue != null ? estimatedValue - totalMortgageBalance : null;
          const ltv =
            estimatedValue && estimatedValue > 0
              ? (totalMortgageBalance / estimatedValue) * 100
              : null;
          const stale = isStaleValuation(p.valuationDate);
          const noValue = estimatedValue == null;

          return (
            <div
              key={p.id}
              className={clsx(
                'space-y-4 rounded-2xl border bg-white p-5 shadow-sm',
                stale ? 'border-amber-200' : 'border-slate-100',
              )}
            >
              {/* Header */}
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-indigo-50">
                  <Home size={18} className="text-indigo-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-slate-800">{p.name}</p>
                  {p.valuationDate ? (
                    <p className="text-xs text-slate-400">Valued {fmtDate(p.valuationDate)}</p>
                  ) : (
                    <p className="text-xs text-slate-400 italic">No valuation date</p>
                  )}
                </div>
              </div>

              {/* Stale valuation warning */}
              {stale && (
                <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
                  <AlertTriangle size={13} className="flex-shrink-0 text-amber-600" />
                  <p className="text-xs text-amber-700">
                    {noValue
                      ? 'No estimated value set.'
                      : `Valuation is over ${STALE_MONTHS} months old.`}{' '}
                    Update in Properties.
                  </p>
                </div>
              )}

              {/* Value / equity metrics */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs font-medium tracking-wide text-slate-400 uppercase">
                    Est. Value
                  </p>
                  <p className="mt-0.5 text-lg font-bold text-slate-800">
                    {estimatedValue != null ? (
                      fmt(estimatedValue)
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium tracking-wide text-slate-400 uppercase">
                    Mortgage
                  </p>
                  <p className="mt-0.5 text-lg font-bold text-rose-600">
                    {linkedMortgages.length > 0 ? (
                      fmt(totalMortgageBalance)
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </p>
                </div>
                {equity != null && (
                  <div className="col-span-2">
                    <p className="text-xs font-medium tracking-wide text-slate-400 uppercase">
                      Equity
                    </p>
                    <p
                      className={clsx(
                        'mt-0.5 text-xl font-bold',
                        equity >= 0 ? 'text-emerald-600' : 'text-rose-600',
                      )}
                    >
                      {fmt(equity)}
                    </p>
                  </div>
                )}
              </div>

              {/* LTV bar */}
              {ltv != null && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">Loan-to-Value</span>
                    <span
                      className={clsx(
                        'text-xs font-semibold',
                        ltv > 90
                          ? 'text-rose-600'
                          : ltv > 75
                            ? 'text-amber-600'
                            : 'text-emerald-600',
                      )}
                    >
                      {ltv.toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={clsx(
                        'h-full rounded-full transition-all',
                        ltv > 90 ? 'bg-rose-500' : ltv > 75 ? 'bg-amber-400' : 'bg-emerald-500',
                      )}
                      style={{ width: `${Math.min(100, ltv).toFixed(1)}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Linked mortgages list */}
              {linkedMortgages.length > 0 && (
                <div className="space-y-1.5 border-t border-slate-100 pt-1">
                  {linkedMortgages.map((l) => {
                    const snap = latestSnapshot(snapshots, l.id);
                    return (
                      <div key={l.id} className="flex items-center justify-between gap-2">
                        <div className="flex min-w-0 items-center gap-1.5">
                          <div
                            className="h-2 w-2 flex-shrink-0 rounded-full"
                            style={{ backgroundColor: l.color ?? '#6366F1' }}
                          />
                          <span className="truncate text-xs text-slate-600">{l.name}</span>
                        </div>
                        <span className="flex-shrink-0 text-xs font-semibold text-slate-700">
                          {snap ? fmt(snap.balance) : '—'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              {linkedMortgages.length === 0 && (
                <p className="border-t border-slate-100 pt-1 text-xs text-slate-400 italic">
                  No mortgages linked to this property.
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
