import { logger } from '../../utils/logger';
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
  isOpen,
  onClose,
  onChanged,
  liabilities,
  properties,
}) => {
  const [editingLiability, setEditingLiability] = useState<Liability | null>(null);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);

  const active = liabilities.filter((l) => !l.archivedAt);
  const archived = liabilities.filter((l) => !!l.archivedAt);

  const handleArchive = async (id: string) => {
    try {
      await archiveLiability(id);
      onChanged();
    } catch (err) {
      logger.error('Failed to archive liability', err);
    }
  };

  const handleUnarchive = async (id: string) => {
    try {
      await updateLiability(id, { archivedAt: null } as any);
      onChanged();
    } catch (err) {
      logger.error('Failed to unarchive liability', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirmingDeleteId !== id) {
      setConfirmingDeleteId(id);
      return;
    }
    try {
      await deleteLiability(id);
      setConfirmingDeleteId(null);
      onChanged();
    } catch (err) {
      logger.error('Failed to delete liability', err);
    }
  };

  if (!isOpen) return null;

  const LiabilityRow = ({ l, isArchivedRow }: { l: Liability; isArchivedRow: boolean }) => (
    <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-white p-3.5 transition-all hover:border-slate-200">
      <div className="flex min-w-0 items-center gap-3">
        <div
          className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
          style={{ backgroundColor: l.color ?? '#64748B' }}
        />
        <div className="min-w-0">
          <p
            className={clsx(
              'truncate text-sm font-medium',
              isArchivedRow ? 'text-slate-400' : 'text-slate-800',
            )}
          >
            {l.name}
          </p>
          <p className="text-xs text-slate-400">
            {LIABILITY_TYPE_LABELS[l.type as keyof typeof LIABILITY_TYPE_LABELS]}
          </p>
        </div>
      </div>
      <div className="flex flex-shrink-0 items-center gap-1">
        {!isArchivedRow && (
          <>
            <button
              onClick={() => setEditingLiability(l)}
              className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-50 hover:text-indigo-600"
            >
              <Pencil size={15} />
            </button>
            <button
              onClick={() => handleArchive(l.id)}
              title="Archive (paid off)"
              className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-amber-50 hover:text-amber-600"
            >
              <Archive size={15} />
            </button>
          </>
        )}
        {isArchivedRow && (
          <button
            onClick={() => handleUnarchive(l.id)}
            title="Restore"
            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-emerald-50 hover:text-emerald-600"
          >
            <ArchiveRestore size={15} />
          </button>
        )}
        <button
          onClick={() => handleDelete(l.id)}
          className={clsx(
            'rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all',
            confirmingDeleteId === l.id
              ? 'bg-rose-600 text-white'
              : 'text-rose-400 hover:bg-rose-50',
          )}
        >
          {confirmingDeleteId === l.id ? 'Confirm?' : <Trash2 size={15} />}
        </button>
      </div>
    </div>
  );

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
        <div className="animate-in fade-in zoom-in flex max-h-[85vh] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-xl duration-200">
          <div className="flex flex-shrink-0 items-center justify-between border-b border-slate-100 p-6">
            <h2 className="text-xl font-bold text-slate-900">Manage Liabilities</h2>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-600"
            >
              <X size={20} />
            </button>
          </div>

          <div className="custom-scrollbar flex-1 space-y-4 overflow-y-auto p-6">
            {active.length === 0 && (
              <p className="py-4 text-center text-sm text-slate-400 italic">
                No active liabilities. Use "Add Liability" on the main page.
              </p>
            )}
            {active.map((l) => (
              <LiabilityRow key={l.id} l={l} isArchivedRow={false} />
            ))}

            {archived.length > 0 && (
              <div className="space-y-2">
                <button
                  onClick={() => setShowArchived((v) => !v)}
                  className="text-xs font-medium text-slate-400 transition-colors hover:text-slate-600"
                >
                  {showArchived ? '▾' : '▸'} Show archived ({archived.length})
                </button>
                {showArchived &&
                  archived.map((l) => <LiabilityRow key={l.id} l={l} isArchivedRow />)}
              </div>
            )}
          </div>

          <div className="flex-shrink-0 border-t border-slate-100 bg-slate-50/50 p-6">
            <button
              onClick={onClose}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 font-medium text-slate-600 transition-colors hover:bg-white"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {editingLiability && (
        <AddLiabilityWizard
          isOpen
          onClose={() => setEditingLiability(null)}
          onSaved={() => {
            setEditingLiability(null);
            onChanged();
          }}
          editingLiability={editingLiability}
          properties={properties}
        />
      )}
    </>
  );
};
