import React from 'react';
import type { MonthlySpend, SpendingCategory } from './types';

interface Props {
  trend: MonthlySpend[];
  topLevelCategories: SpendingCategory[];
}

export const TrendTotalsTable: React.FC<Props> = ({ trend, topLevelCategories }) => {
  const hasUncategorised = trend.some(
    (m) => (m.totalsByTopCategoryId['__uncategorised__'] ?? 0) > 0,
  );
  const rows: { id: string; name: string; color: string }[] = topLevelCategories.map((c) => ({
    id: c.id,
    name: c.name,
    color: c.color,
  }));
  if (hasUncategorised) {
    rows.push({ id: '__uncategorised__', name: 'Needs review', color: '#f43f5e' });
  }

  const rowTotals = rows.map((r) =>
    trend.reduce((sum, m) => sum + (m.totalsByTopCategoryId[r.id] ?? 0), 0),
  );
  const colTotals = trend.map((m) =>
    rows.reduce((sum, r) => sum + (m.totalsByTopCategoryId[r.id] ?? 0), 0),
  );
  const grandTotal = rowTotals.reduce((s, v) => s + v, 0);

  const fmt = (n: number) =>
    n === 0 ? '—' : `£${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-6 py-4">
        <h3 className="font-semibold text-slate-800">Totals by month</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs tracking-wider text-slate-400 uppercase">
              <th className="px-6 py-2 font-medium">Category</th>
              {trend.map((m) => (
                <th key={m.monthKey} className="px-4 py-2 text-right font-medium">
                  {m.label}
                </th>
              ))}
              <th className="px-6 py-2 text-right font-medium">Total</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.id} className="border-t border-slate-100">
                <td className="px-6 py-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: r.color }}
                    />
                    <span className="font-medium text-slate-700">{r.name}</span>
                  </div>
                </td>
                {trend.map((m) => (
                  <td key={m.monthKey} className="px-4 py-2 text-right text-slate-700">
                    {fmt(m.totalsByTopCategoryId[r.id] ?? 0)}
                  </td>
                ))}
                <td className="px-6 py-2 text-right font-semibold text-slate-800">
                  {fmt(rowTotals[i])}
                </td>
              </tr>
            ))}
            <tr className="border-t border-slate-200 bg-slate-50">
              <td className="px-6 py-2 font-semibold text-slate-700">Monthly total</td>
              {colTotals.map((v, i) => (
                <td key={i} className="px-4 py-2 text-right font-semibold text-slate-800">
                  {fmt(v)}
                </td>
              ))}
              <td className="px-6 py-2 text-right font-bold text-slate-900">{fmt(grandTotal)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
