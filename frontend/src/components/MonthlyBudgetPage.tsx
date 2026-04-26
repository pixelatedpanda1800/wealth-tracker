import React, { useState, useMemo } from 'react';
import {
  Settings,
  Banknote,
  Home,
  ShoppingBag,
  Coins,
  PiggyBank,
  Loader2,
  AlertCircle,
} from 'lucide-react';

import { IncomeSection } from './budget/IncomeSection';
import { OutgoingsSection } from './budget/OutgoingsSection';
import { SavingsSection } from './budget/SavingsSection';

import { BudgetAllocationTab } from './budget/BudgetAllocationTab';
import { BudgetSourcesModal } from './budget/BudgetSourcesModal';
import type { OutgoingItem, IncomeItem } from './budget/types';
import { clsx } from 'clsx';
import {
  useIncomes,
  useOutgoings,
  useWealthSources,
  useQueryClient,
  QueryKeys,
} from '../hooks/queries';

export const MonthlyBudgetPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'budget' | 'allocation'>('budget');
  const [isSourcesModalOpen, setIsSourcesModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: incomeData = [], isLoading: incomesLoading, error: incomesError } = useIncomes();
  const {
    data: outgoingData = [],
    isLoading: outgoingsLoading,
    error: outgoingsError,
  } = useOutgoings();
  const { data: wealthSources = [], isLoading: wealthLoading } = useWealthSources();

  const loading = incomesLoading || outgoingsLoading || wealthLoading;
  const error =
    incomesError || outgoingsError
      ? 'Failed to load budget data. Please ensure the backend is running.'
      : null;

  const data = useMemo(() => {
    const incomes: IncomeItem[] = incomeData.map((i) => ({
      id: i.id,
      name: i.name,
      category: i.category,
      amount: i.amount,
    }));
    const outgoings: OutgoingItem[] = outgoingData.map((o) => ({
      id: o.id,
      name: o.name,
      type: o.type,
      frequency: o.frequency,
      amount: o.amount,
      paymentDate: o.paymentDate,
      notes: o.notes,
      wealthSourceId: o.wealthSourceId,
    }));
    return { incomes, outgoings };
  }, [incomeData, outgoingData]);

  const handleSourcesChanged = () => {
    queryClient.invalidateQueries({ queryKey: QueryKeys.incomes });
    queryClient.invalidateQueries({ queryKey: QueryKeys.outgoings });
    queryClient.invalidateQueries({ queryKey: QueryKeys.wealthSources });
  };

  // Calculations
  const totalIncome = data.incomes.reduce((sum, i) => sum + i.amount, 0);

  const calculateOutgoingTotal = (items: OutgoingItem[]) => {
    return items.reduce((sum, item) => {
      if (item.frequency === 'monthly') return sum + item.amount;
      return sum + item.amount / 12;
    }, 0);
  };

  const fixedCosts = calculateOutgoingTotal(
    data.outgoings.filter((o) => o.type === 'non-negotiable'),
  );
  const discretionaryCosts = calculateOutgoingTotal(
    data.outgoings.filter((o) => o.type === 'required' || o.type === 'optional'),
  );
  const savingsTotal = calculateOutgoingTotal(data.outgoings.filter((o) => o.type === 'savings'));

  // Total outgoings includes fixed, discretionary, and savings for Net Result calculation
  // Note: User requested to revert calculations for "outgoings" but generally Net Result = Income - All Outflows
  // If we revert "outgoings calculation", it might mean "Total Outgoings" displayed on a dashboard?
  // But there is no "Total Outgoings" scorecard. There is "Net Result".
  const totalOutgoings = fixedCosts + discretionaryCosts + savingsTotal;
  const netResult = totalIncome - totalOutgoings;

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Monthly Budget</h1>
          <p className="text-slate-500">Plan and track your regular monthly finances.</p>
        </div>
        <div className="flex gap-3">{/* Actions moved to tabs */}</div>
      </header>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-700">
          <p className="font-medium">{error}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-6 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('budget')}
          className={clsx(
            'relative pb-3 text-sm font-medium transition-colors',
            activeTab === 'budget' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-700',
          )}
        >
          Budget
          {activeTab === 'budget' && (
            <div className="absolute bottom-0 left-0 h-0.5 w-full rounded-t-full bg-indigo-600" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('allocation')}
          className={clsx(
            'relative pb-3 text-sm font-medium transition-colors',
            activeTab === 'allocation' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-700',
          )}
        >
          Spending Allocation
          {activeTab === 'allocation' && (
            <div className="absolute bottom-0 left-0 h-0.5 w-full rounded-t-full bg-indigo-600" />
          )}
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="animate-spin text-indigo-600" size={32} />
        </div>
      ) : activeTab === 'budget' ? (
        <div className="space-y-8">
          <div className="flex justify-end">
            <button
              onClick={() => setIsSourcesModalOpen(true)}
              className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
            >
              <Settings size={20} />
              <span>Manage Sources</span>
            </button>
          </div>

          {netResult < 0 && (
            <div className="flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-700 transition-all">
              <AlertCircle size={24} className="flex-shrink-0" />
              <p className="text-sm">
                <span className="font-bold">URGENT: Outgoings are higher than income.</span> Review
                your budget immediately to prevent deficit.
              </p>
            </div>
          )}
          {/* Summary Cards */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
            <SummaryCard
              title="Total Income"
              value={totalIncome}
              icon={<Banknote className="text-emerald-600" />}
              color="emerald"
            />
            <SummaryCard
              title="Fixed Costs"
              value={fixedCosts}
              icon={<Home className="text-rose-600" />}
              subtext="Non-negotiable"
              color="rose"
            />
            <SummaryCard
              title="Discretionary"
              value={discretionaryCosts}
              icon={<ShoppingBag className="text-amber-600" />}
              subtext="Required + Optional"
              color="amber"
            />
            <SummaryCard
              title="Savings"
              value={savingsTotal}
              icon={<PiggyBank className="text-purple-600" />}
              subtext="Investments"
              color="purple"
            />
            <SummaryCard
              title="Remaining to Spend"
              value={netResult}
              icon={<Coins className={netResult >= 0 ? 'text-indigo-600' : 'text-rose-600'} />}
              color="indigo"
              isHighlighted
            />
          </div>

          <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-3">
            {/* Left Column: Incomes */}
            <div className="space-y-6 lg:col-span-1">
              <IncomeSection incomes={data.incomes} />
              <SavingsSection
                savings={data.outgoings.filter((o) => o.type === 'savings')}
                wealthSources={wealthSources}
              />
            </div>

            {/* Right Column: Outgoings */}
            <div className="space-y-6 lg:col-span-2">
              <OutgoingsSection outgoings={data.outgoings.filter((o) => o.type !== 'savings')} />
            </div>
          </div>
        </div>
      ) : (
        <BudgetAllocationTab remainingToSpend={netResult} />
      )}

      <BudgetSourcesModal
        isOpen={isSourcesModalOpen}
        onClose={() => setIsSourcesModalOpen(false)}
        onSourcesChanged={handleSourcesChanged}
      />
    </div>
  );
};

