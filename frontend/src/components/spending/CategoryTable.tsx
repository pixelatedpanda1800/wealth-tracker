import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { clsx } from 'clsx';
import type { CategorySpend } from './types';

interface Props {
  breakdown: CategorySpend[];
  total: number;
}

export const CategoryTable: React.FC<Props> = ({ breakdown, total }) => {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  if (breakdown.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-100 bg-white p-6 text-sm text-slate-400 shadow-sm">
        No spending to break down yet.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-6 py-4">
        <h3 className="font-semibold text-slate-800">Category breakdown</h3>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs tracking-wider text-slate-400 uppercase">
            <th className="px-6 py-2 font-medium">Category</th>
            <th className="px-6 py-2 text-right font-medium">Amount</th>
            <th className="px-6 py-2 text-right font-medium">% of total</th>
            <th className="px-6 py-2 text-right font-medium"># txns</th>
          </tr>
        </thead>
        <tbody>
          {breakdown.map((row) => {
            const isExpanded = !!expanded[row.categoryId];
            const hasChildren = row.children.length > 0;
            const pct = total === 0 ? 0 : (row.amount / total) * 100;
            return (
              <React.Fragment key={row.categoryId}>
                <tr
                  className={clsx(
                    'border-t border-slate-100',
                    hasChildren && 'cursor-pointer hover:bg-slate-50',
                  )}
                  onClick={() =>
                    hasChildren &&
                    setExpanded((prev) => ({ ...prev, [row.categoryId]: !prev[row.categoryId] }))
                  }
                >
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-2">
                      {hasChildren ? (
                        isExpanded ? (
                          <ChevronDown size={16} className="text-slate-400" />
                        ) : (
                          <ChevronRight size={16} className="text-slate-400" />
                        )
                      ) : (
                        <span className="w-4" />
                      )}
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: row.color }}
                      />
                      <span className="font-medium text-slate-700">{row.categoryName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-3 text-right font-semibold text-slate-800">
                    £
                    {row.amount.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>
                  <td className="px-6 py-3 text-right text-slate-500">{pct.toFixed(1)}%</td>
                  <td className="px-6 py-3 text-right text-slate-500">{row.transactionCount}</td>
                </tr>
                {isExpanded &&
                  row.children.map((child) => {
                    const childPct = total === 0 ? 0 : (child.amount / total) * 100;
                    return (
                      <tr
                        key={child.categoryId}
                        className="border-t border-slate-50 bg-slate-50/40"
                      >
                        <td className="px-6 py-2 pl-14">
                          <div className="flex items-center gap-2">
                            <span
                              className="h-1.5 w-1.5 rounded-full"
                              style={{ backgroundColor: child.color }}
                            />
                            <span className="text-slate-600">{child.categoryName}</span>
                          </div>
                        </td>
                        <td className="px-6 py-2 text-right text-slate-700">
                          £
                          {child.amount.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                        <td className="px-6 py-2 text-right text-slate-400">
                          {childPct.toFixed(1)}%
                        </td>
                        <td className="px-6 py-2 text-right text-slate-400">
                          {child.transactionCount}
                        </td>
                      </tr>
                    );
                  })}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
