import React, { useState } from 'react';
import { X, Pencil, Trash2, Archive, ArchiveRestore } from 'lucide-react';
import { clsx } from 'clsx';
import { archiveLiability, deleteLiability, updateLiability, type Liability } from '../../api';
import { type Property } from './types';
import { LIABILITY_TYPE_LABELS } from './types';
import { AddLiabilityWizard } from './AddLiabilityWizard';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onChanged: () => void;
    liabilities: Liability[];
    properties: Property[];
}

export const ManageLiabilitiesModal: React.FC<Props> = ({
    isOpen, onClose, onChanged, liabilities, properties,
}) => {
    const [editingLiability, setEditingLiability] = useState<Liability | null>(null);
    const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);
    const [showArchived, setShowArchived] = useState(false);

    const active = liabilities.filter(l => !l.archivedAt);
    const archived = liabilities.filter(l => !!l.archivedAt);

    const handleArchive = async (id: string) => {
        try {
            await archiveLiability(id);
            onChanged();
        } catch (err) { console.error(err); }
    };

    const handleUnarchive = async (id: string) => {
        try {
            await updateLiability(id, { archivedAt: null } as any);
            onChanged();
        } catch (err) { console.error(err); }
    };

    const handleDelete = async (id: string) => {
        if (confirmingDeleteId !== id) { setConfirmingDeleteId(id); return; }
        try {
            await deleteLiability(id);
            setConfirmingDeleteId(null);
            onChanged();
        } catch (err) { console.error(err); }
    };

    if (!isOpen) return null;

    const LiabilityRow = ({ l, isArchivedRow }: { l: Liability; isArchivedRow: boolean }) => (
        <div className="flex items-center justify-between p-3.5 bg-white border border-slate-100 rounded-xl hover:border-slate-200 transition-all">
            <div className="flex items-center gap-3 min-w-0">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: l.color ?? '#64748B' }} />
                <div className="min-w-0">
                    <p className={clsx('font-medium text-sm truncate', isArchivedRow ? 'text-slate-400' : 'text-slate-800')}>{l.name}</p>
                    <p className="text-xs text-slate-400">{LIABILITY_TYPE_LABELS[l.type as keyof typeof LIABILITY_TYPE_LABELS]}</p>
                </div>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
                {!isArchivedRow && (
                    <>
                        <button onClick={() => setEditingLiability(l)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-lg transition-colors"><Pencil size={15} /></button>
                        <button onClick={() => handleArchive(l.id)} title="Archive (paid off)" className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"><Archive size={15} /></button>
                    </>
                )}
                {isArchivedRow && (
                    <button onClick={() => handleUnarchive(l.id)} title="Restore" className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"><ArchiveRestore size={15} /></button>
                )}
                <button
                    onClick={() => handleDelete(l.id)}
                    className={clsx('px-2.5 py-1.5 rounded-lg transition-all text-xs font-medium', confirmingDeleteId === l.id ? 'bg-rose-600 text-white' : 'text-rose-400 hover:bg-rose-50')}
                >
                    {confirmingDeleteId === l.id ? 'Confirm?' : <Trash2 size={15} />}
                </button>
            </div>
        </div>
    );

    return (
        <>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                <div className="bg-white rounded-2xl shadow-xl border border-slate-100 w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[85vh]">
                    <div className="flex items-center justify-between p-6 border-b border-slate-100 flex-shrink-0">
                        <h2 className="text-xl font-bold text-slate-900">Manage Liabilities</h2>
                        <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-lg transition-colors text-slate-400 hover:text-slate-600"><X size={20} /></button>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4">
                        {active.length === 0 && (
                            <p className="text-sm text-slate-400 italic text-center py-4">No active liabilities. Use "Add Liability" on the main page.</p>
                        )}
                        {active.map(l => <LiabilityRow key={l.id} l={l} isArchivedRow={false} />)}

                        {archived.length > 0 && (
                            <div className="space-y-2">
                                <button
                                    onClick={() => setShowArchived(v => !v)}
                                    className="text-xs font-medium text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    {showArchived ? '▾' : '▸'} Show archived ({archived.length})
                                </button>
                                {showArchived && archived.map(l => <LiabilityRow key={l.id} l={l} isArchivedRow />)}
                            </div>
                        )}
                    </div>

                    <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex-shrink-0">
                        <button onClick={onClose} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-white transition-colors">Close</button>
                    </div>
                </div>
            </div>

            {editingLiability && (
                <AddLiabilityWizard
                    isOpen
                    onClose={() => setEditingLiability(null)}
                    onSaved={() => { setEditingLiability(null); onChanged(); }}
                    editingLiability={editingLiability}
                    properties={properties}
                />
            )}
        </>
    );
};
