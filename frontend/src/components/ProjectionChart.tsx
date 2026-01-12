import React, { useState, useMemo } from 'react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
    ReferenceLine
} from 'recharts';
import { clsx } from 'clsx';
import { calculateProjections, type ProjectionTimeline, type WealthEntry } from '../utils/dataUtils';
import { type WealthSource } from '../api';

interface ProjectionChartProps {
    data: WealthEntry[];
    sources: WealthSource[];
}

export const ProjectionChart: React.FC<ProjectionChartProps> = ({ data, sources }) => {
    const [timeline, setTimeline] = useState<ProjectionTimeline>('monthly');
    const [selectedSourceId, setSelectedSourceId] = useState<string | undefined>(undefined);

    const projectionData = useMemo(() => {
        return calculateProjections(data, sources, timeline, selectedSourceId);
    }, [data, sources, timeline, selectedSourceId]);

    // Find where projections start for the reference line
    const projectionStartIdx = projectionData.findIndex(d => d.isProjection);
    const projectionStartLabel = projectionStartIdx > 0 ? projectionData[projectionStartIdx - 1].label : null;

    const selectedSourceName = selectedSourceId
        ? sources.find(s => s.id === selectedSourceId)?.name || 'Unknown'
        : 'Total Wealth';

    if (projectionData.length === 0) {
        return (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h3 className="text-lg font-semibold text-slate-800">Wealth Projection</h3>
                <p className="text-slate-400 text-center py-8">No data available for projections.</p>
            </div>
        );
    }

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-6">
            {/* Header with controls */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h3 className="text-lg font-semibold text-slate-800">Wealth Projection</h3>

                <div className="flex flex-wrap gap-3">
                    {/* Timeline Toggle */}
                    <div className="inline-flex rounded-lg bg-slate-100 p-1">
                        {(['monthly', 'quarterly', 'yearly'] as ProjectionTimeline[]).map(t => (
                            <button
                                key={t}
                                onClick={() => setTimeline(t)}
                                className={clsx(
                                    "px-3 py-1.5 text-sm font-medium rounded-md transition-all",
                                    timeline === t
                                        ? "bg-white text-indigo-600 shadow-sm"
                                        : "text-slate-500 hover:text-slate-700"
                                )}
                            >
                                {t.charAt(0).toUpperCase() + t.slice(1)}
                            </button>
                        ))}
                    </div>

                    {/* Source Selector */}
                    <select
                        value={selectedSourceId || ''}
                        onChange={(e) => setSelectedSourceId(e.target.value || undefined)}
                        className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    >
                        <option value="">Total Wealth</option>
                        {sources.map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Chart */}
            <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                        data={projectionData}
                        margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                    >
                        <defs>
                            <linearGradient id="projectionGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#6366F1" stopOpacity={0.05} />
                            </linearGradient>
                            <linearGradient id="actualGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                                <stop offset="95%" stopColor="#10B981" stopOpacity={0.1} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                        <XAxis
                            dataKey="label"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#94A3B8', fontSize: 11 }}
                            dy={10}
                            interval="preserveStartEnd"
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#94A3B8', fontSize: 11 }}
                            tickFormatter={(value) => `£${(value / 1000).toFixed(0)}k`}
                        />
                        <Tooltip
                            contentStyle={{
                                borderRadius: '12px',
                                border: '1px solid #E2E8F0',
                                boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                backdropFilter: 'blur(4px)'
                            }}
                            formatter={(value: any, _name: string | undefined, props: any) => {
                                const isProjection = props.payload.isProjection;
                                return [
                                    <span key="val" className={isProjection ? "text-indigo-500 italic" : "font-semibold text-emerald-600"}>
                                        £{Number(value).toLocaleString()}{isProjection ? " (Projected)" : ""}
                                    </span>,
                                    selectedSourceName
                                ];
                            }}
                        />
                        <Legend
                            verticalAlign="top"
                            height={36}
                            formatter={(value) => (
                                <span className="text-sm text-slate-600">{value}</span>
                            )}
                        />
                        {projectionStartLabel && (
                            <ReferenceLine
                                x={projectionStartLabel}
                                stroke="#94A3B8"
                                strokeDasharray="5 5"
                                label={{ value: 'Now', position: 'top', fill: '#64748B', fontSize: 11 }}
                            />
                        )}
                        <Area
                            type="monotone"
                            dataKey="value"
                            stroke="#6366F1"
                            fill="url(#projectionGradient)"
                            strokeWidth={2}
                            name={selectedSourceName}
                            dot={(props: any) => {
                                const { cx, cy, payload } = props;
                                if (!payload.isProjection) {
                                    return <circle cx={cx} cy={cy} r={4} fill="#10B981" stroke="#fff" strokeWidth={2} />;
                                }
                                return <circle cx={cx} cy={cy} r={3} fill="#6366F1" stroke="#fff" strokeWidth={2} />;
                            }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-6 text-xs text-slate-500">
                <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                    <span>Actual</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-indigo-500"></span>
                    <span>Projected</span>
                </div>
            </div>
        </div>
    );
};
