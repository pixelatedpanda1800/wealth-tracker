import React, { useState, useEffect, useRef } from 'react';
import { X, Trash2, Plus, Loader2, Pencil, Check, Download, Upload, AlertTriangle } from 'lucide-react';
import { clsx } from 'clsx';
import { getWealthSources, createWealthSource, updateWealthSource, deleteWealthSource, exportData, importData, type WealthSource, type ImportResult } from '../api';
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

export const WealthSourcesModal: React.FC<WealthSourcesModalProps> = ({ isOpen, onClose, onSourcesChanged }) => {
    const [sources, setSources] = useState<WealthSource[]>([]);
    const [loading, setLoading] = useState(true);

    // Form State
    const [name, setName] = useState('');
    const [category, setCategory] = useState<'investment' | 'cash' | 'pension'>('cash');
    const [selectedColor, setSelectedColor] = useState<string>(PRESET_COLORS[0]);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);
    const [editingSourceId, setEditingSourceId] = useState<string | null>(null);

    // CSV Import/Export State
    const [showImportConfirm, setShowImportConfirm] = useState(false);
    const [pendingCsv, setPendingCsv] = useState<string | null>(null);
    const [importResult, setImportResult] = useState<ImportResult | null>(null);
    const [isExporting, setIsExporting] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

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
            const usedColors = new Set(sources.map(s => s.color));
            const available = PRESET_COLORS.find(c => !usedColors.has(c));
            if (available) setSelectedColor(available);
        }
    }, [sources, editingSourceId]);

    const fetchSources = async () => {
        try {
            setLoading(true);
            const data = await getWealthSources();
            setSources(data);
        } catch (error) {
            console.error('Failed to fetch sources', error);
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setName('');
        setCategory('cash');
        setEditingSourceId(null);
        // Reset color to first available
        const usedColors = new Set(sources.map(s => s.color));
        const available = PRESET_COLORS.find(c => !usedColors.has(c)) || PRESET_COLORS[0];
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
                    color: selectedColor
                });
            } else {
                await createWealthSource({
                    name,
                    category,
                    color: selectedColor
                });
            }

            await fetchSources();
            onSourcesChanged();
            resetForm();
        } catch (error) {
            console.error('Failed to save source', error);
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
            console.error('Failed to delete source', error);
            alert('Failed to delete source. Check backend logs.');
        }
    };

    const usedColors = new Set(
        sources
            .filter(s => s.id !== editingSourceId)
            .map(s => s.color)
            .filter(Boolean) as string[]
    );

    const filteredSources = editingSourceId
        ? sources.filter(s => s.id === editingSourceId)
        : sources;

    // Sort to determine default colors
    const fullSortedSources = sortSources(sources);

    const handleBackup = async () => {
        try {
            setIsExporting(true);
            const csv = await exportData();
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `wealth-backup-${new Date().toISOString().slice(0, 10)}.csv`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Failed to export data', error);
            alert('Failed to export data');
        } finally {
            setIsExporting(false);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const csv = event.target?.result as string;
            setPendingCsv(csv);
            setShowImportConfirm(true);
        };
        reader.readAsText(file);
        e.target.value = ''; // Reset for re-upload
    };

    const handleConfirmImport = async () => {
        if (!pendingCsv) return;

        try {
            setIsImporting(true);
            const result = await importData(pendingCsv);
            setImportResult(result);
            setShowImportConfirm(false);
            setPendingCsv(null);
            await fetchSources();
            onSourcesChanged();
        } catch (error) {
            console.error('Failed to import data', error);
            alert('Failed to import data');
        } finally {
            setIsImporting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl border border-slate-100 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between p-6 border-b border-slate-100 flex-shrink-0">
                    <h2 className="text-xl font-bold text-slate-900">Manage Wealth Sources</h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-lg transition-colors text-slate-400 hover:text-slate-600">
                        <X size={20} />
                    </button>
                </div>

                {/* Backup / Import Buttons */}
                <div className="flex gap-3 p-4 border-b border-slate-100 bg-slate-50/50">
                    <button
                        onClick={handleBackup}
                        disabled={isExporting}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100 font-medium hover:bg-emerald-100 transition-colors disabled:opacity-50"
                    >
                        {isExporting ? <Loader2 className="animate-spin" size={18} /> : <Download size={18} />}
                        Backup
                    </button>
                    <input
                        type="file"
                        accept=".csv"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                        className="hidden"
                    />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isImporting}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rose-50 text-rose-700 border border-rose-100 font-medium hover:bg-rose-100 transition-colors disabled:opacity-50"
                    >
                        {isImporting ? <Loader2 className="animate-spin" size={18} /> : <Upload size={18} />}
                        Import Data
                    </button>
                </div>

                {/* Import Confirmation Modal */}
                {showImportConfirm && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm rounded-2xl">
                        <div className="bg-white rounded-xl shadow-lg p-6 m-6 max-w-sm space-y-4">
                            <div className="flex items-center gap-3 text-amber-600">
                                <AlertTriangle size={24} />
                                <h3 className="text-lg font-bold">Confirm Import</h3>
                            </div>
                            <p className="text-slate-600 text-sm">
                                Importing data will <strong>overwrite</strong> any existing records for the same month/year. Are you sure you want to proceed?
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => { setShowImportConfirm(false); setPendingCsv(null); }}
                                    className="flex-1 px-4 py-2 rounded-lg border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleConfirmImport}
                                    disabled={isImporting}
                                    className="flex-1 px-4 py-2 rounded-lg bg-amber-500 text-white font-medium hover:bg-amber-600 transition-colors disabled:opacity-50"
                                >
                                    {isImporting ? <Loader2 className="animate-spin mx-auto" size={18} /> : 'Proceed'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Import Result Summary */}
                {importResult && (
                    <div className="p-4 bg-emerald-50 border-b border-emerald-100">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="font-medium text-emerald-700">Import Complete</p>
                                <p className="text-sm text-emerald-600">{importResult.rowsProcessed} row(s) processed.</p>
                                {importResult.newSources.length > 0 && (
                                    <p className="text-sm text-amber-600 mt-1">
                                        <strong>New sources created as 'Cash':</strong> {importResult.newSources.join(', ')}. Update their category in the list below if needed.
                                    </p>
                                )}
                            </div>
                            <button onClick={() => setImportResult(null)} className="text-emerald-500 hover:text-emerald-700">
                                <X size={18} />
                            </button>
                        </div>
                    </div>
                )}

                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
                    {/* Add/Edit Form */}
                    <form onSubmit={handleSubmit} className="space-y-5 bg-slate-50 p-5 rounded-xl border border-slate-100">
                        <div className="flex justify-between items-center">
                            <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
                                {editingSourceId ? 'Edit Source' : 'Add New Source'}
                            </h3>
                        </div>

                        <div className="space-y-4">
                            <input
                                type="text"
                                placeholder="Source Name (e.g. Vanguard ISA)"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
                            />

                            <div className="flex gap-4">
                                <select
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value as any)}
                                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
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
                                            className="px-4 py-2.5 rounded-xl bg-white border border-rose-200 text-rose-500 hover:bg-rose-50 transition-colors shadow-sm"
                                            title="Cancel Edits"
                                        >
                                            <X size={20} />
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={isSubmitting || !name.trim()}
                                            className="px-4 py-2.5 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 transition-colors shadow-sm disabled:opacity-50"
                                            title="Save Changes"
                                        >
                                            {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <Check size={20} />}
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        type="submit"
                                        disabled={isSubmitting || !name.trim()}
                                        className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 shadow-sm flex items-center justify-center gap-2 font-medium whitespace-nowrap"
                                    >
                                        {isSubmitting ? (
                                            <Loader2 className="animate-spin" size={20} />
                                        ) : (
                                            <><Plus size={18} /> Add Source</>
                                        )}
                                    </button>
                                )}
                            </div>

                            {/* Color Picker */}
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Source Color</label>
                                <div className="grid grid-cols-8 gap-2">
                                    {PRESET_COLORS.map(color => {
                                        const isUsed = usedColors.has(color);
                                        const isSelected = selectedColor === color;

                                        return (
                                            <button
                                                key={color}
                                                type="button"
                                                disabled={isUsed}
                                                onClick={() => setSelectedColor(color)}
                                                className={clsx(
                                                    "w-8 h-8 rounded-full flex items-center justify-center transition-all",
                                                    isUsed ? "opacity-20 cursor-not-allowed" : "hover:scale-110 cursor-pointer shadow-sm",
                                                    isSelected && "ring-2 ring-offset-2 ring-indigo-500 scale-110"
                                                )}
                                                style={{ backgroundColor: color }}
                                                title={isUsed ? "Color already used" : ""}
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
                        <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
                            {editingSourceId ? 'Editing Source' : 'Current Sources'}
                        </h3>
                        {loading ? (
                            <div className="flex justify-center py-8">
                                <Loader2 className="animate-spin text-indigo-600" size={24} />
                            </div>
                        ) : filteredSources.length === 0 ? (
                            <p className="text-center text-slate-400 py-4 text-sm italic">No sources added yet.</p>
                        ) : (
                            <div className="space-y-3">
                                {filteredSources.map((source) => (
                                    <div
                                        key={source.id}
                                        className={clsx(
                                            "flex items-center justify-between p-4 bg-white border rounded-xl transition-all shadow-sm",
                                            editingSourceId === source.id
                                                ? "border-indigo-600 border-2 ring-4 ring-indigo-500/10 pointer-events-none"
                                                : "border-slate-100 hover:border-slate-200"
                                        )}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div
                                                className="w-4 h-10 rounded-full"
                                                style={{
                                                    backgroundColor: source.color || getDefaultColor(fullSortedSources.findIndex(s => s.id === source.id))
                                                }}
                                            />
                                            <div>
                                                <p className="font-medium text-slate-900">{source.name}</p>
                                                <p className="text-xs text-slate-500 capitalize">{source.category}</p>
                                            </div>
                                        </div>
                                        <div className={clsx("flex items-center gap-2", editingSourceId ? "opacity-50" : "")}>
                                            <button
                                                onClick={() => handleEditClick(source)}
                                                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-lg transition-colors"
                                                disabled={!!editingSourceId}
                                            >
                                                <Pencil size={18} />
                                            </button>
                                            {!editingSourceId && (
                                                <button
                                                    onClick={() => handleDeleteSource(source.id)}
                                                    className={clsx(
                                                        "px-3 py-1.5 rounded-lg transition-all text-sm font-medium",
                                                        confirmingDeleteId === source.id
                                                            ? "bg-rose-600 text-white shadow-sm"
                                                            : "text-rose-500 hover:bg-rose-50"
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

                <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex-shrink-0">
                    <button
                        onClick={onClose}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-white transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};
