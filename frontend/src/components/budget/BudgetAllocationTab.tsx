import React, { useState, useEffect } from 'react';
import { Settings, Wallet, PiggyBank, Briefcase, Plus, Pencil, Trash2, AlertTriangle, Check, Landmark, ShoppingBag, Loader2, AlertCircle, GripVertical } from 'lucide-react';
import { clsx } from 'clsx';
import {
    DndContext,
    closestCenter,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
} from '@dnd-kit/core';
import {
    SortableContext,
    useSortable,
    arrayMove,
    rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
    deleteAllocation,
    reorderAllocations,
    type Allocation, type Account
} from '../../api';
import { ManageAccountsModal } from './ManageAccountsModal';
import { AllocationModal } from './AllocationModal';
import { useAllocations, useAccounts, useQueryClient, QueryKeys } from '../../hooks/queries';

interface BudgetAllocationTabProps {
    remainingToSpend: number;
}

export const BudgetAllocationTab: React.FC<BudgetAllocationTabProps> = ({ remainingToSpend }) => {
    const queryClient = useQueryClient();
    const { data: allocations = [], isLoading: allocLoading, error: allocError } = useAllocations();
    const { data: accounts = [], isLoading: accLoading, error: accError } = useAccounts();

    const loading = allocLoading || accLoading;
    const error = allocError || accError
        ? 'Failed to load allocation data. Please ensure the backend is running.'
        : null;

    const [localAllocations, setLocalAllocations] = useState<Allocation[]>([]);

    useEffect(() => {
        setLocalAllocations(allocations);
    }, [allocations]);

    // Modals
    const [isManageAccountsOpen, setIsManageAccountsOpen] = useState(false);
    const [isAllocationModalOpen, setIsAllocationModalOpen] = useState(false);

    const [editingAllocation, setEditingAllocation] = useState<Allocation | null>(null);
    const [modalAccountId, setModalAccountId] = useState<string>('');

    const invalidate = () => {
        queryClient.invalidateQueries({ queryKey: QueryKeys.allocations });
        queryClient.invalidateQueries({ queryKey: QueryKeys.accounts });
    };

    const handleDeleteAllocation = async (id: string) => {
        try {
            await deleteAllocation(id);
            queryClient.invalidateQueries({ queryKey: QueryKeys.allocations });
        } catch (error) {
            console.error('Failed to delete allocation', error);
        }
    };

    const handleReorderPots = async (accountId: string, orderedIds: string[]) => {
        const reordered = [
            ...localAllocations.filter(a => a.accountId !== accountId),
            ...orderedIds.map(id => localAllocations.find(a => a.id === id)!),
        ];
        setLocalAllocations(reordered);
        try {
            await reorderAllocations(orderedIds);
            queryClient.invalidateQueries({ queryKey: QueryKeys.allocations });
        } catch (err) {
            console.error('Failed to reorder allocations', err);
            setLocalAllocations(allocations);
        }
    };

    const openAddAllocationModal = (accountId: string) => {
        setEditingAllocation(null);
        setModalAccountId(accountId);
        setIsAllocationModalOpen(true);
    };

    const openEditAllocationModal = (allocation: Allocation) => {
        setEditingAllocation(allocation);
        setModalAccountId(allocation.accountId);
        setIsAllocationModalOpen(true);
    };

    // Calculations
    const totalAllocated = localAllocations.reduce((sum, a) => sum + Number(a.amount), 0);
    const remainingToAllocate = remainingToSpend - totalAllocated;
    const isOverAllocated = remainingToAllocate < 0;

    // Grouping
    const groupedAccounts = {
        'investment': accounts.filter(a => a.category === 'investment'),
        'spending': accounts.filter(a => a.category === 'spending'),
        'saving': accounts.filter(a => a.category === 'saving'),
        'outgoings': accounts.filter(a => a.category === 'outgoings'),
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {error && (
                <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl flex items-center gap-3 text-rose-700 transition-all">
                    <AlertCircle size={24} className="flex-shrink-0" />
                    <p className="font-medium">{error}</p>
                </div>
            )}
            {isOverAllocated && (
                <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl flex items-center gap-3 text-rose-700 transition-all shadow-sm">
                    <AlertTriangle size={24} className="flex-shrink-0" />
                    <p className="font-medium">Warning: Amount allocated to spending exceeds available remaining budget!</p>
                </div>
            )}

            {/* Header Validation & Actions */}
            <div className="flex justify-between items-start">
                <div className={clsx(
                    "px-4 py-3 rounded-xl border flex items-center gap-3",
                    isOverAllocated
                        ? "bg-rose-50 border-rose-200 text-rose-700"
                        : "bg-emerald-50 border-emerald-200 text-emerald-700"
                )}>
                    {isOverAllocated ? <AlertTriangle size={24} /> : <Check size={24} />}
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wider opacity-80">
                            {isOverAllocated ? 'Over Allocated' : 'Remaining to Allocate (Spending)'}
                        </p>
                        <p className="text-xl font-bold">
                            {isOverAllocated ? '-' : ''}£{Math.abs(remainingToAllocate).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </p>
                    </div>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={() => setIsManageAccountsOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg font-medium transition-colors shadow-sm"
                    >
                        <Settings size={18} />
                        Manage Accounts
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center items-center py-16">
                    <Loader2 className="animate-spin text-indigo-600" size={32} />
                </div>
            ) : (
                <div className="space-y-6">
                <AccountCategorySection
                    title="Investment Accounts"
                    accounts={groupedAccounts['investment']}
                    allocations={localAllocations}
                    color="emerald"
                    icon={<Briefcase className="text-emerald-600" size={20} />}
                    onAddPot={openAddAllocationModal}
                    onEditPot={openEditAllocationModal}
                    onDeletePot={handleDeleteAllocation}
                    onReorderPots={handleReorderPots}
                />

                <AccountCategorySection
                    title="Spending Accounts"
                    accounts={groupedAccounts['spending']}
                    allocations={localAllocations}
                    color="indigo"
                    icon={<Wallet className="text-indigo-600" size={20} />}
                    onAddPot={openAddAllocationModal}
                    onEditPot={openEditAllocationModal}
                    onDeletePot={handleDeleteAllocation}
                    onReorderPots={handleReorderPots}
                />

                <AccountCategorySection
                    title="Saving Accounts"
                    accounts={groupedAccounts['saving']}
                    allocations={localAllocations}
                    color="blue"
                    icon={<PiggyBank className="text-blue-600" size={20} />}
                    onAddPot={openAddAllocationModal}
                    onEditPot={openEditAllocationModal}
                    onDeletePot={handleDeleteAllocation}
                    onReorderPots={handleReorderPots}
                />

                <AccountCategorySection
                    title="Outgoings Accounts"
                    accounts={groupedAccounts['outgoings']}
                    allocations={localAllocations}
                    color="rose"
                    icon={<ShoppingBag className="text-rose-600" size={20} />}
                    onAddPot={openAddAllocationModal}
                    onEditPot={openEditAllocationModal}
                    onDeletePot={handleDeleteAllocation}
                    onReorderPots={handleReorderPots}
                />
                </div>
            )}

            {/* Modals */}
            <ManageAccountsModal
                isOpen={isManageAccountsOpen}
                onClose={() => setIsManageAccountsOpen(false)}
                onAccountsChanged={invalidate}
            />

            <AllocationModal
                isOpen={isAllocationModalOpen}
                onClose={() => setIsAllocationModalOpen(false)}
                onAllocationsChanged={invalidate}
                initialAccountId={modalAccountId}
                editingAllocation={editingAllocation}
            />
        </div>
    );
};

