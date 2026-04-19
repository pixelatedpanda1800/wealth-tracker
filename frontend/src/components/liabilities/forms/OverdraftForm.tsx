import React from 'react';
import { Field, inputCls, type FormProps } from './shared';

export const OverdraftForm: React.FC<FormProps> = ({ form, setField, setMeta }) => (
    <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
            <Field label="Interest Rate (% APR)" required hint="Typically 35–40% for arranged overdrafts">
                <input type="number" step="0.1" min={0} placeholder="e.g. 39.9" value={form.interestRate} onChange={e => setField('interestRate', e.target.value)} className={inputCls} />
            </Field>
            <Field label="Arranged Limit (£)" hint="The facility size, not the balance owed">
                <input type="number" min={0} placeholder="e.g. 1000" value={form.typeMetadata.arrangedLimit ?? ''} onChange={e => setMeta('arrangedLimit', e.target.value !== '' ? Number(e.target.value) : undefined)} className={inputCls} />
            </Field>
        </div>
        <p className="text-xs text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-100">
            Overdraft balances are entered as the amount currently overdrawn (a positive number). The burndown projects clearance based on APR and any overpayments you set.
        </p>
    </div>
);
