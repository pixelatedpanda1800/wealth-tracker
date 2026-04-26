import { logger } from '../../utils/logger';
import React, { useState } from 'react';
import {
  X,
  Home,
  Banknote,
  Car,
  CreditCard,
  GraduationCap,
  ArrowDownCircle,
  ShoppingCart,
  Receipt,
  Users,
  MoreHorizontal,
  ChevronLeft,
  Loader2,
  Check,
} from 'lucide-react';
import { clsx } from 'clsx';
import { createLiability, updateLiability, type Liability } from '../../api';
import { type LiabilityType, LIABILITY_TYPE_LABELS, LIABILITY_TYPE_DESCRIPTIONS } from './types';
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
  '#6366F1',
  '#EF4444',
  '#F59E0B',
  '#10B981',
  '#8B5CF6',
  '#EC4899',
  '#06B6D4',
  '#F97316',
  '#14B8A6',
  '#64748B',
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
  'mortgage',
  'personal_loan',
  'car_loan',
  'credit_card',
  'student_loan',
  'overdraft',
  'bnpl',
  'tax_owed',
  'family_loan',
  'other',
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  editingLiability?: Liability | null;
  properties: Array<{ id: string; name: string }>;
}

export const AddLiabilityWizard: React.FC<Props> = ({
  isOpen,
  onClose,
  onSaved,
  editingLiability,
  properties,
}) => {
  const [step, setStep] = useState<'type' | 'form'>(editingLiability ? 'form' : 'type');
  const [selectedType, setSelectedType] = useState<LiabilityType>(
    (editingLiability?.type as LiabilityType) ?? 'mortgage',
  );
  const [form, setFormState] = useState<FormState>(() => {
    if (editingLiability) {
      return {
        name: editingLiability.name,
        startDate: editingLiability.startDate ?? '',
        originalPrincipal:
          editingLiability.originalPrincipal != null
            ? String(editingLiability.originalPrincipal)
            : '',
        interestRate:
          editingLiability.interestRate != null ? String(editingLiability.interestRate) : '',
        monthlyPayment:
          editingLiability.monthlyPayment != null ? String(editingLiability.monthlyPayment) : '',
        recurringOverpayment:
          editingLiability.recurringOverpayment != null
            ? String(editingLiability.recurringOverpayment)
            : '',
        creditLimit:
          editingLiability.creditLimit != null ? String(editingLiability.creditLimit) : '',
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
    setFormState((prev) => ({ ...prev, [key]: value }));

  const setMeta = (key: string, value: any) =>
    setFormState((prev) => ({ ...prev, typeMetadata: { ...prev.typeMetadata, [key]: value } }));

  const handleTypeSelect = (type: LiabilityType) => {
    setSelectedType(type);
    setStep('form');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError('Name is required');
      return;
    }
    setError('');
    try {
      setIsSubmitting(true);
      const payload = {
        name: form.name.trim(),
        type: selectedType,
        propertyId: form.propertyId || undefined,
        startDate: form.startDate || undefined,
        originalPrincipal:
          form.originalPrincipal !== '' ? Number(form.originalPrincipal) : undefined,
        interestRate: form.interestRate !== '' ? Number(form.interestRate) : undefined,
        monthlyPayment: form.monthlyPayment !== '' ? Number(form.monthlyPayment) : undefined,
        recurringOverpayment:
          form.recurringOverpayment !== '' ? Number(form.recurringOverpayment) : undefined,
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
      logger.error('Failed to save liability', err);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
      <div className="animate-in fade-in zoom-in flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-xl duration-200">
        {/* Header */}
        <div className="flex flex-shrink-0 items-center justify-between border-b border-slate-100 p-6">
          <div className="flex items-center gap-3">
            {step === 'form' && !editingLiability && (
              <button
                onClick={() => setStep('type')}
                className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-600"
              >
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
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-600"
          >
            <X size={20} />
          </button>
        </div>

        {/* Step 1: Type picker */}
        {step === 'type' && (
          <div className="custom-scrollbar flex-1 overflow-y-auto p-6">
            <p className="mb-4 text-sm text-slate-500">Choose the type of liability to add:</p>
            <div className="grid grid-cols-2 gap-3">
              {ALL_TYPES.map((type) => {
                const Icon = TYPE_ICONS[type];
                return (
                  <button
                    key={type}
                    onClick={() => handleTypeSelect(type)}
                    className="group flex items-start gap-3 rounded-xl border border-slate-200 p-4 text-left transition-all hover:border-indigo-300 hover:bg-indigo-50/50"
                  >
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100 transition-colors group-hover:bg-indigo-100">
                      <Icon
                        size={16}
                        className="text-slate-500 transition-colors group-hover:text-indigo-600"
                      />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800">
                        {LIABILITY_TYPE_LABELS[type]}
                      </p>
                      <p className="mt-0.5 text-xs leading-snug text-slate-400">
                        {LIABILITY_TYPE_DESCRIPTIONS[type]}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 2: Form */}
        {step === 'form' && (
          <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
            <div className="custom-scrollbar flex-1 space-y-5 overflow-y-auto p-6">
              {/* Common fields */}
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder={`${LIABILITY_TYPE_LABELS[selectedType]} name (e.g. Nationwide 2yr Fix)`}
                  value={form.name}
                  onChange={(e) => setField('name', e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium shadow-sm transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                />
              </div>

              {/* Divider */}
              <div className="border-t border-slate-100" />

              {/* Type-specific fields */}
              <TypeFormComponent
                form={form}
                setField={setField}
                setMeta={setMeta}
                properties={properties}
              />

              {/* Divider */}
              <div className="border-t border-slate-100" />

              {/* Colour + Notes */}
              <div className="space-y-3">
                <div className="space-y-2">
                  <label className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
                    Colour
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {PRESET_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setField('color', c)}
                        className={clsx(
                          'h-7 w-7 rounded-full transition-all hover:scale-110',
                          form.color === c && 'scale-110 ring-2 ring-indigo-500 ring-offset-2',
                        )}
                        style={{ backgroundColor: c }}
                      >
                        {form.color === c && (
                          <Check size={12} className="m-auto text-white drop-shadow-md" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
                <input
                  type="text"
                  placeholder="Notes (optional)"
                  value={form.notes}
                  onChange={(e) => setField('notes', e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm shadow-sm transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                />
              </div>

              {error && (
                <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
                  {error}
                </p>
              )}
            </div>

            <div className="flex flex-shrink-0 gap-3 border-t border-slate-100 bg-slate-50/50 p-6">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 font-medium text-slate-600 transition-colors hover:bg-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !form.name.trim()}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 font-medium text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : editingLiability ? (
                  <>
                    <Check size={16} />
                    Save Changes
                  </>
                ) : (
                  'Add Liability'
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
