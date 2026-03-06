import React, { useState, useEffect } from 'react';
import { Settings, Wallet, CreditCard, PiggyBank, Briefcase, Plus, Pencil, Trash2, ArrowRightLeft, AlertTriangle, Check } from 'lucide-react';
import { clsx } from 'clsx';
import {
    getAllocations, deleteAllocation, getIncomeTransfers, deleteIncomeTransfer,
    type Allocation, type AllocationCategory, type IncomeTransfer
} from '../../api';
import { ManageAccountsModal } from './ManageAccountsModal';
import { AllocationModal } from './AllocationModal';
import { IncomeTransferModal } from './IncomeTransferModal';
import { IncomeAllocationRow } from './IncomeAllocationRow';

interface BudgetAllocationTabProps {
    totalIncome: number;
}

export const BudgetAllocationTab: React.FC<BudgetAllocationTabProps> = ({ totalIncome }) => {
    const [allocations, setAllocations] = useState<Allocation[]>([]);
    const [incomeTransfers, setIncomeTransfers] = useState<IncomeTransfer[]>([]);

    // Modals
    const [isManageAccountsOpen, setIsManageAccountsOpen] = useState(false);
    const [isAllocationModalOpen, setIsAllocationModalOpen] = useState(false);
    const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);

    const [editingAllocation, setEditingAllocation] = useState<Allocation | null>(null);
    const [editingTransfer, setEditingTransfer] = useState<IncomeTransfer | null>(null);
    const [modalCategory, setModalCategory] = useState<AllocationCategory>('bills');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [allocData, transferData] = await Promise.all([
                getAllocations(),
                getIncomeTransfers()
            ]);
            setAllocations(allocData);
            setIncomeTransfers(transferData);
        } catch (error) {
            console.error('Failed to fetch budget data', error);
        }
    };

    const handleDeleteAllocation = async (id: string) => {
        if (!confirm('Are you sure you want to delete this allocation?')) return;
        try {
            await deleteAllocation(id);
            await fetchData();
        } catch (error) {
            console.error('Failed to delete allocation', error);
        }
    };

    const handleDeleteTransfer = async (id: string) => {
        if (!confirm('Are you sure you want to delete this transfer rule?')) return;
        try {
            await deleteIncomeTransfer(id);
            await fetchData();
        } catch (error) {
            console.error('Failed to delete transfer', error);
        }
    };

    const openAddAllocationModal = (category: AllocationCategory) => {
        setEditingAllocation(null);
        setModalCategory(category);
        setIsAllocationModalOpen(true);
    };

    const openEditAllocationModal = (allocation: Allocation) => {
        setEditingAllocation(allocation);
        setModalCategory(allocation.category);
        setIsAllocationModalOpen(true);
    };

    const openAddTransferModal = (category: AllocationCategory) => {
        setEditingTransfer(null);
        setModalCategory(category);
        setIsTransferModalOpen(true);
    };

    const openEditTransferModal = (transfer: IncomeTransfer) => {
        setEditingTransfer(transfer);
        setModalCategory(transfer.category);
        setIsTransferModalOpen(true);
    };

    // Calculations
    const totalTransferred = incomeTransfers.reduce((sum, t) => sum + Number(t.amount), 0);
    const remainingToTransfer = totalIncome - totalTransferred;
    const isOverTransferred = remainingToTransfer < 0;

    const billsAllocations = allocations.filter(a => a.category === 'bills');
    const spendingAllocations = allocations.filter(a => a.category === 'spending');
    const savingsAllocations = allocations.filter(a => a.category === 'savings');

    const totalBills = billsAllocations.reduce((sum, a) => sum + Number(a.amount), 0);
    const totalSpending = spendingAllocations.reduce((sum, a) => sum + Number(a.amount), 0);
    const totalSavings = savingsAllocations.reduce((sum, a) => sum + Number(a.amount), 0);

    const totalAllocated = totalBills + totalSpending + totalSavings;

    // Account Rollups
    const accountTotals = allocations.reduce((acc, curr) => {
        const accountName = curr.account?.name || 'Unknown Account';
        const accountType = curr.account?.type || 'bank';
        if (!acc[accountName]) {
            acc[accountName] = { amount: 0, type: accountType };
        }
        acc[accountName].amount += Number(curr.amount);
        return acc;
    }, {} as Record<string, { amount: number; type: string }>);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header Validation & Actions */}
            <div className="flex justify-between items-start">
                <div className={clsx(
                    "px-4 py-3 rounded-xl border flex items-center gap-3",
                    isOverTransferred
                        ? "bg-rose-50 border-rose-200 text-rose-700"
                        : "bg-emerald-50 border-emerald-200 text-emerald-700"
                )}>
                    {isOverTransferred ? <AlertTriangle size={24} /> : <Check size={24} />}
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wider opacity-80">
                            {isOverTransferred ? 'Over Allocated' : 'Remaining to Allocate'}
                        </p>
                        <p className="text-xl font-bold">
                            {isOverTransferred ? '-' : ''}£{Math.abs(remainingToTransfer).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </p>
                    </div>
                </div>

                <button
                    onClick={() => setIsManageAccountsOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg font-medium transition-colors shadow-sm"
                >
                    <Settings size={18} />
                    Manage Accounts
                </button>
            </div>

            {/* Scorecards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <ScoreCard
                    title="Bills Allocation"
                    amount={totalBills}
                    icon={<CreditCard className="text-rose-600" />}
                    colorClass="border-rose-100 bg-rose-50/30"
                />
                <ScoreCard
                    title="Spending Allocation"
                    amount={totalSpending}
                    icon={<Wallet className="text-indigo-600" />}
                    colorClass="border-indigo-100 bg-indigo-50/30"
                />
                <ScoreCard
                    title="Savings Allocation"
                    amount={totalSavings}
                    icon={<PiggyBank className="text-emerald-600" />}
                    colorClass="border-emerald-100 bg-emerald-50/30"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                {/* Left Column: Account Rollups */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                        <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
                            <ArrowRightLeft className="text-slate-500" size={20} />
                            <h3 className="font-bold text-slate-700">Account Spend Roll-up</h3>
                        </div>
                        <div className="p-4 space-y-4">
                            {Object.entries(accountTotals).length === 0 ? (
                                <p className="text-center text-slate-400 py-4 text-sm italic">No allocations yet.</p>
                            ) : (
                                Object.entries(accountTotals).sort((a, b) => b[1].amount - a[1].amount).map(([name, { amount, type }]) => (
                                    <div key={name} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-white rounded-lg text-slate-400 shadow-sm">
                                                {type === 'savings' ? <PiggyBank size={18} /> : <Briefcase size={18} />}
                                            </div>
                                            <span className="font-medium text-slate-700">{name}</span>
                                        </div>
                                        <span className="font-bold text-slate-900">
                                            £{amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                ))
                            )}
                            <div className="pt-4 mt-2 border-t border-slate-100 flex justify-between items-center">
                                <span className="text-sm font-medium text-slate-500">Total Account Spend</span>
                                <span className="text-lg font-bold text-slate-900">
                                    £{totalAllocated.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Allocation Sections */}
                <div className="lg:col-span-2 space-y-6">
                    <AllocationSection
                        title="Bills Allocation"
                        items={billsAllocations}
                        transfers={incomeTransfers.filter(t => t.category === 'bills')}
                        color="rose"
                        onAdd={() => openAddAllocationModal('bills')}
                        onEdit={openEditAllocationModal}
                        onDelete={handleDeleteAllocation}
                        onAddTransfer={() => openAddTransferModal('bills')}
                        onEditTransfer={openEditTransferModal}
                        onDeleteTransfer={handleDeleteTransfer}
                    />
                    <AllocationSection
                        title="Spending Allocation"
                        items={spendingAllocations}
                        transfers={incomeTransfers.filter(t => t.category === 'spending')}
                        color="indigo"
                        onAdd={() => openAddAllocationModal('spending')}
                        onEdit={openEditAllocationModal}
                        onDelete={handleDeleteAllocation}
                        onAddTransfer={() => openAddTransferModal('spending')}
                        onEditTransfer={openEditTransferModal}
                        onDeleteTransfer={handleDeleteTransfer}
                    />
                    <AllocationSection
                        title="Savings Allocation"
                        items={savingsAllocations}
                        transfers={incomeTransfers.filter(t => t.category === 'savings')}
                        color="emerald"
                        onAdd={() => openAddAllocationModal('savings')}
                        onEdit={openEditAllocationModal}
                        onDelete={handleDeleteAllocation}
                        onAddTransfer={() => openAddTransferModal('savings')}
                        onEditTransfer={openEditTransferModal}
                        onDeleteTransfer={handleDeleteTransfer}
                    />
                </div>
            </div>

            {/* Modals */}
            <ManageAccountsModal
                isOpen={isManageAccountsOpen}
                onClose={() => setIsManageAccountsOpen(false)}
                onAccountsChanged={fetchData}
            />

            <AllocationModal
                isOpen={isAllocationModalOpen}
                onClose={() => setIsAllocationModalOpen(false)}
                onAllocationsChanged={fetchData}
                initialCategory={modalCategory}
                editingAllocation={editingAllocation}
            />

            <IncomeTransferModal
                isOpen={isTransferModalOpen}
                onClose={() => setIsTransferModalOpen(false)}
                onTransfersChanged={fetchData}
                initialCategory={modalCategory}
                editingTransfer={editingTransfer}
            />
        </div>
    );
};

// Sub-components

const ScoreCard: React.FC<{ title: string; amount: number; icon: React.ReactNode; colorClass: string }> = ({ title, amount, icon, colorClass }) => (
    <div className={clsx("p-6 rounded-2xl border flex items-center justify-between", colorClass)}>
        <div>
            <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
            <h3 className="text-2xl font-bold text-slate-900">
                £{amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </h3>
        </div>
        <div className="p-3 bg-white rounded-xl shadow-sm">
            {icon}
        </div>
    </div>
);

interface AllocationSectionProps {
    title: string;
    items: Allocation[];
    transfers: IncomeTransfer[];
    color: 'rose' | 'indigo' | 'emerald';
    onAdd: () => void;
    onEdit: (item: Allocation) => void;
    onDelete: (id: string) => void;
    onAddTransfer: () => void;
    onEditTransfer: (item: IncomeTransfer) => void;
    onDeleteTransfer: (id: string) => void;
}

const AllocationSection: React.FC<AllocationSectionProps> = ({
    title, items, transfers, color, onAdd, onEdit, onDelete, onAddTransfer, onEditTransfer, onDeleteTransfer
}) => {
    const colorClasses = {
        rose: { header: 'bg-rose-50 text-rose-700', badge: 'bg-rose-100 text-rose-700', border: 'border-rose-200' },
        indigo: { header: 'bg-indigo-50 text-indigo-700', badge: 'bg-indigo-100 text-indigo-700', border: 'border-indigo-200' },
        emerald: { header: 'bg-emerald-50 text-emerald-700', badge: 'bg-emerald-100 text-emerald-700', border: 'border-emerald-200' },
    }[color];

    return (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
            <div className={clsx("p-4 flex items-center justify-between", colorClasses.header)}>
                <div className="flex items-center gap-3">
                    <div className="flex flex-col">
                        <h3 className="font-bold">{title}</h3>
                        <span className="text-[10px] font-medium opacity-70 uppercase tracking-wider">Spend Items</span>
                    </div>
                    <span className={clsx("text-xs px-2 py-0.5 rounded-full font-semibold", colorClasses.badge)}>
                        {items.length} items
                    </span>
                </div>
                <button onClick={onAdd} className="p-1 hover:bg-white/50 rounded-md transition-colors" title="Add Spend Item">
                    <Plus size={20} />
                </button>
            </div>

            <div className="p-4 border-b border-slate-50 bg-slate-50/30">
                <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Allocation Rules</h4>
                    <button
                        onClick={onAddTransfer}
                        className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 uppercase tracking-wider flex items-center gap-1 bg-indigo-50 px-2 py-1 rounded transition-colors"
                    >
                        <Plus size={10} strokeWidth={3} /> Add Rule
                    </button>
                </div>
                {transfers.length === 0 ? (
                    <p className="text-center text-slate-400 py-3 text-xs italic">No allocation rules set.</p>
                ) : (
                    transfers.map(transfer => (
                        <IncomeAllocationRow
                            key={transfer.id}
                            transfer={transfer}
                            onEdit={onEditTransfer}
                            onDelete={onDeleteTransfer}
                        />
                    ))
                )}
            </div>

            <div className="p-2 space-y-2">
                {items.length === 0 ? (
                    <p className="text-center text-slate-400 py-4 text-sm italic">No spend items.</p>
                ) : (
                    items.map(item => (
                        <div key={item.id} className="group flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg border border-transparent hover:border-slate-100 transition-all">
                            <div>
                                <p className="font-medium text-slate-900 text-sm">{item.description}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded font-medium">
                                        {item.account?.name || 'Unknown'}
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="font-bold text-slate-900">
                                    £{Number(item.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </span>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => onEdit(item)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md">
                                        <Pencil size={14} />
                                    </button>
                                    <button onClick={() => onDelete(item.id)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md">
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <button
                onClick={onAdd}
                className="w-full py-3 text-xs font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-50 border-t border-slate-100 transition-colors flex items-center justify-center gap-2 uppercase tracking-wide"
            >
                <Plus size={14} /> Add {title.split(' ')[0]} Item
            </button>
        </div>
    );
};
