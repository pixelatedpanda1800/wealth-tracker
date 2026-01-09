import React, { useState } from 'react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend
} from 'recharts';
import { type WealthEntry, type ViewMode, sortSources, getDefaultColor } from '../utils/dataUtils';
import { type WealthSource } from '../api';

interface WealthChartProps {
    data: WealthEntry[];
    sources: WealthSource[];
    viewMode: ViewMode;
    onViewModeChange: (mode: ViewMode) => void;
}

export const WealthChart: React.FC<WealthChartProps> = ({ data, sources, viewMode, onViewModeChange }) => {
    const [focusedSourceId, setFocusedSourceId] = useState<string | null>(null);

    // Use shared sorting logic
    const sortedSources = sortSources(sources);

    const chartData = data.map(d => {
        const flattenedValues: any = { ...d };
        Object.entries(d.values || {}).forEach(([id, val]) => {
            flattenedValues[`source_${id}`] = val;
        });
        return {
            ...flattenedValues,
            displayLabel: d.month.includes('Q') || d.month.includes('FY')
                ? d.month
                : `${d.month} '${d.year.toString().slice(-2)}`
        };
    });

    const handleLegendClick = (sourceId: string) => {
        if (focusedSourceId === sourceId) {
            // Clicking the focused source again - unfocus all
            setFocusedSourceId(null);
        } else {
            // Focus on this source
            setFocusedSourceId(sourceId);
        }
    };

    // Custom legend renderer
    const renderLegend = (props: any) => {
        const { payload } = props;

        // Sort payload to match our desired source order
        const sortedPayload = [...payload].sort((a, b) => {
            const sourceIdA = a.dataKey?.replace('source_', '') || '';
            const sourceIdB = b.dataKey?.replace('source_', '') || '';

            const sourceA = sortedSources.find(s => s.id === sourceIdA);
            const sourceB = sortedSources.find(s => s.id === sourceIdB);

            if (!sourceA || !sourceB) return 0;

            // Re-use logic or just simpler index comparison since sortedSources is already sorted
            return sortedSources.indexOf(sourceA) - sortedSources.indexOf(sourceB);
        });

        return (
            <div className="flex flex-wrap justify-center gap-4 mb-4">
                {sortedPayload.map((entry: any) => {
                    // Extract source ID from dataKey (format: "source_<id>")
                    const sourceId = entry.dataKey?.replace('source_', '') || '';
                    const isFocused = focusedSourceId === sourceId;
                    const isDimmed = focusedSourceId !== null && !isFocused;

                    return (
                        <button
                            key={`legend-${sourceId}`}
                            onClick={() => handleLegendClick(sourceId)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all cursor-pointer hover:bg-slate-50 ${isDimmed ? 'opacity-40' : 'opacity-100'
                                } ${isFocused ? 'ring-2 ring-offset-1 ring-indigo-400 bg-slate-50' : ''}`}
                        >
                            <div
                                className="w-3 h-3 rounded-sm"
                                style={{ backgroundColor: entry.color }}
                            />
                            <span className={`text-sm font-medium ${isDimmed ? 'text-slate-400' : 'text-slate-700'}`}>
                                {entry.value}
                            </span>
                        </button>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="h-[400px] w-full p-4 bg-white rounded-xl flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-slate-800">
                    Source Growth ({viewMode === 'monthly' ? 'Monthly' : viewMode === 'quarterly' ? 'Quarterly' : 'Yearly'})
                </h3>
                <div className="flex bg-slate-100 p-1 rounded-lg">
                    {(['monthly', 'quarterly', 'yearly'] as ViewMode[]).map((mode) => (
                        <button
                            key={mode}
                            onClick={() => onViewModeChange(mode)}
                            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${viewMode === mode
                                ? 'bg-white text-indigo-600 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            {mode.charAt(0).toUpperCase() + mode.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                    data={chartData}
                    margin={{
                        top: 10,
                        right: 10,
                        left: 0,
                        bottom: 0,
                    }}
                >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis
                        dataKey="displayLabel"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#94A3B8', fontSize: 12 }}
                        dy={10}
                    />
                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#94A3B8', fontSize: 12 }}
                        tickFormatter={(value) => `£${value.toLocaleString()}`}
                    />
                    <Tooltip
                        contentStyle={{
                            borderRadius: '12px',
                            border: '1px solid #E2E8F0',
                            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                            backdropFilter: 'blur(4px)'
                        }}
                        formatter={(value: any, name: string | undefined, props: any) => {
                            const isEstimate = props.payload.isEstimate;
                            return [
                                <span key={name} className={isEstimate ? "text-slate-400 italic" : "font-semibold"}>
                                    £{Number(value).toLocaleString()}{isEstimate ? " (Est)" : ""}
                                </span>,
                                name
                            ];
                        }}
                    />
                    <Legend content={renderLegend} />
                    {sortedSources.map((source, index) => {
                        const isFocused = focusedSourceId === source.id;
                        const shouldHide = focusedSourceId !== null && !isFocused;
                        const color = source.color || getDefaultColor(index);

                        return (
                            <Area
                                key={source.id}
                                type="monotone"
                                dataKey={`source_${source.id}`}
                                stackId="1"
                                stroke={color}
                                fill={color}
                                fillOpacity={shouldHide ? 0 : 0.4}
                                strokeOpacity={shouldHide ? 0 : 1}
                                name={source.name}
                                hide={shouldHide}
                            />
                        );
                    })}
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};
