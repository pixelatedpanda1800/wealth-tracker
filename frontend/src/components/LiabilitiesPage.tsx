import React, { useState } from 'react';
import { PlusCircle, Settings, Home, AlertCircle, TrendingDown } from 'lucide-react';
import {
  useLiabilities,
  useLiabilitySnapshots,
  useLiabilityOverpayments,
  useProperties,
  useQueryClient,
  QueryKeys,
} from '../hooks/queries';
import { ManagePropertiesModal } from './liabilities/ManagePropertiesModal';
import { ManageLiabilitiesModal } from './liabilities/ManageLiabilitiesModal';
import { AddLiabilityWizard } from './liabilities/AddLiabilityWizard';
import { AddSnapshotModal } from './liabilities/AddSnapshotModal';
import { OverpaymentPlanModal } from './liabilities/OverpaymentPlanModal';
import { LiabilityList } from './liabilities/LiabilityList';
import { BurndownChart } from './liabilities/BurndownChart';
import { LiabilityBreakdownDonut } from './liabilities/LiabilityBreakdownDonut';
import { PropertyPanel } from './liabilities/PropertyPanel';
import {
  type Liability,
  type LiabilityOverpayment,
  latestSnapshot,
  totalOutstanding,
  isSecured,
} from './liabilities/types';

const fmt = (n: number) =>
  '£' + n.toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

