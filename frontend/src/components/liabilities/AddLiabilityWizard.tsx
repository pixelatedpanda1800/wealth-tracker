import React, { useState } from 'react';
import {
    X, Home, Banknote, Car, CreditCard, GraduationCap,
    ArrowDownCircle, ShoppingCart, Receipt, Users, MoreHorizontal,
    ChevronLeft, Loader2, Check,
} from 'lucide-react';
import { clsx } from 'clsx';
import { createLiability, updateLiability, type Liability } from '../../api';
import {
    type LiabilityType,
    LIABILITY_TYPE_LABELS,
    LIABILITY_TYPE_DESCRIPTIONS,
} from './types';
import { emptyForm, type FormState } from './forms/shared';
import { MortgageForm } from './forms/MortgageForm';
import { CreditCardForm } from './forms/CreditCardForm';
import { CarLoanForm } from './forms/CarLoanForm';
import { PersonalLoanForm } from './forms/PersonalLoanForm';
import { StudentLoanForm } from './forms/StudentLoanForm';
import { OverdraftForm } from './forms/OverdraftForm';
import { BnplForm } from './forms/BnplForm';
import { TaxOwedForm } from './forms/TaxOwedForm';
import { FamilyLoanForm } from './forms/FamilyLoanForm';
import { OtherForm } from './forms/OtherForm';

const PRESET_COLORS = [
    '#6366F1', '#EF4444', '#F59E0B', '#10B981', '#8B5CF6',
    '#EC4899', '#06B6D4', '#F97316', '#14B8A6', '#64748B',
];

const TYPE_ICONS: Record<LiabilityType, React.ElementType> = {
    mortgage: Home,
    personal_loan: Banknote,
    car_loan: Car,
    credit_card: CreditCard,
    student_loan: GraduationCap,
    overdraft: ArrowDownCircle,
    bnpl: ShoppingCart,
    tax_owed: Receipt,
    family_loan: Users,
    other: MoreHorizontal,
};

const ALL_TYPES: LiabilityType[] = [
    'mortgage', 'personal_loan', 'car_loan', 'credit_card',
    'student_loan', 'overdraft', 'bnpl', 'tax_owed', 'family_loan', 'other',
];

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSaved: () => void;
    editingLiability?: Liability | null;
    properties: Array<{ id: string; name: string }>;
}

