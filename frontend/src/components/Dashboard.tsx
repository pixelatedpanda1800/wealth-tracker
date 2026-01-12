import React, { useState, useEffect } from 'react';
import { WealthChart } from './WealthChart';
import { ProjectionChart } from './ProjectionChart';
import { Wallet, TrendingUp, Landmark, Plus, Settings } from 'lucide-react';
import { AddEntryModal } from './AddEntryModal';
import { WealthSourcesModal } from './WealthSourcesModal';
import { HistoryGrid } from './HistoryGrid';
import { processWealthData, type WealthEntry, type ViewMode } from '../utils/dataUtils';
import { getWealthSnapshots, getWealthSources, type WealthSource } from '../api';
import { clsx } from 'clsx';

export const Dashboard: React.FC = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSourcesModalOpen, setIsSourcesModalOpen] = useState(false);
    const [data, setData] = useState<WealthEntry[]>([]);
    const [rawSnapshots, setRawSnapshots] = useState<WealthEntry[]>([]);
    const [sources, setSources] = useState<WealthSource[]>([]);
    const [viewMode, setViewMode] = useState<ViewMode>('monthly');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (rawSnapshots.length > 0 && sources.length > 0) {
            const processed = processWealthData(rawSnapshots, sources, viewMode);
            setData(processed);
        }
    }, [rawSnapshots, sources, viewMode]);

    const fetchData = async () => {
        try {
            const [snapshots, sourcesData] = await Promise.all([
                getWealthSnapshots(),
                getWealthSources()
            ]);
            setRawSnapshots(snapshots);
            setSources(sourcesData);
            setError(null);
        } catch (error) {
            console.error('Failed to fetch wealth data', error);
            setError('Failed to connect to backend. Please ensure the server is running.');
        }
    };

    const handleAddEntry = async () => {
        await fetchData();
    };

    const handleSourcesChanged = () => {
        fetchData();
    };

    // Get the latest entry with actual data (not estimated and not all zeros)
    const latest = data.length > 0
        ? (data.slice().reverse().find(d => !d.isEstimate && (d.total ?? 0) > 0)
            || data[data.length - 1])
        : { cash: 0, investment: 0, pension: 0, total: 0 };

    return (
        <div className="min-h-screen bg-slate-50 p-6 md:p-12">
            <div className="max-w-7xl mx-auto space-y-8">
                <header className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">Wealth Tracker</h1>
                        <p className="text-slate-500">Track your financial journey over time.</p>
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
                        trend="+4.8%"
                        icon={<TrendingUp className="text-emerald-600" />}
                    />
                    <StatCard
                        title="Cash"
                        value={`£${(latest.cash || 0).toLocaleString()}`}
                        trend="+10.2%"
                        icon={<Wallet className="text-emerald-600" />}
                    />
                    <StatCard
                        title="Investments"
                        value={`£${(latest.investment || 0).toLocaleString()}`}
                        trend="+3.5%"
                        icon={<Landmark className="text-amber-600" />}
                    />
                    <StatCard
                        title="Pension"
                        value={`£${(latest.pension || 0).toLocaleString()}`}
                        trend="+4.4%"
                        icon={<Landmark className="text-indigo-600" />}
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
            </div>

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
}

const StatCard: React.FC<StatCardProps> = ({ title, value, trend, icon }) => {
    const isPositive = trend.startsWith('+');
    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-start justify-between">
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
            <div className="p-3 bg-slate-50 rounded-xl">
                {icon}
            </div>
        </div>
    );
};