// Sub-components

interface AccountCategorySectionProps {
    title: string;
    accounts: Account[];
    allocations: Allocation[];
    color: 'rose' | 'amber' | 'blue' | 'emerald' | 'indigo';
    icon: React.ReactNode;
    onAddPot: (accountId: string) => void;
    onEditPot: (pot: Allocation) => void;
    onDeletePot: (potId: string) => void;
    onReorderPots: (accountId: string, orderedIds: string[]) => void;
}

const AccountCategorySection: React.FC<AccountCategorySectionProps> = ({
    title, accounts, allocations, color, icon, onAddPot, onEditPot, onDeletePot, onReorderPots
}) => {
    if (accounts.length === 0) return null;

    const colorClasses = {
        rose: { header: 'bg-rose-50 border-rose-100', text: 'text-rose-700' },
        amber: { header: 'bg-amber-50 border-amber-100', text: 'text-amber-700' },
        blue: { header: 'bg-blue-50 border-blue-100', text: 'text-blue-700' },
        emerald: { header: 'bg-emerald-50 border-emerald-100', text: 'text-emerald-700' },
        indigo: { header: 'bg-indigo-50 border-indigo-100', text: 'text-indigo-700' },
    }[color];

    const totalAllocated = allocations.filter(pot => accounts.some(acc => acc.id === pot.accountId)).reduce((sum, p) => sum + Number(p.amount), 0);

    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className={clsx("p-4 border-b flex items-center justify-between", colorClasses.header)}>
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-xl shadow-sm">
                        {icon}
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800">{title}</h3>
                        <p className="text-xs text-slate-500 font-medium">{accounts.length} Accounts</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-0.5">Total Income Allocated</p>
                    <p className={clsx("font-bold text-lg", colorClasses.text)}>
                        £{totalAllocated.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </p>
                </div>
            </div>

            <div className="divide-y divide-slate-100 bg-slate-50/30">
                {accounts.map(account => {
                    const accountPots = allocations.filter(a => a.accountId === account.id);
                    return (
                        <AccountPotsGrid
                            key={account.id}
                            account={account}
                            pots={accountPots}
                            onAddPot={onAddPot}
                            onEditPot={onEditPot}
                            onDeletePot={onDeletePot}
                            onReorderPots={onReorderPots}
                        />
                    );
                })}
            </div>
        </div>
    );
};