export const LiabilitiesPage: React.FC = () => {
  const queryClient = useQueryClient();
  const {
    data: liabilities = [],
    isLoading: liabilitiesLoading,
    isError: liabilitiesError,
  } = useLiabilities();
  const { data: snapshots = [], isLoading: snapshotsLoading } = useLiabilitySnapshots();
  const { data: overpayments = [] } = useLiabilityOverpayments();
  const { data: properties = [] } = useProperties();

  const [showPropertiesModal, setShowPropertiesModal] = useState(false);
  const [showManageModal, setShowManageModal] = useState(false);
  const [showAddWizard, setShowAddWizard] = useState(false);
  const [showSnapshotModal, setShowSnapshotModal] = useState(false);
  const [overpaymentTarget, setOverpaymentTarget] = useState<Liability | null>(null);
  const [showArchived, setShowArchived] = useState(false);

  const isLoading = liabilitiesLoading || snapshotsLoading;
  const isError = liabilitiesError;

  const active = liabilities.filter((l) => !l.archivedAt);
  const hasData = active.length > 0;
  const hasSnapshots = snapshots.length > 0;

  const totalDebt = totalOutstanding(liabilities, snapshots);
  const securedDebt = active
    .filter((l) => isSecured(l.type))
    .reduce((s, l) => {
      const snap = latestSnapshot(snapshots, l.id);
      return s + (snap ? snap.balance : 0);
    }, 0);
  const unsecuredDebt = totalDebt - securedDebt;

  const monthlyRepayments = active.reduce((s, l) => s + (l.monthlyPayment ?? 0), 0);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: QueryKeys.liabilities });
    queryClient.invalidateQueries({ queryKey: QueryKeys.liabilitySnapshots });
    queryClient.invalidateQueries({ queryKey: QueryKeys.liabilityOverpayments });
    queryClient.invalidateQueries({ queryKey: QueryKeys.properties });
  };

  const liabilityOverpaymentsFor = (liabilityId: string): LiabilityOverpayment[] =>
    overpayments.filter((op) => op.liabilityId === liabilityId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Liabilities</h2>
          <p className="mt-0.5 text-sm text-slate-500">
            {active.length} active debt{active.length !== 1 ? 's' : ''}
            {properties.length > 0 &&
              ` · ${properties.length} propert${properties.length !== 1 ? 'ies' : 'y'}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPropertiesModal(true)}
            className="flex items-center gap-2 rounded-xl border border-slate-200 px-3.5 py-2 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-50"
          >
            <Home size={15} />
            Properties
          </button>
          <button
            onClick={() => setShowManageModal(true)}
            className="flex items-center gap-2 rounded-xl border border-slate-200 px-3.5 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
          >
            <Settings size={15} />
            Manage
          </button>
          <button
            onClick={() => setShowSnapshotModal(true)}
            disabled={!hasData}
            className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-40"
          >
            Update Balances
          </button>
          <button
            onClick={() => setShowAddWizard(true)}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm shadow-indigo-200 transition-colors hover:bg-indigo-700"
          >
            <PlusCircle size={15} />
            Add Liability
          </button>
        </div>
      </div>

      {/* Error */}
      {isError && (
        <div className="flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-700">
          <AlertCircle size={20} className="flex-shrink-0" />
          <p className="text-sm font-medium">
            Failed to load liabilities. Check the backend is running.
          </p>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center gap-3 rounded-2xl border border-slate-100 bg-white p-12">
          <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-indigo-600" />
          <span className="text-sm text-slate-400">Loading liabilities…</span>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !isError && !hasData && (
        <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-slate-400">
          <TrendingDown size={40} className="text-slate-300" />
          <div className="text-center">
            <p className="text-lg font-medium text-slate-500">No liabilities tracked yet</p>
            <p className="mt-1 text-sm">Add your first liability to see your true net position.</p>
          </div>
          <button
            onClick={() => setShowAddWizard(true)}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700"
          >
            <PlusCircle size={16} />
            Add First Liability
          </button>
        </div>
      )}

      {/* Main content */}
      {!isLoading && !isError && hasData && (
        <div className="animate-in fade-in slide-in-from-bottom-2 space-y-6 duration-300">
          {/* Summary cards */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[
              {
                label: 'Total Outstanding',
                value: fmt(totalDebt),
                sub: `${active.length} debt${active.length !== 1 ? 's' : ''}`,
                accent: true,
              },
              { label: 'Secured Debt', value: fmt(securedDebt), sub: 'Mortgage & car' },
              { label: 'Unsecured Debt', value: fmt(unsecuredDebt), sub: 'Cards, loans & other' },
              {
                label: 'Monthly Repayments',
                value: fmt(monthlyRepayments),
                sub: 'Scheduled payments',
              },
            ].map((card) => (
              <div
                key={card.label}
                className={`rounded-2xl border bg-white p-5 ${card.accent ? 'border-rose-100' : 'border-slate-100'} shadow-sm`}
              >
                <p className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
                  {card.label}
                </p>
                <p
                  className={`mt-2 text-2xl font-bold ${card.accent ? 'text-rose-600' : 'text-slate-800'}`}
                >
                  {card.value}
                </p>
                <p className="mt-1 text-xs text-slate-400">{card.sub}</p>
              </div>
            ))}
          </div>

          {/* No snapshot hint */}
          {!hasSnapshots && (
            <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <AlertCircle size={18} className="flex-shrink-0 text-amber-600" />
              <p className="text-sm text-amber-700">
                No balances recorded yet. Click <strong>Update Balances</strong> to enter your first
                month's data.
              </p>
            </div>
          )}

          {/* Charts */}
          {hasSnapshots && (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <BurndownChart
                  liabilities={liabilities}
                  snapshots={snapshots}
                  overpayments={overpayments}
                />
              </div>
              <div>
                <LiabilityBreakdownDonut liabilities={liabilities} snapshots={snapshots} />
              </div>
            </div>
          )}

          {/* Property equity panel */}
          {properties.length > 0 && (
            <PropertyPanel
              properties={properties}
              liabilities={liabilities}
              snapshots={snapshots}
            />
          )}

          {/* Liability list */}
          <LiabilityList
            liabilities={liabilities}
            snapshots={snapshots}
            overpayments={overpayments}
            onPlan={setOverpaymentTarget}
            showArchived={showArchived}
            onToggleArchived={() => setShowArchived((v) => !v)}
          />
        </div>
      )}

      {/* Modals */}
      <ManagePropertiesModal
        isOpen={showPropertiesModal}
        onClose={() => setShowPropertiesModal(false)}
        onChanged={invalidate}
        properties={properties}
      />
      <ManageLiabilitiesModal
        isOpen={showManageModal}
        onClose={() => setShowManageModal(false)}
        onChanged={invalidate}
        liabilities={liabilities}
        properties={properties}
      />
      <AddLiabilityWizard
        isOpen={showAddWizard}
        onClose={() => setShowAddWizard(false)}
        onSaved={invalidate}
        properties={properties}
      />
      <AddSnapshotModal
        isOpen={showSnapshotModal}
        onClose={() => setShowSnapshotModal(false)}
        onSubmit={invalidate}
        liabilities={liabilities}
        existingSnapshots={snapshots}
      />
      {overpaymentTarget && (
        <OverpaymentPlanModal
          isOpen
          onClose={() => setOverpaymentTarget(null)}
          onSaved={() => {
            setOverpaymentTarget(null);
            invalidate();
          }}
          liability={overpaymentTarget}
          existingOverpayments={liabilityOverpaymentsFor(overpaymentTarget.id)}
        />
      )}
    </div>
  );
};
