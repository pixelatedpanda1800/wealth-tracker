import React from 'react';
import {
    LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { clsx } from 'clsx';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import type { InvestmentHolding, InvestmentSnapshot } from './types';
import { HOLDING_TYPE_LABELS } from './types';
import { TradingViewWidget } from './TradingViewWidget';
import {
    calculateGroupStats,
    filterSnapshotsByPeriod,
    holdingColor,
    type Period,
} from '../../utils/investmentUtils';

interface HoldingPerformanceCardProps {
    holdings: InvestmentHolding[];
    snapshots: InvestmentSnapshot[];
    period: Period;
    index: number;
}

export const HoldingPerformanceCard: React.FC<HoldingPerformanceCardProps> = ({
    holdings, snapshots, period, index,
}) => {
    const primary = holdings[0];
    const isGrouped = holdings.length > 1;
    const ticker = primary.ticker ?? null;

    const stats = calculateGroupStats(holdings, snapshots, period);
    // For the fallback chart use the first (and only) holding's snapshots
    const periodSnaps = filterSnapshotsByPeriod(snapshots, primary.id, period);
    const color = holdingColor(primary, index);
    const hasTicker = !!ticker;

    const isPositive = stats.change >= 0;
    const fmt = (n: number) =>
        `£${Math.abs(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const fmtPct = (n: number) => `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`;

    // Build fallback chart data from snapshots (single-holding groups only)
    const chartData = periodSnaps.map(s => ({
        label: `${s.month} '${s.year.toString().slice(-2)}`,
        value: Number(s.value),
    }));

    return (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            {/* Card header */}
            <div className="px-5 pt-5 pb-3 flex items-start justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                    <div className="min-w-0">
                        <p className="font-semibold text-slate-800 truncate">{primary.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-slate-400 bg-slate-100 rounded-md px-2 py-0.5">
                                {HOLDING_TYPE_LABELS[primary.type]}
                            </span>
                            {ticker && (
                                <span className="text-xs font-mono text-slate-500">{ticker}</span>
                            )}
                        </div>
                    </div>
                </div>
                {/* Account badge(s) */}
                {isGrouped ? (
                    <div className="flex flex-wrap gap-1 justify-end flex-shrink-0">
                        {holdings.map(h => h.wealthSource && (
                            <span key={h.id} className="text-xs text-slate-400 bg-slate-50 border border-slate-100 rounded-lg px-2 py-1">
                                {h.wealthSource.name}
                            </span>
                        ))}
                    </div>
                ) : (
                    primary.wealthSource && (
                        <span className="text-xs text-slate-400 bg-slate-50 border border-slate-100 rounded-lg px-2 py-1 flex-shrink-0">
                            {primary.wealthSource.name}
                        </span>
                    )
                )}
            </div>

            {/* Chart area */}
            <div className="px-5">
                {hasTicker ? (
                    <TradingViewWidget ticker={ticker!} period={period} />
                ) : chartData.length >= 2 ? (
                    <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                <XAxis
                                    dataKey="label"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#94A3B8', fontSize: 10 }}
                                    dy={6}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#94A3B8', fontSize: 10 }}
                                    tickFormatter={v => `£${Number(v).toLocaleString()}`}
                                    width={65}
                                />
                                <Tooltip
                                    contentStyle={{
                                        borderRadius: '10px',
                                        border: '1px solid #E2E8F0',
                                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                                        backgroundColor: 'rgba(255,255,255,0.95)',
                                        fontSize: '12px',
                                    }}
                                    formatter={(value: any) => [`£${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 'Value']}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="value"
                                    stroke={color}
                                    strokeWidth={2}
                                    dot={false}
                                    activeDot={{ r: 4, fill: color }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-48 bg-slate-50 rounded-xl text-slate-400 text-sm">
                        {periodSnaps.length === 0
                            ? 'No data for this period'
                            : 'Add at least 2 months to see chart'}
                    </div>
                )}
            </div>

            {/* Stats footer */}
            <div className="px-5 py-4 mt-2 border-t border-slate-50 grid grid-cols-2 gap-4">
                {/* Current value */}
                <div>
                    <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-0.5">Current Value</p>
                    <p className="text-lg font-bold text-slate-800">{fmt(stats.currentValue)}</p>
                </div>

                {/* Period change */}
                <div>
                    <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-0.5">Period Change</p>
                    <p className={clsx('text-base font-bold flex items-center gap-0.5', isPositive ? 'text-emerald-600' : 'text-rose-600')}>
                        {isPositive ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                        {(isPositive ? '+' : '-') + fmt(stats.change)}
                    </p>
                    <p className={clsx('text-xs font-semibold', isPositive ? 'text-emerald-500' : 'text-rose-500')}>
                        {fmtPct(stats.changePct)}
                    </p>
                </div>

                {/* Cost basis */}
                {stats.costBasis !== null && (
                    <div>
                        <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-0.5">Cost Basis</p>
                        <p className="text-sm font-semibold text-slate-600">{fmt(stats.costBasis)}</p>
                    </div>
                )}

                {/* Total return */}
                {stats.gainLoss !== null && stats.returnPct !== null && (
                    <div>
                        <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-0.5">Total Return</p>
                        <p className={clsx('text-sm font-bold', stats.gainLoss >= 0 ? 'text-emerald-600' : 'text-rose-600')}>
                            {(stats.gainLoss >= 0 ? '+' : '-') + fmt(stats.gainLoss)}
                        </p>
                        <p className={clsx('text-xs font-semibold', stats.gainLoss >= 0 ? 'text-emerald-500' : 'text-rose-500')}>
                            {fmtPct(stats.returnPct)}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};