interface AccountPotsGridProps {
    account: Account;
    pots: Allocation[];
    onAddPot: (accountId: string) => void;
    onEditPot: (pot: Allocation) => void;
    onDeletePot: (potId: string) => void;
    onReorderPots: (accountId: string, orderedIds: string[]) => void;
}

const AccountPotsGrid: React.FC<AccountPotsGridProps> = ({
    account, pots, onAddPot, onEditPot, onDeletePot, onReorderPots
}) => {
    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;
        const oldIndex = pots.findIndex(p => p.id === active.id);
        const newIndex = pots.findIndex(p => p.id === over.id);
        const reordered = arrayMove(pots, oldIndex, newIndex);
        onReorderPots(account.id, reordered.map(p => p.id));
    };

    return (
        <div className="p-5">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <h4 className="font-bold text-slate-800 flex items-center gap-2">
                        <Landmark size={18} className="text-slate-400" />
                        {account.name}
                    </h4>
                </div>
                <button
                    onClick={() => onAddPot(account.id)}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-700 uppercase tracking-wider flex items-center gap-1 bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors border border-indigo-100 hover:border-indigo-200"
                >
                    <Plus size={12} strokeWidth={3} /> Add Pot
                </button>
            </div>

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={pots.map(p => p.id)} strategy={rectSortingStrategy}>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                        {pots.map(pot => (
                            <SortablePotCard
                                key={pot.id}
                                pot={pot}
                                onEdit={onEditPot}
                                onDelete={onDeletePot}
                            />
                        ))}
                    </div>
                </SortableContext>
            </DndContext>
        </div>
    );
};

interface SortablePotCardProps {
    pot: Allocation;
    onEdit: (pot: Allocation) => void;
    onDelete: (id: string) => void;
}

const SortablePotCard: React.FC<SortablePotCardProps> = ({ pot, onEdit, onDelete }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: pot.id });

    const style: React.CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 10 : undefined,
        position: 'relative',
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative group hover:border-indigo-200 transition-colors"
        >
            <div className="absolute top-0 left-0 w-1 h-full bg-indigo-400 rounded-l-xl"></div>
            <div className="flex justify-between items-start mb-1">
                <p className="text-sm font-medium text-slate-700 break-words pr-6">{pot.description}</p>
                <div className="flex gap-1 absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        {...attributes}
                        {...listeners}
                        className="p-1 text-slate-300 hover:text-slate-500 hover:bg-slate-50 rounded cursor-grab active:cursor-grabbing"
                        tabIndex={-1}
                    >
                        <GripVertical size={12} />
                    </button>
                    <button onClick={() => onEdit(pot)} className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded">
                        <Pencil size={12} />
                    </button>
                    <button onClick={() => onDelete(pot.id)} className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded">
                        <Trash2 size={12} />
                    </button>
                </div>
            </div>
            <p className="text-lg font-bold text-slate-900 flex items-center gap-2">
                £{Number(pot.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
        </div>
    );
};