interface SummaryCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  subtext?: string;
  isHighlighted?: boolean;
  color?: 'emerald' | 'rose' | 'amber' | 'indigo' | 'blue' | 'purple';
}

const SummaryCard: React.FC<SummaryCardProps> = ({
  title,
  value,
  icon,
  subtext,
  isHighlighted,
  color,
}) => {
  const colorStyles = {
    emerald: 'border-emerald-100 bg-emerald-50/30',
    rose: 'border-rose-100 bg-rose-50/30',
    amber: 'border-amber-100 bg-amber-50/30',
    indigo: 'border-indigo-100 bg-indigo-50/30',
    purple: 'border-purple-100 bg-purple-50/30',
    blue: 'border-blue-100 bg-blue-50/30',
  };

  const activeColorStyle = color ? colorStyles[color] : 'bg-white border-slate-100';

  return (
    <div
      className={clsx(
        'relative flex items-start justify-between overflow-hidden rounded-xl border p-4 shadow-sm',
        isHighlighted
          ? 'border-slate-700 bg-gradient-to-br from-slate-900 to-slate-800 text-white'
          : activeColorStyle,
      )}
    >
      <div className="z-10 space-y-1">
        <p
          className={clsx(
            'text-sm font-medium',
            isHighlighted ? 'text-slate-300' : 'text-slate-500',
          )}
        >
          {title}
        </p>
        <h2 className="text-2xl font-bold">
          £{value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </h2>
        {subtext && (
          <p className={clsx('text-xs', isHighlighted ? 'text-slate-400' : 'text-slate-400')}>
            {subtext}
          </p>
        )}
      </div>
      <div className={clsx('rounded-xl p-3', isHighlighted ? 'bg-white/10' : 'bg-white shadow-sm')}>
        {icon}
      </div>
    </div>
  );
};
