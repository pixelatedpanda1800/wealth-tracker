import React, { useState } from 'react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { clsx } from 'clsx';
import type { InvestmentHolding, InvestmentSnapshot } from './types';
import type { WealthSource } from '../../api';
import { buildAccountChartData, holdingColor } from '../../utils/investmentUtils';

interface AccountChartProps {
    source: WealthSource;
    holdings: InvestmentHolding[];
    snapshots: InvestmentSnapshot[];
}

export const AccountChart: React.FC<AccountChartProps> = ({ source, holdings, snapshots }) => {
    const [focusedId, setFocusedId] = useState<string | null>(null);

    const chartData = buildAccountChartData(holdings, snapshots);

    const latestTotal = chartData.length > 0
        ? holdings.reduce((sum, h) => {
            const key = `holding_${h.id}`;
            const lastPoint = chartData[chartData.length - 1];
            return sum + (Number(lastPoint[key]) || 0);
        }, 0)
        : 0;

    const renderLegend = (props: any) => {
        const { payload } = props;
        return (
            <div className="flex flex-wrap justify-center gap-3 mb-2">
                {payload.map((entry: any) => {
                    const id = entry.dataKey?.replace('holding_', '') || '';
                    const isFocused = focusedId === id;
                    const isDimmed = focusedId !== null && !isFocused;
                    return (
                        <button
                            key={id}
                            onClick={() => setFocusedId(focusedId === id ? null : id)}
                            className={clsx(
                                'flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all text-sm hover:bg-slate-50 focus:outline-none',
                                isDimmed ? 'opacity-40' : 'opacity-100',
                                isFocused && 'ring-2 ring-offset-1 ring-indigo-400 bg-slate-50',
                            )}
                        >
                            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: entry.color }} />
                            <span className={clsx('font-medium', isDimmed ? 'text-slate-400' : 'text-slate-700')}>
                                {entry.value}
                            </span>
                        </button>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-50">
                <div>
                    <h3 className="font-semibold text-slate-800">{source.name}</h3>
                    <p className="text-xs text-slate-400 mt-0.5 capitalize">{source.category}</p>
                </div>
                <div className="text-right">
                    <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-0.5">Total</p>
                    <p className="text-lg font-bold text-slate-800">
                        £{latestTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </p>
                </div>
            </div>

            {chartData.length < 2 ? (
                <div className="flex items-center justify-center h-48 text-slate-400 text-sm">
                    Add at least 2 months of values to see the chart.
                </div>
            ) : (
                <div className="p-4 h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                            <XAxis
                                dataKey="displayLabel"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#94A3B8', fontSize: 11 }}
                                dy={8}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#94A3B8', fontSize: 11 }}
                                tickFormatter={v => `£${Number(v).toLocaleString()}`}
                                width={70}
                            />
                            <Tooltip
                                contentStyle={{
                                    borderRadius: '12px',
                                    border: '1px solid #E2E8F0',
                                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                                    backgroundColor: 'rgba(255,255,255,0.95)',
                                }}
                                formatter={(value: any, name: string) => [
                                    `£${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
                                    name,
                                ]}
                            />
                            <Legend content={renderLegend} />
                            {holdings.map((holding, index) => {
                                const color = holdingColor(holding, index);
                                const isFocused = focusedId === holding.id;
                                const shouldHide = focusedId !== null && !isFocused;
                                return (
                                    <Area
                                        key={holding.id}
                                        type="linear"
                                        dataKey={`holding_${holding.id}`}
                                        stackId="1"
                                        stroke={color}
                                        fill={color}
                                        fillOpacity={shouldHide ? 0 : 0.4}
                                        strokeOpacity={shouldHide ? 0 : 1}
                                        name={holding.name}
                                        hide={shouldHide}
                                    />
                                );
                            })}
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    );
};
