import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { InvestmentHolding, InvestmentSnapshot } from './types';
import { buildAllocationData } from '../../utils/investmentUtils';

interface AllocationChartProps {
  holdings: InvestmentHolding[];
  snapshots: InvestmentSnapshot[];
}

export const AllocationChart: React.FC<AllocationChartProps> = ({ holdings, snapshots }) => {
  const data = buildAllocationData(holdings, snapshots);
  const total = data.reduce((sum, d) => sum + d.value, 0);

  if (data.length === 0) return null;

  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    if (percent < 0.06) return null;
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.55;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={12}
        fontWeight={600}
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  const renderLegend = (props: any) => {
    const { payload } = props;
    return (
      <div className="mt-2 flex flex-wrap justify-center gap-4">
        {payload.map((entry: any, i: number) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="font-medium text-slate-600">{entry.value}</span>
            <span className="text-slate-400">
              £
              {Number(data.find((d) => d.name === entry.value)?.value || 0).toLocaleString(
                undefined,
                { maximumFractionDigits: 0 },
              )}
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-slate-800">Portfolio Allocation</h3>
          <p className="mt-0.5 text-xs text-slate-400">by holding type</p>
        </div>
        <div className="text-right">
          <p className="mb-0.5 text-xs font-semibold tracking-wider text-slate-400 uppercase">
            Total
          </p>
          <p className="text-lg font-bold text-slate-800">
            £{total.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </p>
        </div>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data as any[]}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={95}
              dataKey="value"
              nameKey="name"
              paddingAngle={2}
              labelLine={false}
              label={renderCustomLabel}
            >
              {data.map((entry, index) => (
                <Cell key={index} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                borderRadius: '12px',
                border: '1px solid #E2E8F0',
                boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                backgroundColor: 'rgba(255,255,255,0.95)',
              }}
              formatter={(value: any, name: string | number | undefined) => [
                `£${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
                name,
              ]}
            />
            <Legend content={renderLegend} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
