import React, { useEffect } from 'react';
import { Field, inputCls, selectCls, type FormProps } from './shared';

export const CarLoanForm: React.FC<FormProps> = ({ form, setField, setMeta }) => {
    useEffect(() => {
        if (!form.typeMetadata.subType) setMeta('subType', 'loan');
    }, []);

    const subType = form.typeMetadata.subType ?? 'loan';

    useEffect(() => {
        const p = Number(form.originalPrincipal);
        const r = Number(form.interestRate) / 100 / 12;
        const n = Number(form.termMonths);
        if (p > 0 && r > 0 && n > 0 && form.monthlyPayment === '') {
            const payment = (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
            setField('monthlyPayment', payment.toFixed(2));
        }
    }, [form.originalPrincipal, form.interestRate, form.termMonths]);

    return (
        <div className="space-y-4">
            <Field label="Finance Type" required>
                <select value={subType} onChange={e => setMeta('subType', e.target.value)} className={selectCls}>
                    <option value="loan">Standard Loan</option>
                    <option value="hp">Hire Purchase (HP)</option>
                    <option value="pcp">Personal Contract Purchase (PCP)</option>
                </select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
                <Field label="Interest Rate (% APR)" required>
                    <input type="number" step="0.1" min={0} placeholder="e.g. 6.9" value={form.interestRate} onChange={e => setField('interestRate', e.target.value)} className={inputCls} />
                </Field>
                <Field label="Original Amount (£)">
                    <input type="number" min={0} placeholder="e.g. 18000" value={form.originalPrincipal} onChange={e => setField('originalPrincipal', e.target.value)} className={inputCls} />
                </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
                <Field label="Term (months)">
                    <input type="number" min={1} placeholder="e.g. 48" value={form.termMonths} onChange={e => setField('termMonths', e.target.value)} className={inputCls} />
                </Field>
                <Field label="Monthly Payment (£)" hint="Auto-calculated if left blank">
                    <input type="number" min={0} placeholder="e.g. 350" value={form.monthlyPayment} onChange={e => setField('monthlyPayment', e.target.value)} className={inputCls} />
                </Field>
            </div>
            {subType === 'pcp' && (
                <div className="grid grid-cols-2 gap-3">
                    <Field label="Balloon / Final Payment (£)" hint="Amount due at end of agreement">
                        <input type="number" min={0} placeholder="e.g. 8200" value={form.typeMetadata.balloonPayment ?? ''} onChange={e => setMeta('balloonPayment', e.target.value !== '' ? Number(e.target.value) : undefined)} className={inputCls} />
                    </Field>
                    <Field label="GMFV (£)" hint="Guaranteed Minimum Future Value">
                        <input type="number" min={0} placeholder="optional" value={form.typeMetadata.gmfv ?? ''} onChange={e => setMeta('gmfv', e.target.value !== '' ? Number(e.target.value) : undefined)} className={inputCls} />
                    </Field>
                </div>
            )}
            {subType === 'pcp' && (
                <Field label="Annual Mileage Cap">
                    <input type="number" min={0} placeholder="e.g. 10000" value={form.typeMetadata.mileageCap ?? ''} onChange={e => setMeta('mileageCap', e.target.value !== '' ? Number(e.target.value) : undefined)} className={inputCls} />
                </Field>
            )}
            <div className="grid grid-cols-2 gap-3">
                <Field label="Start Date">
                    <input type="date" value={form.startDate} onChange={e => setField('startDate', e.target.value)} className={inputCls} />
                </Field>
                <Field label="End Date">
                    <input type="date" value={form.endDate} onChange={e => setField('endDate', e.target.value)} className={inputCls} />
                </Field>
            </div>
        </div>
    );
};
