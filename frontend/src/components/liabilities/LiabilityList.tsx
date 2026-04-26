import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { clsx } from 'clsx';
import {
  type Liability,
  type LiabilitySnapshot,
  type LiabilityOverpayment,
  LIABILITY_TYPE_LABELS,
  latestSnapshot,
} from './types';
import { projectLiability } from '../../utils/burndownUtils';

type Meta = Record<string, any>;

const fmt = (n: number) =>
  '£' + n.toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
  } catch {
    return iso;
  }
}

const todayISO = () => new Date().toISOString().substring(0, 10);
const in90DaysISO = () => new Date(Date.now() + 90 * 86400000).toISOString().substring(0, 10);

// --- Per-type detail lines ---

function MortgageDetails({ liability }: { liability: Liability }) {
  const meta = (liability.typeMetadata ?? {}) as Meta;
  const rateEndDate = meta.rateEndDate as string | undefined;
  const rateType = meta.rateType as string | undefined;
  const now = todayISO();
  const rateSoonExpiring = rateEndDate && rateEndDate > now && rateEndDate < in90DaysISO();
  const rateExpired = rateEndDate && rateEndDate <= now;

  return (
    <div className="mt-1 flex flex-wrap items-center gap-2">
      {rateType && (
        <span className="text-xs text-slate-400">
          {rateType.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
        </span>
      )}
      {rateEndDate && (
        <span
          className={clsx(
            'rounded-md px-2 py-0.5 text-xs',
            rateExpired
              ? 'border border-rose-200 bg-rose-50 text-rose-600'
              : rateSoonExpiring
                ? 'border border-amber-200 bg-amber-50 text-amber-600'
                : 'text-slate-400',
          )}
        >
          {rateExpired ? 'Rate expired' : `Rate ends ${fmtDate(rateEndDate)}`}
          {(rateExpired || rateSoonExpiring) && <AlertTriangle size={10} className="ml-1 inline" />}
        </span>
      )}
    </div>
  );
}

function CreditCardDetails({
  liability,
  snapshots,
}: {
  liability: Liability;
  snapshots: LiabilitySnapshot[];
}) {
  const meta = (liability.typeMetadata ?? {}) as Meta;
  const creditLimit = liability.creditLimit ?? null;
  const snap = latestSnapshot(snapshots, liability.id);
  const balance = snap ? snap.balance : null;
  const utilisation = creditLimit && balance != null ? (balance / creditLimit) * 100 : null;
  const promoEndDate = meta.promoEndDate as string | undefined;
  const promoActive = promoEndDate && promoEndDate.substring(0, 7) >= todayISO().substring(0, 7);

  // Check if minimum payments alone would take >30 years (360 months = full projection cap)
  const projection = snap ? projectLiability(liability, snapshots, []) : [];
  const neverPaysOff = projection.length === 360 && projection[359].projected > 0;

  return (
    <div className="mt-1 flex w-full flex-col gap-1">
      {utilisation != null && (
        <div className="flex items-center gap-2">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
            <div
              className={clsx(
                'h-full rounded-full transition-all',
                utilisation > 75
                  ? 'bg-rose-500'
                  : utilisation > 50
                    ? 'bg-amber-400'
                    : 'bg-emerald-500',
              )}
              style={{ width: `${Math.min(100, utilisation).toFixed(1)}%` }}
            />
          </div>
          <span className="flex-shrink-0 text-xs text-slate-400">
            {utilisation.toFixed(0)}% used of {fmt(creditLimit!)}
          </span>
        </div>
      )}
      {promoActive && meta.promoApr != null && (
        <span className="self-start rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs text-emerald-600">
          {Number(meta.promoApr) === 0 ? '0% promo APR' : `${meta.promoApr}% promo APR`} until{' '}
          {fmtDate(promoEndDate!)}
        </span>
      )}
      {neverPaysOff && (
        <div className="flex items-center gap-1.5 self-start rounded-md border border-rose-200 bg-rose-50 px-2 py-1">
          <AlertTriangle size={11} className="flex-shrink-0 text-rose-500" />
          <span className="text-xs text-rose-600">
            Minimum payments won't clear this in 30 years — consider overpaying
          </span>
        </div>
      )}
    </div>
  );
}

function CarLoanDetails({ liability }: { liability: Liability }) {
  const meta = (liability.typeMetadata ?? {}) as Meta;
  if (meta.subType !== 'pcp') return null;
  return (
    <div className="mt-1 flex flex-wrap items-center gap-2">
      <span className="text-xs text-slate-400">PCP</span>
      {meta.balloonPayment != null && (
        <span className="text-xs text-slate-400">Balloon: {fmt(Number(meta.balloonPayment))}</span>
      )}
    </div>
  );
}

function StudentLoanDetails({ liability }: { liability: Liability }) {
  const meta = (liability.typeMetadata ?? {}) as Meta;
  const planLabels: Record<string, string> = {
    plan_1: 'Plan 1',
    plan_2: 'Plan 2',
    plan_4: 'Plan 4',
    plan_5: 'Plan 5',
    postgrad: 'Postgrad',
  };
  return (
    <div className="mt-1 flex items-center gap-2">
      {meta.planType && (
        <span className="text-xs text-slate-400">{planLabels[meta.planType] ?? meta.planType}</span>
      )}
      {meta.writeOffYear && (
        <span className="text-xs text-slate-400">Write-off: {meta.writeOffYear}</span>
      )}
    </div>
  );
}

function TaxOwedDetails({ liability }: { liability: Liability }) {
  const meta = (liability.typeMetadata ?? {}) as Meta;
  if (!meta.dueDate) return null;
  const overdue = (meta.dueDate as string) < todayISO();
  return (
    <span
      className={clsx(
        'mt-1 self-start rounded-md px-2 py-0.5 text-xs',
        overdue ? 'border border-rose-200 bg-rose-50 text-rose-600' : 'text-slate-400',
      )}
    >
      {overdue ? 'Overdue — ' : 'Due '}
      {fmtDate(meta.dueDate as string)}
      {overdue && <AlertTriangle size={10} className="ml-1 inline" />}
    </span>
  );
}

function PerTypeDetails({
  liability,
  snapshots,
}: {
  liability: Liability;
  snapshots: LiabilitySnapshot[];
}) {
  switch (liability.type) {
    case 'mortgage':
      return <MortgageDetails liability={liability} />;
    case 'credit_card':
    case 'overdraft':
      return <CreditCardDetails liability={liability} snapshots={snapshots} />;
    case 'car_loan':
      return <CarLoanDetails liability={liability} />;
    case 'student_loan':
      return <StudentLoanDetails liability={liability} />;
    case 'tax_owed':
      return <TaxOwedDetails liability={liability} />;
    default:
      return null;
  }
}

// --- Row ---

interface RowProps {
  liability: Liability;
  snapshots: LiabilitySnapshot[];
  overpayments: LiabilityOverpayment[];
  onPlan: (l: Liability) => void;
}

function LiabilityRow({ liability: l, snapshots, overpayments, onPlan }: RowProps) {
  const snap = latestSnapshot(snapshots, l.id);
  const balance = snap ? snap.balance : null;
  const hasOverpaymentPlan =
    l.recurringOverpayment != null || overpayments.some((op) => op.liabilityId === l.id);

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 flex-1 items-start gap-4">
          <div
            className="mt-1 h-3 w-3 flex-shrink-0 rounded-full"
            style={{ backgroundColor: l.color ?? '#64748B' }}
          />
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold text-slate-800">{l.name}</p>
            <div className="mt-0.5 flex flex-wrap items-center gap-2">
              <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-400">
                {LIABILITY_TYPE_LABELS[l.type as keyof typeof LIABILITY_TYPE_LABELS]}
              </span>
              {l.interestRate != null && (
                <span className="text-xs text-slate-400">{l.interestRate!.toFixed(2)}% APR</span>
              )}
              {hasOverpaymentPlan && (
                <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs text-emerald-600">
                  Overpayment plan
                </span>
              )}
            </div>
            <PerTypeDetails liability={l} snapshots={snapshots} />
          </div>
        </div>
        <div className="flex flex-shrink-0 items-center gap-3">
          {balance != null ? (
            <div className="text-right">
              <p className="text-xl font-bold text-slate-800">{fmt(balance)}</p>
              {l.monthlyPayment != null && (
                <p className="text-xs text-slate-400">{fmt(l.monthlyPayment!)}/mo</p>
              )}
            </div>
          ) : (
            <p className="text-sm text-slate-400 italic">No data</p>
          )}
          <button
            onClick={() => onPlan(l)}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700"
          >
            Plan
          </button>
        </div>
      </div>
    </div>
  );
}