export const AddLiabilityWizard: React.FC<Props> = ({
    isOpen, onClose, onSaved, editingLiability, properties,
}) => {
    const [step, setStep] = useState<'type' | 'form'>(editingLiability ? 'form' : 'type');
    const [selectedType, setSelectedType] = useState<LiabilityType>(
        (editingLiability?.type as LiabilityType) ?? 'mortgage'
    );
    const [form, setFormState] = useState<FormState>(() => {
        if (editingLiability) {
            return {
                name: editingLiability.name,
                startDate: editingLiability.startDate ?? '',
                originalPrincipal: editingLiability.originalPrincipal != null ? String(editingLiability.originalPrincipal) : '',
                interestRate: editingLiability.interestRate != null ? String(editingLiability.interestRate) : '',
                monthlyPayment: editingLiability.monthlyPayment != null ? String(editingLiability.monthlyPayment) : '',
                recurringOverpayment: editingLiability.recurringOverpayment != null ? String(editingLiability.recurringOverpayment) : '',
                creditLimit: editingLiability.creditLimit != null ? String(editingLiability.creditLimit) : '',
                termMonths: editingLiability.termMonths != null ? String(editingLiability.termMonths) : '',
                endDate: editingLiability.endDate ?? '',
                color: editingLiability.color ?? PRESET_COLORS[0],
                notes: editingLiability.notes ?? '',
                propertyId: editingLiability.propertyId ?? '',
                typeMetadata: editingLiability.typeMetadata ?? {},
            };
        }
        return emptyForm();
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const setField = (key: keyof FormState, value: string) =>
        setFormState(prev => ({ ...prev, [key]: value }));

    const setMeta = (key: string, value: any) =>
        setFormState(prev => ({ ...prev, typeMetadata: { ...prev.typeMetadata, [key]: value } }));

    const handleTypeSelect = (type: LiabilityType) => {
        setSelectedType(type);
        setStep('form');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name.trim()) { setError('Name is required'); return; }
        setError('');
        try {
            setIsSubmitting(true);
            const payload = {
                name: form.name.trim(),
                type: selectedType,
                propertyId: form.propertyId || undefined,
                startDate: form.startDate || undefined,
                originalPrincipal: form.originalPrincipal !== '' ? Number(form.originalPrincipal) : undefined,
                interestRate: form.interestRate !== '' ? Number(form.interestRate) : undefined,
                monthlyPayment: form.monthlyPayment !== '' ? Number(form.monthlyPayment) : undefined,
                recurringOverpayment: form.recurringOverpayment !== '' ? Number(form.recurringOverpayment) : undefined,
                creditLimit: form.creditLimit !== '' ? Number(form.creditLimit) : undefined,
                termMonths: form.termMonths !== '' ? Number(form.termMonths) : undefined,
                endDate: form.endDate || undefined,
                color: form.color,
                notes: form.notes || undefined,
                typeMetadata: form.typeMetadata,
            };
            if (editingLiability) {
                await updateLiability(editingLiability.id, payload);
            } else {
                await createLiability(payload as any);
            }
            onSaved();
            onClose();
        } catch (err) {
            setError('Failed to save. Please try again.');
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    const TypeFormComponent = {
        mortgage: MortgageForm,
        personal_loan: PersonalLoanForm,
        car_loan: CarLoanForm,
        credit_card: CreditCardForm,
        student_loan: StudentLoanForm,
        overdraft: OverdraftForm,
        bnpl: BnplForm,
        tax_owed: TaxOwedForm,
        family_loan: FamilyLoanForm,
        other: OtherForm,
    }[selectedType];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl border border-slate-100 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-100 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        {step === 'form' && !editingLiability && (
                            <button onClick={() => setStep('type')} className="p-1.5 hover:bg-slate-50 rounded-lg transition-colors text-slate-400 hover:text-slate-600">
                                <ChevronLeft size={18} />
                            </button>
                        )}
                        <h2 className="text-xl font-bold text-slate-900">
                            {editingLiability
                                ? `Edit ${LIABILITY_TYPE_LABELS[selectedType]}`
                                : step === 'type'
                                    ? 'Add Liability'
                                    : `New ${LIABILITY_TYPE_LABELS[selectedType]}`}
                        </h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-lg transition-colors text-slate-400 hover:text-slate-600">
                        <X size={20} />
                    </button>
                </div>

                {/* Step 1: Type picker */}
                {step === 'type' && (
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                        <p className="text-sm text-slate-500 mb-4">Choose the type of liability to add:</p>
                        <div className="grid grid-cols-2 gap-3">
                            {ALL_TYPES.map(type => {
                                const Icon = TYPE_ICONS[type];
                                return (
                                    <button
                                        key={type}
                                        onClick={() => handleTypeSelect(type)}
                                        className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 transition-all text-left group"
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-indigo-100 flex items-center justify-center flex-shrink-0 transition-colors">
                                            <Icon size={16} className="text-slate-500 group-hover:text-indigo-600 transition-colors" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-slate-800 text-sm">{LIABILITY_TYPE_LABELS[type]}</p>
                                            <p className="text-xs text-slate-400 mt-0.5 leading-snug">{LIABILITY_TYPE_DESCRIPTIONS[type]}</p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Step 2: Form */}
                {step === 'form' && (
                    <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-5">
                            {/* Common fields */}
                            <div className="space-y-3">
                                <input
                                    type="text"
                                    placeholder={`${LIABILITY_TYPE_LABELS[selectedType]} name (e.g. Nationwide 2yr Fix)`}
                                    value={form.name}
                                    onChange={e => setField('name', e.target.value)}
                                    required
                                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
                                />
                            </div>

                            {/* Divider */}
                            <div className="border-t border-slate-100" />

                            {/* Type-specific fields */}
                            <TypeFormComponent form={form} setField={setField} setMeta={setMeta} properties={properties} />

                            {/* Divider */}
                            <div className="border-t border-slate-100" />

                            {/* Colour + Notes */}
                            <div className="space-y-3">
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Colour</label>
                                    <div className="flex gap-2 flex-wrap">
                                        {PRESET_COLORS.map(c => (
                                            <button
                                                key={c}
                                                type="button"
                                                onClick={() => setField('color', c)}
                                                className={clsx('w-7 h-7 rounded-full transition-all hover:scale-110', form.color === c && 'ring-2 ring-offset-2 ring-indigo-500 scale-110')}
                                                style={{ backgroundColor: c }}
                                            >
                                                {form.color === c && <Check size={12} className="text-white m-auto drop-shadow-md" />}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <input
                                    type="text"
                                    placeholder="Notes (optional)"
                                    value={form.notes}
                                    onChange={e => setField('notes', e.target.value)}
                                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
                                />
                            </div>

                            {error && <p className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">{error}</p>}
                        </div>

                        <div className="flex gap-3 p-6 border-t border-slate-100 bg-slate-50/50 flex-shrink-0">
                            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-white transition-colors">
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting || !form.name.trim()}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50"
                            >
                                {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : editingLiability ? <><Check size={16} />Save Changes</> : 'Add Liability'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};
