import React from 'react';
import { Field, inputCls, type FormProps } from './shared';

export const FamilyLoanForm: React.FC<FormProps> = ({ form, setField, setMeta }) => (
    <div className="space-y-4">
        <Field label="Lender / Counterparty">
            <input type="text" placeholder="e.g. Mum & Dad" value={form.typeMetadata.counterparty ?? ''} onChange={e => setMeta('counterparty', e.target.value || undefined)} className={inputCls} />
        </Field>
        <Field label="Amount Borrowed (£)" required>
            <input type="number" min={0} placeholder="e.g. 5000" value={form.originalPrincipal} onChange={e => setField('originalPrincipal', e.target.value)} className={inputCls} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
            <Field label="Interest Rate (% APR)" hint="Usually 0%">
                <input type="number" step="0.1" min={0} placeholder="0" value={form.interestRate} onChange={e => setField('interestRate', e.target.value)} className={inputCls} />
            </Field>
            <Field label="Monthly Payment (£)" hint="Leave blank if informal">
                <input type="number" min={0} placeholder="optional" value={form.monthlyPayment} onChange={e => setField('monthlyPayment', e.target.value)} className={inputCls} />
            </Field>
        </div>
        <Field label="Agreed Repayment Schedule" hint="Free text — e.g. 'When I can afford it'">
            <input type="text" placeholder="e.g. £200/month from Jan 2026" value={form.typeMetadata.agreedSchedule ?? ''} onChange={e => setMeta('agreedSchedule', e.target.value || undefined)} className={inputCls} />
        </Field>
        <Field label="Start Date">
            <input type="date" value={form.startDate} onChange={e => setField('startDate', e.target.value)} className={inputCls} />
        </Field>
    </div>
);
