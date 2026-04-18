import React, { useMemo, useState } from 'react';
import {
    ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, ReferenceLine, Legend,
} from 'recharts';
import { clsx } from 'clsx';
import { type Liability, type LiabilitySnapshot, type LiabilityOverpayment, LIABILITY_TYPE_LABELS } from './types';
import { buildBurndownSeries, debtFreeDate, formatMonthKey, type BurndownScope } from '../../utils/burndownUtils';

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
    '#EF4444', '#F97316', '#F59E0B', '#EAB308',
    '#84CC16', '#10B981', '#06B6D4', '#6366F1',
    '#8B5CF6', '#EC4899',
];

function getLiabilityColor(liability: Liability, index: number): string {
    return liability.color ?? LIABILITY_COLORS[index % LIABILITY_COLORS.length];
}

type ViewMode = 'total' | 'stacked';

export const BurndownChart: React.FC<Props> = ({ liabilities, snapshots, overpayments }) => {
    const [scope, setScope] = useState<BurndownScope>('all');
    const [viewMode, setViewMode] = useState<ViewMode>('total');

    const active = liabilities.filter(l => !l.archivedAt);

    const scopeOptions = [
        ...SCOPE_OPTIONS,
        ...active.map(l => ({ label: l.name, value: l.id })),
    ];

    const series = useMemo(
        () => buildBurndownSeries(active, snapshots, overpayments, scope),
        [active, snapshots, overpayments, scope],
    );

    const debtFree = useMemo(() => debtFreeDate(series), [series]);

    const filteredLiabilities = active.filter(l => {
        if (scope === 'all') return true;
        if (scope === 'secured') return ['mortgage', 'car_loan'].includes(l.type);
        if (scope === 'unsecured') return !['mortgage', 'car_loan'].includes(l.type);
        return l.id === scope;
    });

    const chartData = series.map(pt => ({
        monthKey: pt.monthKey,
        label: formatMonthKey(pt.monthKey),
        actual: pt.actual,
        projected: pt.projected,
        ...Object.fromEntries(
            filteredLiabilities.map(l => [`l_${l.id}`, pt.byLiability[l.id] ?? 0])
        ),
    }));

    const hasData = series.length > 0;

    const CustomTooltip = ({ active: tooltipActive, payload, label }: any) => {
        if (!tooltipActive || !payload?.length) return null;
        const isProjected = payload[0]?.payload?.actual == null;
        return (
            <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-lg text-sm min-w-[160px]">
                <p className="font-semibold text-slate-700 mb-2">{label}</p>
                {isProjected && <p className="text-xs text-slate-400 italic mb-1">Projected</p>}
                {viewMode === 'total' ? (
                    <p className="text-rose-600 font-bold">{fmt(payload[0]?.value ?? 0)}</p>
                ) : (
                    payload
                        .filter((p: any) => p.dataKey.startsWith('l_'))
                        .map((p: any) => (
                            <div key={p.dataKey} className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-1.5">
                                    <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: p.fill || p.color }} />
                                    <span className="text-slate-600 truncate max-w-[100px]">{p.name}</span>
                                </div>
                                <span className="font-semibold text-slate-800">{fmt(p.value)}</span>
                            </div>
                        ))
                )}
            </div>
        );
    };

    if (!hasData) {
        return (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 flex flex-col items-center justify-center gap-2 text-slate-400 min-h-[200px]">
                <p className="text-sm">Add balances to see the burndown chart.</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            {/* Controls */}
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100 flex-wrap gap-3">
                <div>
                    <h3 className="text-sm font-semibold text-slate-800">Debt Burndown</h3>
                    {debtFree && (
                        <p className="text-xs text-emerald-600 font-medium mt-0.5">
                            Projected debt-free: {formatMonthKey(debtFree)}
                        </p>
                    )}
                    {!debtFree && (
                        <p className="text-xs text-slate-400 mt-0.5">Debt-free date not calculable — add interest rate &amp; payment info</p>
                    )}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    {/* Scope selector */}
                    <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
                        {SCOPE_OPTIONS.map(opt => (
                            <button
                                key={opt.value}
                                onClick={() => setScope(opt.value)}
                                className={clsx(
                                    'px-3 py-1 rounded-md text-xs font-medium transition-all',
                                    scope === opt.value ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700',
                                )}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                    {/* View toggle */}
                    <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
                        {(['total', 'stacked'] as ViewMode[]).map(v => (
                            <button
                                key={v}
                                onClick={() => setViewMode(v)}
                                className={clsx(
                                    'px-3 py-1 rounded-md text-xs font-medium transition-all capitalize',
                                    viewMode === v ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700',
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
                            tickFormatter={v => '£' + (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v)}
                            tick={{ fontSize: 11, fill: '#94A3B8' }}
                            tickLine={false}
                            axisLine={false}
                            width={55}
                        />
                        <Tooltip content={<CustomTooltip />} />

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

                        {viewMode === 'stacked' && filteredLiabilities.map((l, i) => {
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
                            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: getLiabilityColor(l, i) }} />
                            {l.name}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
