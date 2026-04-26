import { logger } from '../utils/logger';
import React, { useState, useEffect } from 'react';
import {
  X,
  Trash2,
  Plus,
  Loader2,
  Pencil,
  Check,
  Wallet,
  Landmark,
  TrendingUp,
} from 'lucide-react';
import { clsx } from 'clsx';
import {
  getWealthSources,
  createWealthSource,
  updateWealthSource,
  deleteWealthSource,
  type WealthSource,
} from '../api';
import { sortSources, getDefaultColor } from '../utils/dataUtils';

interface WealthSourcesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSourcesChanged: () => void;
}

const PRESET_COLORS = [
  '#6366F1', // Indigo
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#8B5CF6', // Violet
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#F97316', // Orange
  '#14B8A6', // Teal
  '#64748B', // Slate
  '#84CC16', // Lime
  '#EAB308', // Yellow
  '#3B82F6', // Blue
  '#A855F7', // Purple
  '#D946EF', // Fuchsia
  '#F43F5E', // Rose
];

export const WealthSourcesModal: React.FC<WealthSourcesModalProps> = ({
  isOpen,
  onClose,
  onSourcesChanged,
}) => {
  const [sources, setSources] = useState<WealthSource[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [name, setName] = useState('');
  const [category, setCategory] = useState<'investment' | 'cash' | 'pension'>('cash');
  const [selectedColor, setSelectedColor] = useState<string>(PRESET_COLORS[0]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);
  const [editingSourceId, setEditingSourceId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchSources();
    } else {
      resetForm();
    }
  }, [isOpen]);

  // Pick first available color when adding new
  useEffect(() => {
    if (!editingSourceId && sources.length > 0) {
      const usedColors = new Set(sources.map((s) => s.color));
      const available = PRESET_COLORS.find((c) => !usedColors.has(c));
      if (available) setSelectedColor(available);
    }
  }, [sources, editingSourceId]);

  const fetchSources = async () => {
    try {
      setLoading(true);
      const data = await getWealthSources();
      setSources(data);
    } catch (error) {
      logger.error('Failed to fetch sources', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setName('');
    setCategory('cash');
    setEditingSourceId(null);
    // Reset color to first available
    const usedColors = new Set(sources.map((s) => s.color));
    const available = PRESET_COLORS.find((c) => !usedColors.has(c)) || PRESET_COLORS[0];
    setSelectedColor(available);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setIsSubmitting(true);
      if (editingSourceId) {
        await updateWealthSource(editingSourceId, {
          name,
          category,
          color: selectedColor,
        });
      } else {
        await createWealthSource({
          name,
          category,
          color: selectedColor,
        });
      }

      await fetchSources();
      onSourcesChanged();
      resetForm();
    } catch (error) {
      logger.error('Failed to save source', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClick = (source: WealthSource) => {
    setEditingSourceId(source.id);
    setName(source.name);
    setCategory(source.category);
    setSelectedColor(source.color || PRESET_COLORS[0]);
  };

  const handleDeleteSource = async (id: string) => {
    if (confirmingDeleteId !== id) {
      setConfirmingDeleteId(id);
      return;
    }

    try {
      await deleteWealthSource(id);
      setConfirmingDeleteId(null);

      // If we were editing this one, cancel edit
      if (editingSourceId === id) resetForm();

      await fetchSources();
      onSourcesChanged();
    } catch (error) {
      logger.error('Failed to delete source', error);
      alert('Failed to delete source. Check backend logs.');
    }
  };

  const usedColors = new Set(
    sources
      .filter((s) => s.id !== editingSourceId)
      .map((s) => s.color)
      .filter(Boolean) as string[],
  );

  const filteredSources = editingSourceId
    ? sources.filter((s) => s.id === editingSourceId)
    : sources;

  // Sort to determine default colors
  // Sort to determine default colors
  const fullSortedSources = sortSources(sources);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
      <div className="animate-in fade-in zoom-in flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-xl duration-200">
        <div className="flex flex-shrink-0 items-center justify-between border-b border-slate-100 p-6">
          <h2 className="text-xl font-bold text-slate-900">Manage Wealth Sources</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-600"
          >
            <X size={20} />
          </button>
        </div>

        <div className="custom-scrollbar flex-1 space-y-8 overflow-y-auto p-6">
          {/* Add/Edit Form */}
          <form
            onSubmit={handleSubmit}
            className="space-y-5 rounded-xl border border-slate-100 bg-slate-50 p-5"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold tracking-wider text-slate-700 uppercase">
                {editingSourceId ? 'Edit Source' : 'Add New Source'}
              </h3>
            </div>

            <div className="space-y-4">
              <input
                type="text"
                placeholder="Source Name (e.g. Vanguard ISA)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 shadow-sm transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
              />

              <div className="flex gap-4">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 shadow-sm transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                >
                  <option value="cash">Cash</option>
                  <option value="investment">Investment</option>
                  <option value="pension">Pension</option>
                </select>

                {editingSourceId ? (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={resetForm}
                      className="rounded-xl border border-rose-200 bg-white px-4 py-2.5 text-rose-500 shadow-sm transition-colors hover:bg-rose-50"
                      title="Cancel Edits"
                    >
                      <X size={20} />
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting || !name.trim()}
                      className="rounded-xl bg-emerald-500 px-4 py-2.5 text-white shadow-sm transition-colors hover:bg-emerald-600 disabled:opacity-50"
                      title="Save Changes"
                    >
                      {isSubmitting ? (
                        <Loader2 className="animate-spin" size={20} />
                      ) : (
                        <Check size={20} />
                      )}
                    </button>
                  </div>
                ) : (
                  <button
                    type="submit"
                    disabled={isSubmitting || !name.trim()}
                    className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 font-medium whitespace-nowrap text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <Loader2 className="animate-spin" size={20} />
                    ) : (
                      <>
                        <Plus size={18} /> Add Source
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Color Picker */}
              <div className="space-y-2">
                <label className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
                  Source Color
                </label>
                <div className="grid grid-cols-8 gap-2">
                  {PRESET_COLORS.map((color) => {
                    const isUsed = usedColors.has(color);
                    const isSelected = selectedColor === color;

                    return (
                      <button
                        key={color}
                        type="button"
                        disabled={isUsed}
                        onClick={() => setSelectedColor(color)}
                        className={clsx(
                          'flex h-8 w-8 items-center justify-center rounded-full transition-all',
                          isUsed
                            ? 'cursor-not-allowed opacity-20'
                            : 'cursor-pointer shadow-sm hover:scale-110',
                          isSelected && 'scale-110 ring-2 ring-indigo-500 ring-offset-2',
                        )}
                        style={{ backgroundColor: color }}
                        title={isUsed ? 'Color already used' : ''}
                      >
                        {isSelected && <Check size={14} className="text-white drop-shadow-md" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </form>

          {/* Current Sources List */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold tracking-wider text-slate-700 uppercase">
              {editingSourceId ? 'Editing Source' : 'Current Sources'}
            </h3>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="animate-spin text-indigo-600" size={24} />
              </div>
            ) : filteredSources.length === 0 ? (
              <p className="py-4 text-center text-sm text-slate-400 italic">
                No sources added yet.
              </p>
            ) : (
              <div className="space-y-3">
                {filteredSources.map((source) => (
                  <div
                    key={source.id}
                    className={clsx(
                      'flex items-center justify-between rounded-xl border bg-white p-4 shadow-sm transition-all',
                      editingSourceId === source.id
                        ? 'pointer-events-none border-2 border-indigo-600 ring-4 ring-indigo-500/10'
                        : 'border-slate-100 hover:border-slate-200',
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-400 transition-all group-hover:bg-white group-hover:shadow-sm"
                        style={{
                          borderLeft: `4px solid ${source.color || getDefaultColor(fullSortedSources.findIndex((s) => s.id === source.id))}`,
                        }}
                      >
                        {source.category === 'cash' ? (
                          <Wallet size={20} />
                        ) : source.category === 'investment' ? (
                          <TrendingUp size={20} />
                        ) : (
                          <Landmark size={20} />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{source.name}</p>
                        <p className="text-xs text-slate-500 capitalize">{source.category}</p>
                      </div>
                    </div>
                    <div
                      className={clsx(
                        'flex items-center gap-2',
                        editingSourceId ? 'opacity-50' : '',
                      )}
                    >
                      <button
                        onClick={() => handleEditClick(source)}
                        className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-50 hover:text-indigo-600"
                        disabled={!!editingSourceId}
                      >
                        <Pencil size={18} />
                      </button>
                      {!editingSourceId && (
                        <button
                          onClick={() => handleDeleteSource(source.id)}
                          className={clsx(
                            'rounded-lg px-3 py-1.5 text-sm font-medium transition-all',
                            confirmingDeleteId === source.id
                              ? 'bg-rose-600 text-white shadow-sm'
                              : 'text-rose-500 hover:bg-rose-50',
                          )}
                        >
                          {confirmingDeleteId === source.id ? 'Confirm?' : <Trash2 size={18} />}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
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
  );
};
