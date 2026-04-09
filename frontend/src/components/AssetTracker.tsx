import React, { useState, useMemo } from 'react';
import { WealthChart } from './WealthChart';
import { ProjectionChart } from './ProjectionChart';
import { Wallet, TrendingUp, Landmark, Plus, Settings, Gem } from 'lucide-react';
import { AddEntryModal } from './AddEntryModal';
import { WealthSourcesModal } from './WealthSourcesModal';
import { HistoryGrid } from './HistoryGrid';
import { processWealthData, type WealthEntry, type ViewMode } from '../utils/dataUtils';
import { clsx } from 'clsx';
import { useWealthSnapshots, useWealthSources, useQueryClient, QueryKeys } from '../hooks/queries';

export const AssetTracker: React.FC = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSourcesModalOpen, setIsSourcesModalOpen] = useState(false);
    const [viewMode, setViewMode] = useState<ViewMode>('monthly');
    const queryClient = useQueryClient();

    const { data: rawSnapshots = [], error: snapshotError } = useWealthSnapshots();
    const { data: sources = [], error: sourcesError } = useWealthSources();

    const error = snapshotError || sourcesError
        ? 'Failed to connect to backend. Please ensure the server is running.'
        : null;

    const data = useMemo(() => {
        if (rawSnapshots.length > 0 && sources.length > 0) {
            return processWealthData(rawSnapshots, sources, viewMode);
        }
        return [];
    }, [rawSnapshots, sources, viewMode]);

    const handleAddEntry = () => {
        queryClient.invalidateQueries({ queryKey: QueryKeys.wealthSnapshots });
    };

    const handleSourcesChanged = () => {
        queryClient.invalidateQueries({ queryKey: QueryKeys.wealthSources });
        queryClient.invalidateQueries({ queryKey: QueryKeys.wealthSnapshots });
    };

    // Get the latest entry with actual data (not estimated and not all zeros)
    const latestIndex = data.length > 0
        ? data.slice().reverse().findIndex(d => !d.isEstimate && (d.total ?? 0) > 0)
        : -1;

    const latest = latestIndex !== -1
        ? data[data.length - 1 - latestIndex]
        : { cash: 0, investment: 0, pension: 0, total: 0 } as WealthEntry;

    const previous = (latestIndex !== -1 && (data.length - 2 - latestIndex) >= 0)
        ? data[data.length - 2 - latestIndex]
        : null;

    const calculateTrend = (current: number, prev: number | null | undefined) => {
        if (prev === null || prev === undefined || prev === 0) return "0.0%";
        const change = ((current - prev) / prev) * 100;
        const sign = change >= 0 ? '+' : '';
        return `${sign}${change.toFixed(1)}%`;
    };

    return (
        <div className="space-y-8">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Asset Tracker</h1>
                    <p className="text-slate-500">Track your assets and net worth over time.</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors shadow-sm font-medium"
                    >
                        <Plus size={20} />
                        <span>Add/Update Entry</span>
                    </button>
                    <button
                        onClick={() => setIsSourcesModalOpen(true)}
                        className="flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg border border-slate-200 transition-colors shadow-sm font-medium"
                        title="Manage Sources"
                    >
                        <Settings size={20} />
                        <span>Manage Sources</span>
                    </button>
                </div>
            </header>

            {error && (
                <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl flex items-center gap-3 text-rose-700">
                    <TrendingUp className="rotate-180" size={20} />
                    <p className="font-medium">{error}</p>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Wealth"
                    value={`£${(latest.total || 0).toLocaleString()}`}
                    trend={calculateTrend(latest.total || 0, previous?.total)}
                    icon={<Gem className="text-indigo-600" />}
                    color="indigo"
                />
                <StatCard
                    title="Cash"
                    value={`£${(latest.cash || 0).toLocaleString()}`}
                    trend={calculateTrend(latest.cash || 0, previous?.cash)}
                    icon={<Wallet className="text-emerald-600" />}
                    color="emerald"
                />
                <StatCard
                    title="Investments"
                    value={`£${(latest.investment || 0).toLocaleString()}`}
                    trend={calculateTrend(latest.investment || 0, previous?.investment)}
                    icon={<TrendingUp className="text-amber-600" />}
                    color="amber"
                />
                <StatCard
                    title="Pension"
                    value={`£${(latest.pension || 0).toLocaleString()}`}
                    trend={calculateTrend(latest.pension || 0, previous?.pension)}
                    icon={<Landmark className="text-purple-600" />}
                    color="purple"
                />
            </div>

            <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <WealthChart
                    data={data}
                    sources={sources}
                    viewMode={viewMode}
                    onViewModeChange={setViewMode}
                />
            </section>

            <HistoryGrid data={data} sources={sources} />

            <ProjectionChart data={rawSnapshots} sources={sources} />

            <AddEntryModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleAddEntry}
                existingEntries={rawSnapshots}
            />

            <WealthSourcesModal
                isOpen={isSourcesModalOpen}
                onClose={() => setIsSourcesModalOpen(false)}
                onSourcesChanged={handleSourcesChanged}
            />
        </div>
    );
};

interface StatCardProps {
    title: string;
    value: string;
    trend: string;
    icon: React.ReactNode;
    color?: 'emerald' | 'amber' | 'purple' | 'indigo' | 'rose';
}

const StatCard: React.FC<StatCardProps> = ({ title, value, trend, icon, color }) => {
    const isPositive = trend.startsWith('+');

    const colorStyles = {
        emerald: "bg-emerald-50/50 border-emerald-100",
        amber: "bg-amber-50/50 border-amber-100",
        purple: "bg-purple-50/50 border-purple-100",
        indigo: "bg-indigo-50/50 border-indigo-100",
        rose: "bg-rose-50/50 border-rose-100",
    };

    const activeStyle = color ? colorStyles[color] : "bg-white border-slate-100";

    return (
        <div className={clsx(
            "p-6 rounded-2xl shadow-sm border flex items-start justify-between transition-all",
            activeStyle
        )}>
            <div className="space-y-1">
                <p className="text-sm font-medium text-slate-500">{title}</p>
                <h2 className="text-2xl font-bold text-slate-900">{value}</h2>
                <p className={clsx(
                    "text-xs font-semibold",
                    isPositive ? "text-emerald-600" : "text-rose-600"
                )}>
                    {trend} <span className="text-slate-400 font-normal">vs last month</span>
                </p>
            </div>
            <div className="p-3 bg-white shadow-sm rounded-xl">
                {icon}
            </div>
        </div>
    );
};
