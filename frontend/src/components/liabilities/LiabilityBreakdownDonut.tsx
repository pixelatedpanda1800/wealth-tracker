import React, { useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import {
  type Liability,
  type LiabilitySnapshot,
  LIABILITY_TYPE_LABELS,
  latestSnapshot,
} from './types';

const fmt = (n: number) =>
  '£' + n.toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

interface DonutEntry {
  type: string;
  label: string;
  value: number;
  color: string;
}

const DonutTooltip: React.FC<{
  active?: boolean;
  payload?: Array<{ payload: DonutEntry }>;
  total: number;
}> = ({ active: tooltipActive, payload, total }) => {
  if (!tooltipActive || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 text-sm shadow-lg">
      <p className="font-semibold text-slate-700">{d.label}</p>
      <p className="mt-0.5 font-bold text-slate-800">{fmt(d.value)}</p>
      <p className="text-xs text-slate-400">{((d.value / total) * 100).toFixed(1)}% of total</p>
    </div>
  );
};

const TYPE_COLORS: Record<string, string> = {
  mortgage: '#6366F1',
  personal_loan: '#F59E0B',
  car_loan: '#10B981',
  credit_card: '#EF4444',
  student_loan: '#8B5CF6',
  overdraft: '#F97316',
  bnpl: '#EC4899',
  tax_owed: '#EAB308',
  family_loan: '#06B6D4',
  other: '#64748B',
};

interface Props {
  liabilities: Liability[];
  snapshots: LiabilitySnapshot[];
}

export const LiabilityBreakdownDonut: React.FC<Props> = ({ liabilities, snapshots }) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const active = liabilities.filter((l) => !l.archivedAt);

  // Group by type, sum latest balances
  const byType: Record<string, number> = {};
  for (const l of active) {
    const snap = latestSnapshot(snapshots, l.id);
    if (!snap) continue;
    const bal = snap.balance;
    if (bal <= 0) continue;
    byType[l.type] = (byType[l.type] ?? 0) + bal;
  }

  const data = Object.entries(byType)
    .map(([type, value]) => ({
      type,
      label: LIABILITY_TYPE_LABELS[type as keyof typeof LIABILITY_TYPE_LABELS] ?? type,
      value,
      color: TYPE_COLORS[type] ?? '#64748B',
    }))
    .sort((a, b) => b.value - a.value);

  const total = data.reduce((s, d) => s + d.value, 0);

  if (data.length === 0) {
    return (
      <div className="flex min-h-[200px] items-center justify-center rounded-2xl border border-slate-100 bg-white p-6 text-slate-400 shadow-sm">
        <p className="text-sm">No balance data yet.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-6 pt-5 pb-4">
        <h3 className="text-sm font-semibold text-slate-800">Breakdown by Type</h3>
      </div>
      <div className="p-6">
        <div className="flex items-center gap-6">
          <div className="relative flex-shrink-0" style={{ width: 140, height: 140 }}>
            <ResponsiveContainer width={140} height={140}>
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={42}
                  outerRadius={64}
                  dataKey="value"
                  paddingAngle={2}
                  onMouseEnter={(_, index) => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(null)}
                >
                  {data.map((entry, index) => (
                    <Cell
                      key={entry.type}
                      fill={entry.color}
                      opacity={activeIndex === null || activeIndex === index ? 1 : 0.4}
                      stroke="none"
                    />
                  ))}
                </Pie>
                <Tooltip content={<DonutTooltip total={total} />} />
              </PieChart>
            </ResponsiveContainer>
            {/* Centre label */}
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              {activeIndex !== null ? (
                <>
                  <span className="text-xs font-bold text-slate-800">
                    {fmt(data[activeIndex].value)}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {((data[activeIndex].value / total) * 100).toFixed(0)}%
                  </span>
                </>
              ) : (
                <>
                  <span className="text-xs font-bold text-slate-800">{fmt(total)}</span>
                  <span className="text-[10px] text-slate-400">Total</span>
                </>
              )}
            </div>
          </div>

          {/* Legend */}
          <div className="min-w-0 flex-1 space-y-2">
            {data.map((d, i) => (
              <div
                key={d.type}
                className="flex items-center gap-2"
                onMouseEnter={() => setActiveIndex(i)}
                onMouseLeave={() => setActiveIndex(null)}
              >
                <div
                  className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
                  style={{ backgroundColor: d.color }}
                />
                <span className="flex-1 truncate text-xs text-slate-600">{d.label}</span>
                <span className="flex-shrink-0 text-xs font-semibold text-slate-700">
                  {fmt(d.value)}
                </span>
                <span className="w-9 flex-shrink-0 text-right text-[10px] text-slate-400">
                  {((d.value / total) * 100).toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
