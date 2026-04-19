import React from 'react';
import { Field, inputCls, type FormProps } from './shared';

export const BnplForm: React.FC<FormProps> = ({ form, setField, setMeta }) => (
    <div className="space-y-4">
        <Field label="Provider" hint="e.g. Klarna, Clearpay, Laybuy">
            <input type="text" placeholder="e.g. Klarna" value={form.typeMetadata.provider ?? ''} onChange={e => setMeta('provider', e.target.value || undefined)} className={inputCls} />
        </Field>
        <Field label="Total Amount (£)" required>
            <input type="number" min={0} placeholder="e.g. 300" value={form.originalPrincipal} onChange={e => setField('originalPrincipal', e.target.value)} className={inputCls} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
            <Field label="Total Instalments" required>
                <input type="number" min={1} placeholder="e.g. 3" value={form.typeMetadata.instalmentCount ?? ''} onChange={e => setMeta('instalmentCount', e.target.value !== '' ? Number(e.target.value) : undefined)} className={inputCls} />
            </Field>
            <Field label="Instalments Paid">
                <input type="number" min={0} placeholder="e.g. 1" value={form.typeMetadata.instalmentsPaid ?? ''} onChange={e => setMeta('instalmentsPaid', e.target.value !== '' ? Number(e.target.value) : undefined)} className={inputCls} />
            </Field>
        </div>
        <Field label="Interest Rate (% APR)" hint="Usually 0% — only fill in if interest-bearing">
            <input type="number" step="0.1" min={0} placeholder="0" value={form.interestRate} onChange={e => setField('interestRate', e.target.value)} className={inputCls} />
        </Field>
        <Field label="Start Date">
            <input type="date" value={form.startDate} onChange={e => setField('startDate', e.target.value)} className={inputCls} />
        </Field>
    </div>
);
