import React from 'react';
import { Field, inputCls, type FormProps } from './shared';

export const TaxOwedForm: React.FC<FormProps> = ({ form, setField, setMeta }) => (
    <div className="space-y-4">
        <Field label="Authority" hint="e.g. HMRC, Council">
            <input type="text" placeholder="HMRC" value={form.typeMetadata.authority ?? ''} onChange={e => setMeta('authority', e.target.value || undefined)} className={inputCls} />
        </Field>
        <Field label="Amount Owed (£)" required>
            <input type="number" min={0} placeholder="e.g. 2500" value={form.originalPrincipal} onChange={e => setField('originalPrincipal', e.target.value)} className={inputCls} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
            <Field label="Due Date">
                <input type="date" value={form.typeMetadata.dueDate ?? ''} onChange={e => setMeta('dueDate', e.target.value || undefined)} className={inputCls} />
            </Field>
            <Field label="Late Payment Rate (% APR)" hint="HMRC currently ~7.75%">
                <input type="number" step="0.01" min={0} placeholder="e.g. 7.75" value={form.interestRate} onChange={e => setField('interestRate', e.target.value)} className={inputCls} />
            </Field>
        </div>
    </div>
);
