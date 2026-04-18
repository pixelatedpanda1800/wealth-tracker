import React from 'react';
import { Field, inputCls, type FormProps } from './shared';

export const OtherForm: React.FC<FormProps> = ({ form, setField }) => (
    <div className="space-y-4">
        <Field label="Amount Owed (£)" required>
            <input type="number" min={0} placeholder="e.g. 1500" value={form.originalPrincipal} onChange={e => setField('originalPrincipal', e.target.value)} className={inputCls} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
            <Field label="Interest Rate (% APR)" hint="Optional">
                <input type="number" step="0.1" min={0} placeholder="optional" value={form.interestRate} onChange={e => setField('interestRate', e.target.value)} className={inputCls} />
            </Field>
            <Field label="Monthly Payment (£)" hint="Optional">
                <input type="number" min={0} placeholder="optional" value={form.monthlyPayment} onChange={e => setField('monthlyPayment', e.target.value)} className={inputCls} />
            </Field>
        </div>
        <Field label="Start Date">
            <input type="date" value={form.startDate} onChange={e => setField('startDate', e.target.value)} className={inputCls} />
        </Field>
    </div>
);
