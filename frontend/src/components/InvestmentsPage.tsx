import React, { useState, useRef, useCallback } from 'react';
import { Settings, PlusCircle, TrendingUp, AlertCircle } from 'lucide-react';
import { clsx } from 'clsx';
import {
  useInvestmentHoldings,
  useInvestmentSnapshots,
  useWealthSources,
  useQueryClient,
  QueryKeys,
} from '../hooks/queries';
import { ManageHoldingsModal } from './investments/ManageHoldingsModal';
import { AddSnapshotModal } from './investments/AddSnapshotModal';
import { InvestmentSummaryCards } from './investments/InvestmentSummaryCards';
import { InvestmentWarnings } from './investments/InvestmentWarnings';
import { AccountChart } from './investments/AccountChart';
import { AllocationChart } from './investments/AllocationChart';
import { HoldingPerformanceCard } from './investments/HoldingPerformanceCard';
import {
  calculatePortfolioSummary,
  detectWarnings,
  groupHoldingsByAccount,
  groupHoldingsByTicker,
  type Period,
  PERIOD_LABELS,
} from '../utils/investmentUtils';

const PERIODS: Period[] = ['1M', '3M', '1Y', '5Y', 'All'];

export const InvestmentsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const {
    data: holdings = [],
    isLoading: holdingsLoading,
    isError: holdingsError,
  } = useInvestmentHoldings();
  const {
    data: snapshots = [],
    isLoading: snapshotsLoading,
    isError: snapshotsError,
  } = useInvestmentSnapshots();
  const { data: wealthSources = [] } = useWealthSources();

  const [showManageModal, setShowManageModal] = useState(false);
  const [showSnapshotModal, setShowSnapshotModal] = useState(false);
  const [period, setPeriod] = useState<Period>('1Y');

  // Refs for scroll-to-holding from warning alerts
  // A grouped card registers all its holding IDs under the same element ref
  const holdingRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const setGroupRef = useCallback(
    (ids: string[]) => (el: HTMLDivElement | null) => {
      ids.forEach((id) => {
        holdingRefs.current[id] = el;
      });
    },
    [],
  );

  const scrollToHolding = (holdingId: string) => {
    holdingRefs.current[holdingId]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const investmentSources = wealthSources.filter(
    (s) => s.category === 'investment' || s.category === 'pension',
  );

  const isLoading = holdingsLoading || snapshotsLoading;
  const isError = holdingsError || snapshotsError;
  const hasData = holdings.length > 0;
  const hasSnapshots = snapshots.length > 0;

  const accountGroups = groupHoldingsByAccount(holdings, wealthSources);
  const tickerGroups = groupHoldingsByTicker(holdings);
  const summary = calculatePortfolioSummary(holdings, snapshots);
  const warnings = hasSnapshots ? detectWarnings(holdings, snapshots) : [];

  const handleHoldingsChanged = () => {
    queryClient.invalidateQueries({ queryKey: QueryKeys.investmentHoldings });
    queryClient.invalidateQueries({ queryKey: QueryKeys.investmentSnapshots });
    queryClient.invalidateQueries({ queryKey: QueryKeys.wealthSnapshots });
  };

  const handleSnapshotsSaved = () => {
    queryClient.invalidateQueries({ queryKey: QueryKeys.investmentSnapshots });
    queryClient.invalidateQueries({ queryKey: QueryKeys.wealthSnapshots });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Investment Breakdown</h2>
          <p className="mt-0.5 text-sm text-slate-500">
            {holdings.length} holding{holdings.length !== 1 ? 's' : ''} across{' '}
            {investmentSources.length} account{investmentSources.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowManageModal(true)}
            className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
          >
            <Settings size={16} />
            Manage Holdings
          </button>
          <button
            onClick={() => setShowSnapshotModal(true)}
            disabled={!hasData}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm shadow-indigo-200 transition-colors hover:bg-indigo-700 disabled:opacity-50"
          >
            <PlusCircle size={16} />
            Add / Update Values
          </button>
        </div>
      </div>

      {/* Backend error */}
      {isError && (
        <div className="flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-700">
          <AlertCircle size={20} className="flex-shrink-0" />
          <p className="text-sm font-medium">
            Failed to load investment data. Check the backend is running.
          </p>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center gap-3 rounded-2xl border border-slate-100 bg-white p-12">
          <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-indigo-600" />
          <span className="text-sm text-slate-400">Loading investments…</span>
        </div>
      )}

      {/* Empty state — no holdings */}
      {!isLoading && !isError && !hasData && (
        <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-slate-400">
          <TrendingUp size={40} className="text-slate-300" />
          <div className="text-center">
            <p className="text-lg font-medium text-slate-500">No holdings yet</p>
            <p className="mt-1 text-sm">
              {investmentSources.length === 0
                ? 'First add an investment or pension source in Asset Tracker, then come back here to add holdings.'
                : 'Click "Manage Holdings" to add your first investment.'}
            </p>
          </div>
          <button
            onClick={() => setShowManageModal(true)}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700"
          >
            <Settings size={16} />
            Manage Holdings
          </button>
        </div>
      )}

      {/* Main content */}
      {!isLoading && !isError && hasData && (
        <div className="animate-in fade-in slide-in-from-bottom-2 space-y-6 duration-300">
          {/* Performance warnings — shown before everything else */}
          {warnings.length > 0 && (
            <InvestmentWarnings warnings={warnings} onScrollToHolding={scrollToHolding} />
          )}

          {/* Top section: summary cards (left) + allocation breakdown (right) */}
          {hasSnapshots && (
            <div className="grid grid-cols-3 gap-6">
              <div className="col-span-2 h-full">
                <InvestmentSummaryCards summary={summary} />
              </div>
              <div className="col-span-1">
                <AllocationChart holdings={holdings} snapshots={snapshots} />
              </div>
            </div>
          )}

          {/* Account charts — two per row */}
          {hasSnapshots && accountGroups.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold tracking-wider text-slate-500 uppercase">
                Account Overview
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {accountGroups.map(({ source, holdings: accountHoldings }) => (
                  <AccountChart
                    key={source.id}
                    source={source}
                    holdings={accountHoldings}
                    snapshots={snapshots}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Period selector + holding performance cards */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold tracking-wider text-slate-500 uppercase">
                Holding Performance
              </h3>
              <div className="flex rounded-lg bg-slate-100 p-1">
                {PERIODS.map((p) => (
                  <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    className={clsx(
                      'rounded-md px-3 py-1 text-xs font-medium transition-all focus:outline-none',
                      period === p
                        ? 'bg-white text-indigo-600 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700',
                    )}
                    title={PERIOD_LABELS[p]}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {hasSnapshots ? (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {tickerGroups
                  .filter((g) => g.ticker !== null)
                  .map((group, index) => {
                    const key = group.ticker ?? group.holdings[0].id;
                    const ids = group.holdings.map((h) => h.id);
                    return (
                      <div key={key} ref={setGroupRef(ids)}>
                        <HoldingPerformanceCard
                          holdings={group.holdings}
                          snapshots={snapshots}
                          period={period}
                          index={index}
                        />
                      </div>
                    );
                  })}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center">
                <p className="font-medium text-slate-500">No values entered yet</p>
                <p className="mt-1 text-sm text-slate-400">
                  Click "Add / Update Values" to record your first monthly snapshot.
                </p>
                <button
                  onClick={() => setShowSnapshotModal(true)}
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700"
                >
                  <PlusCircle size={15} />
                  Add Values
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      <ManageHoldingsModal
        isOpen={showManageModal}
        onClose={() => setShowManageModal(false)}
        onChanged={handleHoldingsChanged}
        holdings={holdings}
        investmentSources={investmentSources}
      />
      <AddSnapshotModal
        isOpen={showSnapshotModal}
        onClose={() => setShowSnapshotModal(false)}
        onSubmit={handleSnapshotsSaved}
        holdings={holdings}
        existingSnapshots={snapshots}
        investmentSources={investmentSources}
      />
    </div>
  );
};