// --- List ---

interface Props {
  liabilities: Liability[];
  snapshots: LiabilitySnapshot[];
  overpayments: LiabilityOverpayment[];
  onPlan: (l: Liability) => void;
  showArchived: boolean;
  onToggleArchived: () => void;
}

export const LiabilityList: React.FC<Props> = ({
  liabilities,
  snapshots,
  overpayments,
  onPlan,
  showArchived,
  onToggleArchived,
}) => {
  const active = liabilities.filter((l) => !l.archivedAt);
  const archived = liabilities.filter((l) => !!l.archivedAt);

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold tracking-wider text-slate-500 uppercase">
        Active Liabilities
      </h3>
      {active.map((l) => (
        <LiabilityRow
          key={l.id}
          liability={l}
          snapshots={snapshots}
          overpayments={overpayments}
          onPlan={onPlan}
        />
      ))}

      {archived.length > 0 && (
        <button
          onClick={onToggleArchived}
          className="text-xs font-medium text-slate-400 transition-colors hover:text-slate-600"
        >
          {showArchived ? '▾' : '▸'} Archived / paid off ({archived.length})
        </button>
      )}
      {showArchived && (
        <div className="space-y-2">
          {archived.map((l) => (
            <div
              key={l.id}
              className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-5 py-3 opacity-60"
            >
              <div
                className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
                style={{ backgroundColor: l.color ?? '#64748B' }}
              />
              <span className="text-sm font-medium text-slate-500">{l.name}</span>
              <span className="text-xs text-slate-400">
                {LIABILITY_TYPE_LABELS[l.type as keyof typeof LIABILITY_TYPE_LABELS]}
              </span>
              <span className="ml-auto text-xs font-medium text-emerald-600">Paid off</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
