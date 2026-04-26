import React, { useMemo, useState } from 'react';
import {
  Receipt,
  AlertCircle,
  TrendingDown,
  TrendingUp,
  Upload,
  Settings,
  Tag,
  Sparkles,
} from 'lucide-react';
import { clsx } from 'clsx';

import { useSpendingMockStore } from './spending/useSpendingMockStore';
import {
  buildSummary,
  buildCategoryBreakdown,
  buildMonthlyTrend,
  listMonthKeys,
  shiftMonth,
  monthKeyOf,
  formatMonthLabel,
} from './spending/selectors';
import { CategoryBreakdownDonut } from './spending/CategoryBreakdownDonut';
import { CategoryTable } from './spending/CategoryTable';
import { TransactionList } from './spending/TransactionList';
import { SpendingTrendChart } from './spending/SpendingTrendChart';
import { TrendTotalsTable } from './spending/TrendTotalsTable';
import { UploadStatementModal } from './spending/UploadStatementModal';
import { ReassignCategoryModal } from './spending/ReassignCategoryModal';
import { ManageCategoriesModal } from './spending/ManageCategoriesModal';
import type { Transaction } from './spending/types';

export const SpendingPage: React.FC = () => {
  const store = useSpendingMockStore();
  const today = new Date();
  const currentMonthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

  const [activeTab, setActiveTab] = useState<'month' | 'trend'>('month');
  const [accountId, setAccountId] = useState<string | 'all'>('all');
  const [monthKey, setMonthKey] = useState(currentMonthKey);
  const [trendFrom, setTrendFrom] = useState(shiftMonth(currentMonthKey, -5));
  const [trendTo, setTrendTo] = useState(currentMonthKey);
  const [isUploadOpen, setUploadOpen] = useState(false);
  const [isManageOpen, setManageOpen] = useState(false);
  const [reassignTxn, setReassignTxn] = useState<Transaction | null>(null);
  const [txnFilter, setTxnFilter] = useState<string | 'all' | '__uncategorised__'>('all');

  const topLevelCategories = useMemo(
    () => store.categories.filter((c) => c.parentId === null),
    [store.categories],
  );

  const previousMonthKey = shiftMonth(monthKey, -1);

  const summary = useMemo(
    () =>
      buildSummary({
        transactions: store.transactions,
        categories: store.categories,
        accountId,
        monthKey,
        previousMonthKey,
        topLevelCategoryOf: store.topLevelCategoryOf,
      }),
    [
      store.transactions,
      store.categories,
      accountId,
      monthKey,
      previousMonthKey,
      store.topLevelCategoryOf,
    ],
  );

  const breakdown = useMemo(
    () =>
      buildCategoryBreakdown({
        transactions: store.transactions,
        categories: store.categories,
        accountId,
        monthKey,
        previousMonthKey,
        topLevelCategoryOf: store.topLevelCategoryOf,
      }),
    [
      store.transactions,
      store.categories,
      accountId,
      monthKey,
      previousMonthKey,
      store.topLevelCategoryOf,
    ],
  );

  const trendMonthKeys = useMemo(() => listMonthKeys(trendFrom, trendTo), [trendFrom, trendTo]);
  const trend = useMemo(
    () =>
      buildMonthlyTrend({
        transactions: store.transactions,
        categories: store.categories,
        accountId,
        monthKeys: trendMonthKeys,
        topLevelCategoryOf: store.topLevelCategoryOf,
      }),
    [store.transactions, store.categories, accountId, trendMonthKeys, store.topLevelCategoryOf],
  );

  const monthTransactions = useMemo(
    () =>
      store.transactions.filter(
        (t) =>
          monthKeyOf(t.date) === monthKey && (accountId === 'all' || t.accountId === accountId),
      ),
    [store.transactions, monthKey, accountId],
  );

  const handleFocusNeedsReview = () => {
    setActiveTab('month');
    setTxnFilter('__uncategorised__');
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Spending</h1>
          <p className="text-slate-500">
            Actual spend from your bank statements, broken down by category.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleFocusNeedsReview}
            className={clsx(
              'flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors',
              summary.uncategorisedCount > 0
                ? 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100'
                : 'border-slate-200 bg-white text-slate-400',
            )}
          >
            <AlertCircle size={16} />
            Needs review
            <span
              className={clsx(
                'inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-xs font-semibold',
                summary.uncategorisedCount > 0
                  ? 'bg-rose-600 text-white'
                  : 'bg-slate-200 text-slate-500',
              )}
            >
              {summary.uncategorisedCount}
            </span>
          </button>
          <button
            onClick={() => setManageOpen(true)}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            <Tag size={16} /> Categories
          </button>
          <button
            onClick={() => setUploadOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm text-white hover:bg-indigo-700"
          >
            <Upload size={16} /> Upload statement
          </button>
        </div>
      </header>

      <div className="flex flex-wrap items-end gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
        <label className="flex flex-col text-xs font-medium tracking-wider text-slate-500 uppercase">
          Account
          <select
            value={accountId}
            onChange={(e) => setAccountId(e.target.value as any)}
            className="mt-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-normal text-slate-700 normal-case"
          >
            <option value="all">All accounts</option>
            {store.accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </label>
        {activeTab === 'month' ? (
          <label className="flex flex-col text-xs font-medium tracking-wider text-slate-500 uppercase">
            Month
            <input
              type="month"
              value={monthKey}
              onChange={(e) => setMonthKey(e.target.value)}
              className="mt-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-normal text-slate-700 normal-case"
            />
          </label>
        ) : (
          <>
            <label className="flex flex-col text-xs font-medium tracking-wider text-slate-500 uppercase">
              From
              <input
                type="month"
                value={trendFrom}
                onChange={(e) => setTrendFrom(e.target.value)}
                className="mt-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-normal text-slate-700 normal-case"
              />
            </label>
            <label className="flex flex-col text-xs font-medium tracking-wider text-slate-500 uppercase">
              To
              <input
                type="month"
                value={trendTo}
                onChange={(e) => setTrendTo(e.target.value)}
                className="mt-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-normal text-slate-700 normal-case"
              />
            </label>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          title="Total spent"
          value={`£${summary.totalSpent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          subtext={formatMonthLabel(monthKey)}
          tone="indigo"
        />
        <SummaryCard
          title="Largest category"
          value={summary.largestCategory ? summary.largestCategory.name : '—'}
          subtext={
            summary.largestCategory
              ? `£${summary.largestCategory.amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
              : 'No spending'
          }
          tone="emerald"
        />
        <SummaryCard
          title="Needs review"
          value={`£${summary.uncategorisedAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
          subtext={`${summary.uncategorisedCount} transactions`}
          tone="rose"
        />
        <SummaryCard
          title="Change vs prev month"
          value={`${summary.changeAbsolute >= 0 ? '+' : ''}£${summary.changeAbsolute.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
          subtext={`${summary.changePercent >= 0 ? '+' : ''}${summary.changePercent.toFixed(1)}%`}
          tone={summary.changeAbsolute <= 0 ? 'emerald' : 'amber'}
          icon={summary.changeAbsolute <= 0 ? <TrendingDown size={18} /> : <TrendingUp size={18} />}
        />
      </div>

      <div className="flex gap-6 border-b border-slate-200">
        <TabButton
          label="This month"
          active={activeTab === 'month'}
          onClick={() => setActiveTab('month')}
        />
        <TabButton
          label="Over time"
          active={activeTab === 'trend'}
          onClick={() => setActiveTab('trend')}
        />
      </div>

      {activeTab === 'month' ? (
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <CategoryBreakdownDonut breakdown={breakdown} />
          </div>
          <div className="space-y-6 lg:col-span-3">
            <CategoryTable breakdown={breakdown} total={summary.totalSpent} />
            <TransactionList
              transactions={monthTransactions}
              categoriesById={store.categoriesById}
              topLevelCategories={topLevelCategories}
              onReassign={setReassignTxn}
              filterCategoryId={txnFilter}
              onFilterChange={setTxnFilter}
            />
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <SpendingTrendChart trend={trend} topLevelCategories={topLevelCategories} />
          <TrendTotalsTable trend={trend} topLevelCategories={topLevelCategories} />
        </div>
      )}

      <div className="flex items-start gap-3 rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-white p-5">
        <div className="rounded-lg border border-indigo-100 bg-white p-2 text-indigo-500">
          <Sparkles size={18} />
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-slate-800">Auto-categorisation rules — coming soon</h4>
          <p className="mt-1 text-sm text-slate-600">
            In a later phase you'll be able to define rules like "TESCO → Groceries" so future
            uploaded statements auto-categorise, with an AI service handling anything the rules
            don't match. For now, use the "Reassign" action to correct transactions manually.
          </p>
        </div>
        <button
          disabled
          className="flex cursor-not-allowed items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-400"
        >
          <Settings size={16} /> Manage rules
        </button>
      </div>

      <UploadStatementModal
        isOpen={isUploadOpen}
        accounts={store.accounts}
        defaultAccountId={accountId === 'all' ? (store.accounts[0]?.id ?? '') : accountId}
        defaultMonthKey={monthKey}
        onClose={() => setUploadOpen(false)}
        onSimulate={store.simulateUpload}
      />
      <ManageCategoriesModal
        isOpen={isManageOpen}
        categories={store.categories}
        onClose={() => setManageOpen(false)}
        onAdd={store.addCategory}
        onRename={store.renameCategory}
        onDelete={store.deleteCategory}
      />
      <ReassignCategoryModal
        isOpen={reassignTxn !== null}
        transaction={reassignTxn}
        categories={store.categories}
        onClose={() => setReassignTxn(null)}
        onSubmit={store.reassignCategory}
      />
    </div>
  );
};

interface SummaryCardProps {
  title: string;
  value: string;
  subtext: string;
  tone: 'indigo' | 'emerald' | 'rose' | 'amber';
  icon?: React.ReactNode;
}

const SummaryCard: React.FC<SummaryCardProps> = ({ title, value, subtext, tone, icon }) => {
  const toneStyles = {
    indigo: 'border-indigo-100 bg-indigo-50/30 text-indigo-700',
    emerald: 'border-emerald-100 bg-emerald-50/30 text-emerald-700',
    rose: 'border-rose-100 bg-rose-50/30 text-rose-700',
    amber: 'border-amber-100 bg-amber-50/30 text-amber-700',
  }[tone];
  return (
    <div
      className={clsx(
        'flex items-start justify-between rounded-xl border p-4 shadow-sm',
        toneStyles,
      )}
    >
      <div className="space-y-1">
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <h2 className="text-2xl font-bold text-slate-900">{value}</h2>
        <p className="text-xs text-slate-400">{subtext}</p>
      </div>
      <div className="rounded-xl border border-white/60 bg-white/80 p-2">
        {icon ?? <Receipt size={18} />}
      </div>
    </div>
  );
};

interface TabButtonProps {
  label: string;
  active: boolean;
  onClick: () => void;
}

const TabButton: React.FC<TabButtonProps> = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    className={clsx(
      'relative pb-3 text-sm font-medium transition-colors',
      active ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-700',
    )}
  >
    {label}
    {active && (
      <div className="absolute bottom-0 left-0 h-0.5 w-full rounded-t-full bg-indigo-600" />
    )}
  </button>
);
