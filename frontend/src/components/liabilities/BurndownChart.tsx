import React, { useMemo, useState } from 'react';
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { clsx } from 'clsx';
import { type Liability, type LiabilitySnapshot, type LiabilityOverpayment } from './types';
import {
  buildBurndownSeries,
  debtFreeDate,
  formatMonthKey,
  type BurndownScope,
} from '../../utils/burndownUtils';

const fmt = (n: number) =>
  '£' + n.toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

interface Props {
  liabilities: Liability[];
  snapshots: LiabilitySnapshot[];
  overpayments: LiabilityOverpayment[];
}

const SCOPE_OPTIONS: { label: string; value: BurndownScope }[] = [
  { label: 'All Debt', value: 'all' },
  { label: 'Secured', value: 'secured' },
  { label: 'Unsecured', value: 'unsecured' },
];

const LIABILITY_COLORS = [
  '#EF4444',
  '#F97316',
  '#F59E0B',
  '#EAB308',
  '#84CC16',
  '#10B981',
  '#06B6D4',
  '#6366F1',
  '#8B5CF6',
  '#EC4899',
];

function getLiabilityColor(liability: Liability, index: number): string {
  return liability.color ?? LIABILITY_COLORS[index % LIABILITY_COLORS.length];
}

type ViewMode = 'total' | 'stacked';

interface TooltipPayloadEntry {
  dataKey: string;
  name: string;
  value: number;
  fill?: string;
  color?: string;
  payload: { actual: number | null };
}

const BurndownTooltip: React.FC<{
  active?: boolean;
  payload?: TooltipPayloadEntry[];
  label?: string;
  viewMode: ViewMode;
}> = ({ active: tooltipActive, payload, label, viewMode }) => {
  if (!tooltipActive || !payload?.length) return null;
  const isProjected = payload[0]?.payload?.actual == null;
  return (
    <div className="min-w-[160px] rounded-xl border border-slate-200 bg-white p-3 text-sm shadow-lg">
      <p className="mb-2 font-semibold text-slate-700">{label}</p>
      {isProjected && <p className="mb-1 text-xs text-slate-400 italic">Projected</p>}
      {viewMode === 'total' ? (
        <p className="font-bold text-rose-600">{fmt(payload[0]?.value ?? 0)}</p>
      ) : (
        payload
          .filter((p) => p.dataKey.startsWith('l_'))
          .map((p) => (
            <div key={p.dataKey} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-1.5">
                <div
                  className="h-2.5 w-2.5 rounded-sm"
                  style={{ backgroundColor: p.fill ?? p.color }}
                />
                <span className="max-w-[100px] truncate text-slate-600">{p.name}</span>
              </div>
              <span className="font-semibold text-slate-800">{fmt(p.value)}</span>
            </div>
          ))
      )}
    </div>
  );
};

export const BurndownChart: React.FC<Props> = ({ liabilities, snapshots, overpayments }) => {
  const [scope, setScope] = useState<BurndownScope>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('total');

  const active = liabilities.filter((l) => !l.archivedAt);

  const series = useMemo(
    () => buildBurndownSeries(active, snapshots, overpayments, scope),
    [active, snapshots, overpayments, scope],
  );

  const debtFree = useMemo(() => debtFreeDate(series), [series]);

  const filteredLiabilities = active.filter((l) => {
    if (scope === 'all') return true;
    if (scope === 'secured') return ['mortgage', 'car_loan'].includes(l.type);
    if (scope === 'unsecured') return !['mortgage', 'car_loan'].includes(l.type);
    return l.id === scope;
  });

  const chartData = series.map((pt) => ({
    monthKey: pt.monthKey,
    label: formatMonthKey(pt.monthKey),
    actual: pt.actual,
    projected: pt.projected,
    ...Object.fromEntries(filteredLiabilities.map((l) => [`l_${l.id}`, pt.byLiability[l.id] ?? 0])),
  }));

  const hasData = series.length > 0;

  if (!hasData) {
    return (
      <div className="flex min-h-[200px] flex-col items-center justify-center gap-2 rounded-2xl border border-slate-100 bg-white p-8 text-slate-400 shadow-sm">
        <p className="text-sm">Add balances to see the burndown chart.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-6 pt-5 pb-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">Debt Burndown</h3>
          {debtFree && (
            <p className="mt-0.5 text-xs font-medium text-emerald-600">
              Projected debt-free: {formatMonthKey(debtFree)}
            </p>
          )}
          {!debtFree && (
            <p className="mt-0.5 text-xs text-slate-400">
              Debt-free date not calculable — add interest rate &amp; payment info
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Scope selector */}
          <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
            {SCOPE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setScope(opt.value)}
                className={clsx(
                  'rounded-md px-3 py-1 text-xs font-medium transition-all',
                  scope === opt.value
                    ? 'bg-white text-slate-800 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700',
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {/* View toggle */}
          <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
            {(['total', 'stacked'] as ViewMode[]).map((v) => (
              <button
                key={v}
                onClick={() => setViewMode(v)}
                className={clsx(
                  'rounded-md px-3 py-1 text-xs font-medium capitalize transition-all',
                  viewMode === v
                    ? 'bg-white text-slate-800 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700',
                )}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="p-6">
        <ResponsiveContainer width="100%" height={280}>
          <ComposedChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="burnActual" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#EF4444" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#EF4444" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: '#94A3B8' }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tickFormatter={(v) => '£' + (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v)}
              tick={{ fontSize: 11, fill: '#94A3B8' }}
              tickLine={false}
              axisLine={false}
              width={55}
            />
            <Tooltip content={<BurndownTooltip viewMode={viewMode} />} />

            {viewMode === 'total' && (
              <>
                {/* Actual history — solid fill */}
                <Area
                  type="monotone"
                  dataKey="actual"
                  name="Actual"
                  stroke="#EF4444"
                  strokeWidth={2}
                  fill="url(#burnActual)"
                  dot={false}
                  activeDot={{ r: 4, fill: '#EF4444' }}
                  connectNulls={false}
                />
                {/* Projected — dashed line */}
                <Line
                  type="monotone"
                  dataKey="projected"
                  name="Projected"
                  stroke="#EF4444"
                  strokeWidth={1.5}
                  strokeDasharray="5 4"
                  dot={false}
                  activeDot={{ r: 4, fill: '#EF4444' }}
                />
              </>
            )}

            {viewMode === 'stacked' &&
              filteredLiabilities.map((l, i) => {
                const color = getLiabilityColor(l, i);
                return (
                  <Area
                    key={l.id}
                    type="monotone"
                    dataKey={`l_${l.id}`}
                    name={l.name}
                    stackId="stack"
                    stroke={color}
                    fill={color}
                    fillOpacity={0.6}
                    strokeWidth={1.5}
                    dot={false}
                  />
                );
              })}

            {debtFree && (
              <ReferenceLine
                x={formatMonthKey(debtFree)}
                stroke="#10B981"
                strokeDasharray="4 3"
                strokeWidth={1.5}
                label={{ value: 'Debt-free', position: 'top', fill: '#10B981', fontSize: 11 }}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {viewMode === 'stacked' && filteredLiabilities.length > 0 && (
        <div className="flex flex-wrap gap-3 px-6 pb-5">
          {filteredLiabilities.map((l, i) => (
            <div key={l.id} className="flex items-center gap-1.5 text-xs text-slate-600">
              <div
                className="h-3 w-3 rounded-sm"
                style={{ backgroundColor: getLiabilityColor(l, i) }}
              />
              {l.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
