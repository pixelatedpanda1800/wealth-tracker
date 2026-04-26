import React from 'react';

export const inputCls =
  'w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm';
export const selectCls = inputCls;

interface FieldProps {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}

export const Field: React.FC<FieldProps> = ({ label, required, hint, children }) => (
  <div className="space-y-1">
    <label className="text-xs font-medium text-slate-600">
      {label}
      {required && <span className="ml-0.5 text-rose-500">*</span>}
    </label>
    {children}
    {hint && <p className="text-xs text-slate-400">{hint}</p>}
  </div>
);

export type FormState = {
  name: string;
  startDate: string;
  originalPrincipal: string;
  interestRate: string;
  monthlyPayment: string;
  recurringOverpayment: string;
  creditLimit: string;
  termMonths: string;
  endDate: string;
  color: string;
  notes: string;
  propertyId: string;
  typeMetadata: Record<string, any>;
};

export const emptyForm = (): FormState => ({
  name: '',
  startDate: '',
  originalPrincipal: '',
  interestRate: '',
  monthlyPayment: '',
  recurringOverpayment: '',
  creditLimit: '',
  termMonths: '',
  endDate: '',
  color: '#6366F1',
  notes: '',
  propertyId: '',
  typeMetadata: {},
});

export type FormProps = {
  form: FormState;
  setField: (key: keyof FormState, value: string) => void;
  setMeta: (key: string, value: any) => void;
  properties?: Array<{ id: string; name: string }>;
};
