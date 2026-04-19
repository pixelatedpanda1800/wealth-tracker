import React, { useState } from 'react';
import { X, Plus, Pencil, Trash2, Check, Loader2, Home } from 'lucide-react';
import { clsx } from 'clsx';
import { createProperty, updateProperty, deleteProperty, type Property } from '../../api';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onChanged: () => void;
    properties: Property[];
}

const empty = () => ({ name: '', estimatedValue: '', valuationDate: '', notes: '' });

export const ManagePropertiesModal: React.FC<Props> = ({ isOpen, onClose, onChanged, properties }) => {
    const [form, setForm] = useState(empty());
    const [editingId, setEditingId] = useState<string | null>(null);
    const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const setField = (k: keyof typeof form, v: string) => setForm(prev => ({ ...prev, [k]: v }));

    const resetForm = () => { setForm(empty()); setEditingId(null); };

    const handleEdit = (p: Property) => {
        setEditingId(p.id);
        setForm({
            name: p.name,
            estimatedValue: p.estimatedValue != null ? String(p.estimatedValue) : '',
            valuationDate: p.valuationDate ?? '',
            notes: p.notes ?? '',
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name.trim()) return;
        try {
            setIsSubmitting(true);
            const payload = {
                name: form.name.trim(),
                estimatedValue: form.estimatedValue !== '' ? Number(form.estimatedValue) : undefined,
                valuationDate: form.valuationDate || undefined,
                notes: form.notes || undefined,
            };
            if (editingId) {
                await updateProperty(editingId, payload);
            } else {
                await createProperty(payload);
            }
            onChanged();
            resetForm();
        } catch (err) {
            console.error('Failed to save property', err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (confirmingDeleteId !== id) { setConfirmingDeleteId(id); return; }
        try {
            await deleteProperty(id);
            setConfirmingDeleteId(null);
            if (editingId === id) resetForm();
            onChanged();
        } catch (err) {
            console.error('Failed to delete property', err);
        }
    };

    if (!isOpen) return null;

    const inputCls = 'w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl border border-slate-100 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between p-6 border-b border-slate-100 flex-shrink-0">
                    <h2 className="text-xl font-bold text-slate-900">Manage Properties</h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-lg transition-colors text-slate-400 hover:text-slate-600"><X size={20} /></button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
                    <form onSubmit={handleSubmit} className="space-y-3 bg-slate-50 p-5 rounded-xl border border-slate-100">
                        <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
                            {editingId ? 'Edit Property' : 'Add Property'}
                        </h3>
                        <input type="text" placeholder="Address or nickname (e.g. 12 Acacia Avenue)" value={form.name} onChange={e => setField('name', e.target.value)} className={inputCls} />
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-slate-500">Estimated Value (£)</label>
                                <input type="number" placeholder="e.g. 420000" min={0} value={form.estimatedValue} onChange={e => setField('estimatedValue', e.target.value)} className={inputCls} />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-slate-500">Valuation Date</label>
                                <input type="date" value={form.valuationDate} onChange={e => setField('valuationDate', e.target.value)} className={inputCls} />
                            </div>
                        </div>
                        <input type="text" placeholder="Notes (optional)" value={form.notes} onChange={e => setField('notes', e.target.value)} className={inputCls} />
                        <div className="flex gap-2 pt-1">
                            {editingId && (
                                <button type="button" onClick={resetForm} className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-slate-600 transition-colors shadow-sm"><X size={18} /></button>
                            )}
                            <button type="submit" disabled={isSubmitting || !form.name.trim()} className={clsx('flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-colors shadow-sm disabled:opacity-50 text-sm', editingId ? 'bg-emerald-500 text-white hover:bg-emerald-600' : 'bg-indigo-600 text-white hover:bg-indigo-700')}>
                                {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : editingId ? <><Check size={16} />Save</> : <><Plus size={16} />Add Property</>}
                            </button>
                        </div>
                    </form>

                    {properties.length > 0 && (
                        <div className="space-y-2">
                            <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Properties</h3>
                            {properties.map(p => (
                                <div key={p.id} className={clsx('flex items-center justify-between p-4 bg-white border rounded-xl shadow-sm transition-all', editingId === p.id ? 'border-indigo-500 border-2 ring-4 ring-indigo-500/10' : 'border-slate-100 hover:border-slate-200')}>
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
                                            <Home size={16} className="text-indigo-500" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-slate-900 text-sm">{p.name}</p>
                                            {p.estimatedValue != null && (
                                                <p className="text-xs text-slate-400">
                                                    Est. £{Number(p.estimatedValue).toLocaleString()}
                                                    {p.valuationDate && <span className="ml-2">· {p.valuationDate}</span>}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button onClick={() => handleEdit(p)} disabled={!!editingId} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-lg transition-colors disabled:opacity-40"><Pencil size={16} /></button>
                                        {!editingId && (
                                            <button onClick={() => handleDelete(p.id)} className={clsx('px-3 py-1.5 rounded-lg transition-all text-sm font-medium', confirmingDeleteId === p.id ? 'bg-rose-600 text-white' : 'text-rose-500 hover:bg-rose-50')}>
                                                {confirmingDeleteId === p.id ? 'Confirm?' : <Trash2 size={16} />}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    {properties.length === 0 && <p className="text-center text-slate-400 text-sm italic">No properties added yet.</p>}
                </div>

                <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex-shrink-0">
                    <button onClick={onClose} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-white transition-colors">Close</button>
                </div>
            </div>
        </div>
    );
};
