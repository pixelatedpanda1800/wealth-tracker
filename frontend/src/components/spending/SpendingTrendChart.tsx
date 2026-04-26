import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { MonthlySpend, SpendingCategory } from './types';

interface Props {
  trend: MonthlySpend[];
  topLevelCategories: SpendingCategory[];
}

export const SpendingTrendChart: React.FC<Props> = ({ trend, topLevelCategories }) => {
  const chartData = trend.map((m) => {
    const row: any = { label: m.label };
    topLevelCategories.forEach((c) => {
      row[c.id] = m.totalsByTopCategoryId[c.id] ?? 0;
    });
    row.__uncategorised__ = m.totalsByTopCategoryId['__uncategorised__'] ?? 0;
    return row;
  });

  const hasUncategorised = chartData.some((r) => r.__uncategorised__ > 0);

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-slate-800">Spending over time</h3>
          <p className="mt-0.5 text-xs text-slate-400">stacked by top-level category</p>
        </div>
      </div>
      <div className="h-[360px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#94A3B8', fontSize: 12 }}
              dy={8}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#94A3B8', fontSize: 12 }}
              tickFormatter={(value) => `£${Number(value).toLocaleString()}`}
            />
            <Tooltip
              contentStyle={{
                borderRadius: '12px',
                border: '1px solid #E2E8F0',
                boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                backgroundColor: 'rgba(255,255,255,0.95)',
              }}
              formatter={(value: any, name: any) => [
                `£${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
                name,
              ]}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            {topLevelCategories.map((c) => (
              <Bar key={c.id} dataKey={c.id} stackId="spend" fill={c.color} name={c.name} />
            ))}
            {hasUncategorised && (
              <Bar dataKey="__uncategorised__" stackId="spend" fill="#f43f5e" name="Needs review" />
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
