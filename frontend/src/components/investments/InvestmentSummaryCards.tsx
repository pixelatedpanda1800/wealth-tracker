import React from 'react';
import { TrendingUp, TrendingDown, Wallet, BarChart2, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { clsx } from 'clsx';
import type { PortfolioSummary } from '../../utils/investmentUtils';

interface InvestmentSummaryCardsProps {
    summary: PortfolioSummary;
}

export const InvestmentSummaryCards: React.FC<InvestmentSummaryCardsProps> = ({ summary }) => {
    const { totalValue, totalGainLoss, monthlyChange, totalReturnPct } = summary;

    const fmt = (n: number) => `£${Math.abs(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const fmtPct = (n: number) => `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`;

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
                title="Total Value"
                value={fmt(totalValue)}
                icon={<Wallet size={20} />}
                color="indigo"
            />
            <StatCard
                title="Total Gain / Loss"
                value={totalGainLoss !== null ? (totalGainLoss >= 0 ? '+' : '-') + fmt(totalGainLoss) : '—'}
                trend={totalGainLoss !== null ? (totalGainLoss >= 0 ? 'up' : 'down') : undefined}
                subtitle={totalGainLoss !== null ? 'vs cost basis' : 'No cost basis data'}
                icon={<BarChart2 size={20} />}
                color={totalGainLoss !== null ? (totalGainLoss >= 0 ? 'emerald' : 'rose') : 'slate'}
            />
            <StatCard
                title="Monthly Change"
                value={(monthlyChange >= 0 ? '+' : '-') + fmt(monthlyChange)}
                trend={monthlyChange >= 0 ? 'up' : 'down'}
                subtitle="vs previous month"
                icon={monthlyChange >= 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                color={monthlyChange >= 0 ? 'emerald' : 'rose'}
            />
            <StatCard
                title="Overall Return"
                value={totalReturnPct !== null ? fmtPct(totalReturnPct) : '—'}
                trend={totalReturnPct !== null ? (totalReturnPct >= 0 ? 'up' : 'down') : undefined}
                subtitle={totalReturnPct !== null ? 'total return on invested' : 'Add cost basis to track'}
                icon={<TrendingUp size={20} />}
                color={totalReturnPct !== null ? (totalReturnPct >= 0 ? 'emerald' : 'rose') : 'slate'}
            />
        </div>
    );
};

interface StatCardProps {
    title: string;
    value: string;
    subtitle?: string;
    trend?: 'up' | 'down';
    icon: React.ReactNode;
    color: 'indigo' | 'emerald' | 'rose' | 'slate';
}

const colorMap = {
    indigo: {
        bg: 'bg-indigo-50',
        icon: 'text-indigo-600',
        value: 'text-indigo-700',
    },
    emerald: {
        bg: 'bg-emerald-50',
        icon: 'text-emerald-600',
        value: 'text-emerald-700',
    },
    rose: {
        bg: 'bg-rose-50',
        icon: 'text-rose-600',
        value: 'text-rose-700',
    },
    slate: {
        bg: 'bg-slate-50',
        icon: 'text-slate-400',
        value: 'text-slate-500',
    },
};

const StatCard: React.FC<StatCardProps> = ({ title, value, subtitle, trend, icon, color }) => {
    const c = colorMap[color];
    return (
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
            <div className="flex items-start justify-between mb-3">
                <div className={clsx('p-2 rounded-xl', c.bg)}>
                    <span className={c.icon}>{icon}</span>
                </div>
                {trend && (
                    <span className={clsx('flex items-center gap-0.5 text-xs font-semibold', trend === 'up' ? 'text-emerald-600' : 'text-rose-600')}>
                        {trend === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                    </span>
                )}
            </div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">{title}</p>
            <p className={clsx('text-xl font-bold', c.value)}>{value}</p>
            {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
    );
};
