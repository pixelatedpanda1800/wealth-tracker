import React, { useState } from 'react';
import { X, Plus, Trash2, Pencil, Check } from 'lucide-react';
import type { SpendingCategory } from './types';

interface Props {
  isOpen: boolean;
  categories: SpendingCategory[];
  onClose: () => void;
  onAdd: (name: string, parentId: string | null) => void;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
}

export const ManageCategoriesModal: React.FC<Props> = ({
  isOpen,
  categories,
  onClose,
  onAdd,
  onRename,
  onDelete,
}) => {
  const [newName, setNewName] = useState('');
  const [newParentId, setNewParentId] = useState<string>('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  if (!isOpen) return null;

  const topLevels = categories.filter((c) => c.parentId === null);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    onAdd(newName.trim(), newParentId || null);
    setNewName('');
    setNewParentId('');
  };

  const startEdit = (c: SpendingCategory) => {
    setEditingId(c.id);
    setEditingName(c.name);
  };

  const commitEdit = () => {
    if (editingId && editingName.trim()) {
      onRename(editingId, editingName.trim());
    }
    setEditingId(null);
    setEditingName('');
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
      <div className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h3 className="font-semibold text-slate-800">Manage categories</h3>
          <button onClick={onClose} className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100">
            <X size={18} />
          </button>
        </div>

        <form
          onSubmit={handleAdd}
          className="flex flex-wrap items-end gap-2 border-b border-slate-100 px-6 py-4"
        >
          <label className="min-w-[160px] flex-1">
            <span className="text-xs font-medium tracking-wider text-slate-500 uppercase">
              New category
            </span>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Pets"
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </label>
          <label className="w-48">
            <span className="text-xs font-medium tracking-wider text-slate-500 uppercase">
              Parent
            </span>
            <select
              value={newParentId}
              onChange={(e) => setNewParentId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            >
              <option value="">Top-level</option>
              {topLevels.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            className="flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-2 text-sm text-white hover:bg-indigo-700"
          >
            <Plus size={16} /> Add
          </button>
        </form>

        <div className="space-y-4 overflow-y-auto px-6 py-4">
          {topLevels.map((top) => {
            const children = categories.filter((c) => c.parentId === top.id);
            return (
              <div key={top.id}>
                <CategoryRow
                  category={top}
                  editingId={editingId}
                  editingName={editingName}
                  setEditingName={setEditingName}
                  onEdit={() => startEdit(top)}
                  onCommit={commitEdit}
                  onDelete={() => onDelete(top.id)}
                  indent={false}
                />
                {children.map((child) => (
                  <CategoryRow
                    key={child.id}
                    category={child}
                    editingId={editingId}
                    editingName={editingName}
                    setEditingName={setEditingName}
                    onEdit={() => startEdit(child)}
                    onCommit={commitEdit}
                    onDelete={() => onDelete(child.id)}
                    indent={true}
                  />
                ))}
              </div>
            );
          })}
        </div>

        <div className="flex justify-end border-t border-slate-100 px-6 py-3">
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

interface RowProps {
  category: SpendingCategory;
  editingId: string | null;
  editingName: string;
  setEditingName: (v: string) => void;
  onEdit: () => void;
  onCommit: () => void;
  onDelete: () => void;
  indent: boolean;
}

const CategoryRow: React.FC<RowProps> = ({
  category,
  editingId,
  editingName,
  setEditingName,
  onEdit,
  onCommit,
  onDelete,
  indent,
}) => {
  const isEditing = editingId === category.id;
  return (
    <div className={`flex items-center gap-3 py-1.5 ${indent ? 'pl-8' : ''}`}>
      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: category.color }} />
      {isEditing ? (
        <input
          autoFocus
          value={editingName}
          onChange={(e) => setEditingName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onCommit()}
          className="flex-1 rounded border border-slate-200 px-2 py-1 text-sm"
        />
      ) : (
        <span
          className={`flex-1 text-sm ${indent ? 'text-slate-600' : 'font-medium text-slate-800'}`}
        >
          {category.name}
        </span>
      )}
      {isEditing ? (
        <button onClick={onCommit} className="rounded p-1.5 text-emerald-600 hover:bg-slate-100">
          <Check size={14} />
        </button>
      ) : (
        <button onClick={onEdit} className="rounded p-1.5 text-slate-500 hover:bg-slate-100">
          <Pencil size={14} />
        </button>
      )}
      <button onClick={onDelete} className="rounded p-1.5 text-rose-500 hover:bg-rose-50">
        <Trash2 size={14} />
      </button>
    </div>
  );
};
