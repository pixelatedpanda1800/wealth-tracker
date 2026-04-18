import React, { useState } from 'react';
import { PlusCircle, Settings, Home, AlertCircle, TrendingDown } from 'lucide-react';
import {
    useLiabilities,
    useLiabilitySnapshots,
    useLiabilityOverpayments,
    useProperties,
    useQueryClient,
    QueryKeys,
} from '../hooks/queries';
import { ManagePropertiesModal } from './liabilities/ManagePropertiesModal';
import { ManageLiabilitiesModal } from './liabilities/ManageLiabilitiesModal';
import { AddLiabilityWizard } from './liabilities/AddLiabilityWizard';
import { AddSnapshotModal } from './liabilities/AddSnapshotModal';
import { OverpaymentPlanModal } from './liabilities/OverpaymentPlanModal';
import { type Liability, type LiabilityOverpayment, latestSnapshot, totalOutstanding, LIABILITY_TYPE_LABELS, isSecured } from './liabilities/types';

const fmt = (n: number) =>
    '£' + n.toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

export const LiabilitiesPage: React.FC = () => {
    const queryClient = useQueryClient();
    const { data: liabilities = [], isLoading: liabilitiesLoading, isError: liabilitiesError } = useLiabilities();
    const { data: snapshots = [], isLoading: snapshotsLoading } = useLiabilitySnapshots();
    const { data: overpayments = [] } = useLiabilityOverpayments();
    const { data: properties = [] } = useProperties();

    const [showPropertiesModal, setShowPropertiesModal] = useState(false);
    const [showManageModal, setShowManageModal] = useState(false);
    const [showAddWizard, setShowAddWizard] = useState(false);
    const [showSnapshotModal, setShowSnapshotModal] = useState(false);
    const [overpaymentTarget, setOverpaymentTarget] = useState<Liability | null>(null);
    const [showArchived, setShowArchived] = useState(false);

    const isLoading = liabilitiesLoading || snapshotsLoading;
    const isError = liabilitiesError;

    const active = liabilities.filter(l => !l.archivedAt);
    const archived = liabilities.filter(l => !!l.archivedAt);
    const hasData = active.length > 0;
    const hasSnapshots = snapshots.length > 0;

    const totalDebt = totalOutstanding(liabilities, snapshots);
    const securedDebt = active.filter(l => isSecured(l.type)).reduce((s, l) => {
        const snap = latestSnapshot(snapshots, l.id);
        return s + (snap ? Number(snap.balance) : 0);
    }, 0);
    const unsecuredDebt = totalDebt - securedDebt;

    const monthlyRepayments = active.reduce((s, l) => s + (l.monthlyPayment ? Number(l.monthlyPayment) : 0), 0);

    const invalidate = () => {
        queryClient.invalidateQueries({ queryKey: QueryKeys.liabilities });
        queryClient.invalidateQueries({ queryKey: QueryKeys.liabilitySnapshots });
        queryClient.invalidateQueries({ queryKey: QueryKeys.liabilityOverpayments });
        queryClient.invalidateQueries({ queryKey: QueryKeys.properties });
    };

    const liabilityOverpaymentsFor = (liabilityId: string): LiabilityOverpayment[] =>
        overpayments.filter(op => op.liabilityId === liabilityId);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Liabilities</h2>
                    <p className="text-sm text-slate-500 mt-0.5">
                        {active.length} active debt{active.length !== 1 ? 's' : ''}
                        {properties.length > 0 && ` · ${properties.length} propert${properties.length !== 1 ? 'ies' : 'y'}`}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowPropertiesModal(true)}
                        className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors text-sm font-medium"
                    >
                        <Home size={15} />
                        Properties
                    </button>
                    <button
                        onClick={() => setShowManageModal(true)}
                        className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors text-sm font-medium"
                    >
                        <Settings size={15} />
                        Manage
                    </button>
                    <button
                        onClick={() => setShowSnapshotModal(true)}
                        disabled={!hasData}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors text-sm font-medium disabled:opacity-40"
                    >
                        Update Balances
                    </button>
                    <button
                        onClick={() => setShowAddWizard(true)}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200 text-sm"
                    >
                        <PlusCircle size={15} />
                        Add Liability
                    </button>
                </div>
            </div>

            {/* Error */}
            {isError && (
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-center gap-3 text-rose-700">
                    <AlertCircle size={20} className="flex-shrink-0" />
                    <p className="text-sm font-medium">Failed to load liabilities. Check the backend is running.</p>
                </div>
            )}

            {/* Loading */}
            {isLoading && (
                <div className="bg-white p-12 rounded-2xl border border-slate-100 flex items-center justify-center gap-3">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600" />
                    <span className="text-sm text-slate-400">Loading liabilities…</span>
                </div>
            )}

            {/* Empty state */}
            {!isLoading && !isError && !hasData && (
                <div className="bg-white p-12 rounded-2xl border border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 gap-4">
                    <TrendingDown size={40} className="text-slate-300" />
                    <div className="text-center">
                        <p className="text-lg font-medium text-slate-500">No liabilities tracked yet</p>
                        <p className="text-sm mt-1">Add your first liability to see your true net position.</p>
                    </div>
                    <button
                        onClick={() => setShowAddWizard(true)}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors shadow-sm text-sm"
                    >
                        <PlusCircle size={16} />
                        Add First Liability
                    </button>
                </div>
            )}

            {/* Main content */}
            {!isLoading && !isError && hasData && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">

                    {/* Summary cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                            { label: 'Total Outstanding', value: fmt(totalDebt), sub: `${active.length} debts`, accent: true },
                            { label: 'Secured Debt', value: fmt(securedDebt), sub: 'Mortgage & car' },
                            { label: 'Unsecured Debt', value: fmt(unsecuredDebt), sub: 'Cards, loans & other' },
                            { label: 'Monthly Repayments', value: fmt(monthlyRepayments), sub: 'Scheduled payments' },
                        ].map(card => (
                            <div key={card.label} className={`bg-white rounded-2xl p-5 border ${card.accent ? 'border-rose-100' : 'border-slate-100'} shadow-sm`}>
                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{card.label}</p>
                                <p className={`text-2xl font-bold mt-2 ${card.accent ? 'text-rose-600' : 'text-slate-800'}`}>{card.value}</p>
                                <p className="text-xs text-slate-400 mt-1">{card.sub}</p>
                            </div>
                        ))}
                    </div>

                    {/* Liability list */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Active Liabilities</h3>
                        {active.map(l => {
                            const snap = latestSnapshot(snapshots, l.id);
                            const balance = snap ? Number(snap.balance) : null;
                            const hasOverpaymentPlan = l.recurringOverpayment != null ||
                                overpayments.some(op => op.liabilityId === l.id);

                            return (
                                <div key={l.id} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-4 min-w-0">
                                        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: l.color ?? '#64748B' }} />
                                        <div className="min-w-0">
                                            <p className="font-semibold text-slate-800 truncate">{l.name}</p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-xs text-slate-400 bg-slate-100 rounded-md px-2 py-0.5">
                                                    {LIABILITY_TYPE_LABELS[l.type as keyof typeof LIABILITY_TYPE_LABELS]}
                                                </span>
                                                {l.interestRate != null && (
                                                    <span className="text-xs text-slate-400">{Number(l.interestRate).toFixed(2)}% APR</span>
                                                )}
                                                {hasOverpaymentPlan && (
                                                    <span className="text-xs text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-md px-2 py-0.5">Overpayment plan</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 flex-shrink-0">
                                        {balance != null ? (
                                            <p className="text-xl font-bold text-slate-800">{fmt(balance)}</p>
                                        ) : (
                                            <p className="text-sm text-slate-400 italic">No data</p>
                                        )}
                                        <button
                                            onClick={() => setOverpaymentTarget(l)}
                                            className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors"
                                        >
                                            Plan
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Archived toggle */}
                    {archived.length > 0 && (
                        <button onClick={() => setShowArchived(v => !v)} className="text-xs font-medium text-slate-400 hover:text-slate-600 transition-colors">
                            {showArchived ? '▾' : '▸'} Archived / paid off ({archived.length})
                        </button>
                    )}
                    {showArchived && (
                        <div className="space-y-2">
                            {archived.map(l => (
                                <div key={l.id} className="bg-slate-50 rounded-xl border border-slate-100 px-5 py-3 flex items-center gap-3 opacity-60">
                                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: l.color ?? '#64748B' }} />
                                    <span className="text-sm text-slate-500 font-medium">{l.name}</span>
                                    <span className="text-xs text-slate-400">{LIABILITY_TYPE_LABELS[l.type as keyof typeof LIABILITY_TYPE_LABELS]}</span>
                                    <span className="ml-auto text-xs text-emerald-600 font-medium">Paid off</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* No snapshot hint */}
                    {!hasSnapshots && (
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
                            <AlertCircle size={18} className="text-amber-600 flex-shrink-0" />
                            <p className="text-sm text-amber-700">No balances recorded yet. Click <strong>Update Balances</strong> to enter your first month's data.</p>
                        </div>
                    )}
                </div>
            )}

            {/* Modals */}
            <ManagePropertiesModal
                isOpen={showPropertiesModal}
                onClose={() => setShowPropertiesModal(false)}
                onChanged={invalidate}
                properties={properties}
            />
            <ManageLiabilitiesModal
                isOpen={showManageModal}
                onClose={() => setShowManageModal(false)}
                onChanged={invalidate}
                liabilities={liabilities}
                properties={properties}
            />
            <AddLiabilityWizard
                isOpen={showAddWizard}
                onClose={() => setShowAddWizard(false)}
                onSaved={invalidate}
                properties={properties}
            />
            <AddSnapshotModal
                isOpen={showSnapshotModal}
                onClose={() => setShowSnapshotModal(false)}
                onSubmit={invalidate}
                liabilities={liabilities}
                existingSnapshots={snapshots}
            />
            {overpaymentTarget && (
                <OverpaymentPlanModal
                    isOpen
                    onClose={() => setOverpaymentTarget(null)}
                    onSaved={() => { setOverpaymentTarget(null); invalidate(); }}
                    liability={overpaymentTarget}
                    existingOverpayments={liabilityOverpaymentsFor(overpaymentTarget.id)}
                />
            )}
        </div>
    );
};
