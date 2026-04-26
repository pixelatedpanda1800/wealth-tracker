import React, { useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { type WealthEntry, type ViewMode, sortSources, getDefaultColor } from '../utils/dataUtils';
import { type WealthSource } from '../api';

interface WealthChartProps {
  data: WealthEntry[];
  sources: WealthSource[];
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

export const WealthChart: React.FC<WealthChartProps> = ({
  data,
  sources,
  viewMode,
  onViewModeChange,
}) => {
  const [focusedSourceId, setFocusedSourceId] = useState<string | null>(null);

  // Use shared sorting logic
  const sortedSources = sortSources(sources);

  const chartData = data.map((d) => {
    const flattenedValues: any = { ...d };
    // Ensure every source has a value (default to 0) to prevent gaps in stacked area
    sources.forEach((source) => {
      flattenedValues[`source_${source.id}`] = d.values?.[source.id] ?? 0;
    });
    return {
      ...flattenedValues,
      displayLabel:
        d.month.includes('Q') || d.month.includes('FY')
          ? d.month
          : `${d.month} '${d.year.toString().slice(-2)}`,
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

      const sourceA = sortedSources.find((s) => s.id === sourceIdA);
      const sourceB = sortedSources.find((s) => s.id === sourceIdB);

      if (!sourceA || !sourceB) return 0;

      // Re-use logic or just simpler index comparison since sortedSources is already sorted
      return sortedSources.indexOf(sourceA) - sortedSources.indexOf(sourceB);
    });

    return (
      <div className="mb-4 flex flex-wrap justify-center gap-4">
        {sortedPayload.map((entry: any) => {
          // Extract source ID from dataKey (format: "source_<id>")
          const sourceId = entry.dataKey?.replace('source_', '') || '';
          const isFocused = focusedSourceId === sourceId;
          const isDimmed = focusedSourceId !== null && !isFocused;

          return (
            <button
              key={`legend-${sourceId}`}
              onClick={() => handleLegendClick(sourceId)}
              className={`flex cursor-pointer items-center gap-2 rounded-lg px-3 py-1.5 transition-all hover:bg-slate-50 focus:outline-none ${
                isDimmed ? 'opacity-40' : 'opacity-100'
              } ${isFocused ? 'bg-slate-50 ring-2 ring-indigo-400 ring-offset-1' : ''}`}
            >
              <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: entry.color }} />
              <span
                className={`text-sm font-medium ${isDimmed ? 'text-slate-400' : 'text-slate-700'}`}
              >
                {entry.value}
              </span>
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex h-[400px] w-full flex-col rounded-xl bg-white p-4">
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-800">
          Source Growth (
          {viewMode === 'monthly' ? 'Monthly' : viewMode === 'quarterly' ? 'Quarterly' : 'Yearly'})
        </h3>
        <div className="flex rounded-lg bg-slate-100 p-1">
          {(['monthly', 'quarterly', 'yearly'] as ViewMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => onViewModeChange(mode)}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-all focus:outline-none ${
                viewMode === mode
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="h-[350px] w-full !border-0 !shadow-none outline-none focus:outline-none [&_*]:outline-none">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            className="outline-none focus:outline-none"
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
                backdropFilter: 'blur(4px)',
              }}
              formatter={(value: any, name: string | undefined, props: any) => {
                const isEstimate = props.payload.isEstimate;
                return [
                  <span
                    key={name}
                    className={isEstimate ? 'text-slate-400 italic' : 'font-semibold'}
                  >
                    £{Number(value).toLocaleString()}
                    {isEstimate ? ' (Est)' : ''}
                  </span>,
                  name,
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
                  type="linear"
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
    </div>
  );
};
