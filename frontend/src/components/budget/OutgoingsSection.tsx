import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Coffee,
  Home,
  ShoppingBag,
  CalendarClock,
  Calendar,
  FileText,
  PiggyBank,
} from 'lucide-react';
import { clsx } from 'clsx';
import type { OutgoingItem, OutgoingType } from './types';

interface OutgoingsSectionProps {
  outgoings: OutgoingItem[];
}

const CATEGORY_CONFIG: Record<
  OutgoingType,
  { label: string; icon: React.ReactNode; color: string; bgColor: string; borderColor: string }
> = {
  'non-negotiable': {
    label: 'Non-Negotiable',
    icon: <Home size={18} />,
    color: 'text-rose-700',
    bgColor: 'bg-rose-50',
    borderColor: 'border-rose-200',
  },
  required: {
    label: 'Required',
    icon: <ShoppingBag size={18} />,
    color: 'text-amber-700',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
  },
  optional: {
    label: 'Optional',
    icon: <Coffee size={18} />,
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
  },
  savings: {
    label: 'Savings',
    icon: <PiggyBank size={18} />,
    color: 'text-purple-700',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
  },
};

export const OutgoingsSection: React.FC<OutgoingsSectionProps> = ({ outgoings }) => {
  return (
    <div className="space-y-6">
      <OutgoingCategoryBlock
        title="Non-Negotiable"
        type="non-negotiable"
        items={outgoings.filter((o) => o.type === 'non-negotiable')}
      />
      <OutgoingCategoryBlock
        title="Required"
        type="required"
        items={outgoings.filter((o) => o.type === 'required')}
      />
      <OutgoingCategoryBlock
        title="Optional"
        type="optional"
        items={outgoings.filter((o) => o.type === 'optional')}
      />
    </div>
  );
};

interface CategoryBlockProps {
  title: string;
  type: OutgoingType;
  items: OutgoingItem[];
}

const OutgoingCategoryBlock: React.FC<CategoryBlockProps> = ({ title, type, items }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const config = CATEGORY_CONFIG[type];

  // Separate monthly and annual items
  const monthlyItems = items.filter((i) => i.frequency === 'monthly');
  const annualItems = items.filter((i) => i.frequency === 'annual');

  const monthlyTotal = monthlyItems.reduce((sum, i) => sum + i.amount, 0);
  const annualTotal = annualItems.reduce((sum, i) => sum + i.amount, 0);
  const annualAmortized = annualTotal / 12;

  const totalMonthlyImpact = monthlyTotal + annualAmortized;

  if (items.length === 0) return null;

  return (
    <div
      className={clsx(
        'overflow-hidden rounded-xl border transition-all',
        config.borderColor,
        isExpanded ? 'shadow-sm' : 'opacity-90',
      )}
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={clsx(
          'flex w-full items-center justify-between p-4',
          config.bgColor,
          config.color,
        )}
      >
        <div className="flex items-center gap-3">
          {config.icon}
          <span className="text-lg font-semibold">{title}</span>
          <span className="ml-2 rounded-full bg-white/50 px-2 py-0.5 text-xs font-medium">
            {items.length} items
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="font-bold">
            £
            {totalMonthlyImpact.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
            <span className="ml-1 text-xs font-normal opacity-70">/mo</span>
          </span>
          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>
      </button>

      {isExpanded && (
        <div className="space-y-4 bg-white p-4">
          {/* Monthly Items */}
          {monthlyItems.length > 0 && (
            <div className="space-y-2">
              {monthlyItems.map((item) => (
                <OutgoingItemRow key={item.id} item={item} />
              ))}
            </div>
          )}

          {/* Annual Items Section if exists */}
          {annualItems.length > 0 && (
            <div className="mt-4 rounded-lg border-t border-dashed border-slate-200 bg-yellow-50/50 p-3 pt-4">
              <div className="mb-3 flex items-center gap-2 text-amber-700">
                <CalendarClock size={16} />
                <h4 className="text-sm font-semibold tracking-wider uppercase">
                  Annual Expenses (Amortized)
                </h4>
              </div>

              <div className="space-y-2">
                {annualItems.map((item) => (
                  <OutgoingItemRow key={item.id} item={item} isAnnual />
                ))}
              </div>

              <div className="mt-3 flex items-center justify-between border-t border-amber-100 pt-3">
                <span className="text-xs font-medium text-amber-700">Total Amortized Cost</span>
                <span className="font-bold text-amber-700">
                  £
                  {annualAmortized.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                  <span className="text-xs font-normal opacity-70"> /mo</span>
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

interface OutgoingItemRowProps {
  item: OutgoingItem;
  isAnnual?: boolean;
}

const OutgoingItemRow: React.FC<OutgoingItemRowProps> = ({ item, isAnnual }) => {
  const [isRowExpanded, setIsRowExpanded] = useState(false);
  const hasDetails = item.paymentDate || item.notes;

  const displayAmount = isAnnual ? item.amount / 12 : item.amount;

  return (
    <div
      className={clsx(
        'rounded transition-all',
        isAnnual ? 'hover:bg-amber-50/50' : 'hover:bg-slate-50',
        isRowExpanded && (isAnnual ? 'bg-amber-50/50' : 'bg-slate-50'),
      )}
    >
      <div
        onClick={() => hasDetails && setIsRowExpanded(!isRowExpanded)}
        className={clsx(
          'flex items-center justify-between px-2 py-2',
          hasDetails && 'cursor-pointer',
        )}
      >
        <div className="flex flex-col">
          <span className="flex items-center gap-2 font-medium text-slate-700">
            {item.name}
            {hasDetails && (
              <span className="text-slate-400">
                {isRowExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </span>
            )}
          </span>
          {isAnnual && (
            <span className="text-xs text-slate-400">
              Paid Annually: £{item.amount.toLocaleString()}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span
            className={clsx(
              'rounded-full px-2 py-0.5 text-xs font-medium',
              isAnnual ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500',
            )}
          >
            {isAnnual ? 'Annual' : 'Monthly'}
          </span>
          <div className="text-right">
            <span className="block font-semibold text-slate-900">
              £
              {displayAmount.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
            {isAnnual && <span className="text-[10px] text-slate-400">/mo amortized</span>}
          </div>
        </div>
      </div>

      {/* Expanded Details */}
      {isRowExpanded && hasDetails && (
        <div className="mt-1 flex gap-6 border-t border-slate-100 px-3 pt-1 pb-3 text-sm">
          {item.paymentDate && (
            <div className="flex items-center gap-2 text-slate-600">
              <Calendar size={14} className="text-slate-400" />
              <span>
                Payment Date:{' '}
                <strong>
                  {item.paymentDate}
                  {item.paymentDate === 1 || item.paymentDate === 21 || item.paymentDate === 31
                    ? 'st'
                    : item.paymentDate === 2 || item.paymentDate === 22
                      ? 'nd'
                      : item.paymentDate === 3 || item.paymentDate === 23
                        ? 'rd'
                        : 'th'}
                </strong>
              </span>
            </div>
          )}
          {item.notes && (
            <div className="flex flex-1 items-start gap-2 text-slate-600">
              <FileText size={14} className="mt-0.5 flex-shrink-0 text-slate-400" />
              <span>{item.notes}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
