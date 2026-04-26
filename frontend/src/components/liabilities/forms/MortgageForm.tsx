import React, { useEffect } from 'react';
import { Field, inputCls, selectCls, type FormProps } from './shared';

export const MortgageForm: React.FC<FormProps> = ({ form, setField, setMeta, properties = [] }) => {
  useEffect(() => {
    if (!form.typeMetadata.rateType) setMeta('rateType', 'fixed');
    if (!form.typeMetadata.repaymentType) setMeta('repaymentType', 'repayment');
  }, []);

  const rateType = form.typeMetadata.rateType ?? 'fixed';
  const repaymentType = form.typeMetadata.repaymentType ?? 'repayment';
  const ercApplies = form.typeMetadata.ercApplies ?? false;

  // Auto-calculate monthly payment when principal + rate + term are all filled
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
      {properties.length > 0 && (
        <Field label="Linked Property">
          <select
            value={form.propertyId}
            onChange={(e) => setField('propertyId', e.target.value)}
            className={selectCls}
          >
            <option value="">— None / not yet linked —</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </Field>
      )}
      <div className="grid grid-cols-2 gap-3">
        <Field label="Interest Rate (% APR)" required>
          <input
            type="number"
            step="0.001"
            min={0}
            placeholder="e.g. 2.19"
            value={form.interestRate}
            onChange={(e) => setField('interestRate', e.target.value)}
            className={inputCls}
          />
        </Field>
        <Field label="Rate Type" required>
          <select
            value={rateType}
            onChange={(e) => setMeta('rateType', e.target.value)}
            className={selectCls}
          >
            <option value="fixed">Fixed</option>
            <option value="variable">Variable</option>
            <option value="tracker">Tracker</option>
            <option value="svr">SVR</option>
          </select>
        </Field>
      </div>
      {(rateType === 'fixed' || rateType === 'tracker') && (
        <Field label="Rate End / Fix End Date" hint="When this rate expires and reverts to SVR">
          <input
            type="date"
            value={form.typeMetadata.rateEndDate ?? ''}
            onChange={(e) => setMeta('rateEndDate', e.target.value)}
            className={inputCls}
          />
        </Field>
      )}
      <Field label="Repayment Type" required>
        <select
          value={repaymentType}
          onChange={(e) => setMeta('repaymentType', e.target.value)}
          className={selectCls}
        >
          <option value="repayment">Repayment</option>
          <option value="interest_only">Interest Only</option>
          <option value="part_and_part">Part & Part</option>
        </select>
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Original Loan Amount (£)">
          <input
            type="number"
            min={0}
            placeholder="e.g. 250000"
            value={form.originalPrincipal}
            onChange={(e) => setField('originalPrincipal', e.target.value)}
            className={inputCls}
          />
        </Field>
        <Field label="Term (months)">
          <input
            type="number"
            min={1}
            placeholder="e.g. 300"
            value={form.termMonths}
            onChange={(e) => setField('termMonths', e.target.value)}
            className={inputCls}
          />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Monthly Payment (£)" hint="Auto-calculated if left blank">
          <input
            type="number"
            min={0}
            placeholder="e.g. 1200"
            value={form.monthlyPayment}
            onChange={(e) => setField('monthlyPayment', e.target.value)}
            className={inputCls}
          />
        </Field>
        <Field label="Start Date">
          <input
            type="date"
            value={form.startDate}
            onChange={(e) => setField('startDate', e.target.value)}
            className={inputCls}
          />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Annual Overpayment Cap (%)">
          <input
            type="number"
            min={0}
            max={100}
            placeholder="e.g. 10"
            value={form.typeMetadata.overpaymentAnnualCapPct ?? ''}
            onChange={(e) =>
              setMeta(
                'overpaymentAnnualCapPct',
                e.target.value ? Number(e.target.value) : undefined,
              )
            }
            className={inputCls}
          />
        </Field>
        <Field label="ERC Applies?">
          <div className="flex h-[42px] items-center gap-3">
            <input
              type="checkbox"
              id="erc"
              checked={ercApplies}
              onChange={(e) => setMeta('ercApplies', e.target.checked)}
              className="h-4 w-4 accent-indigo-600"
            />
            <label htmlFor="erc" className="text-sm text-slate-700">
              Early repayment charge
            </label>
          </div>
        </Field>
      </div>
      {ercApplies && (
        <Field label="ERC End Date">
          <input
            type="date"
            value={form.typeMetadata.ercEndDate ?? ''}
            onChange={(e) => setMeta('ercEndDate', e.target.value)}
            className={inputCls}
          />
        </Field>
      )}
    </div>
  );
};
