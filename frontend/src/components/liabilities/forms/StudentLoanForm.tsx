import React, { useEffect } from 'react';
import { Field, inputCls, selectCls, type FormProps } from './shared';

export const StudentLoanForm: React.FC<FormProps> = ({ form, setField, setMeta }) => {
    useEffect(() => {
        if (!form.typeMetadata.planType) setMeta('planType', 'plan_2');
    }, []);

    const planType = form.typeMetadata.planType ?? 'plan_2';

    const planDescriptions: Record<string, string> = {
        plan_1: 'Pre-2012 England/Wales or any Scotland. Repay 9% over £24,990. Wiped at 65.',
        plan_2: 'Post-2012 England/Wales. Repay 9% over £27,295. Wiped after 30 years.',
        plan_4: 'Scotland post-2021. Repay 9% over £31,395. Wiped after 30 years.',
        plan_5: 'Post-Aug 2023 England. Repay 9% over £25,000. Wiped after 40 years.',
        postgrad: 'Masters/Doctoral. Repay 6% over £21,000. Wiped after 30 years.',
    };

    return (
        <div className="space-y-4">
            <Field label="Plan Type" required>
                <select value={planType} onChange={e => setMeta('planType', e.target.value)} className={selectCls}>
                    <option value="plan_1">Plan 1</option>
                    <option value="plan_2">Plan 2</option>
                    <option value="plan_4">Plan 4</option>
                    <option value="plan_5">Plan 5</option>
                    <option value="postgrad">Postgraduate</option>
                </select>
            </Field>
            <p className="text-xs text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-100">{planDescriptions[planType]}</p>
            <Field label="Current Balance (£)" hint="Will be your starting snapshot">
                <input type="number" min={0} placeholder="e.g. 47000" value={form.originalPrincipal} onChange={e => setField('originalPrincipal', e.target.value)} className={inputCls} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
                <Field label="Write-Off Year" hint="Year the debt is wiped">
                    <input type="number" min={2024} max={2090} placeholder="e.g. 2052" value={form.typeMetadata.writeOffYear ?? ''} onChange={e => setMeta('writeOffYear', e.target.value !== '' ? Number(e.target.value) : undefined)} className={inputCls} />
                </Field>
                <Field label="Salary Threshold (£)" hint="Your plan's repayment threshold">
                    <input type="number" min={0} placeholder="e.g. 27295" value={form.typeMetadata.salaryThreshold ?? ''} onChange={e => setMeta('salaryThreshold', e.target.value !== '' ? Number(e.target.value) : undefined)} className={inputCls} />
                </Field>
            </div>
            <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-xl p-3">
                UK student loan repayment depends on income, future threshold uplifts, and plan rules. The burndown chart shows the balance flat with a note — the write-off year is shown as the end point.
            </p>
        </div>
    );
};
