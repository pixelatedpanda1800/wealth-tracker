import React, { useEffect } from 'react';
import { Field, inputCls, type FormProps } from './shared';

export const PersonalLoanForm: React.FC<FormProps> = ({ form, setField }) => {
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
      <div className="grid grid-cols-2 gap-3">
        <Field label="Interest Rate (% APR)" required>
          <input
            type="number"
            step="0.1"
            min={0}
            placeholder="e.g. 7.9"
            value={form.interestRate}
            onChange={(e) => setField('interestRate', e.target.value)}
            className={inputCls}
          />
        </Field>
        <Field label="Original Amount (£)" required>
          <input
            type="number"
            min={0}
            placeholder="e.g. 10000"
            value={form.originalPrincipal}
            onChange={(e) => setField('originalPrincipal', e.target.value)}
            className={inputCls}
          />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Term (months)" required>
          <input
            type="number"
            min={1}
            placeholder="e.g. 60"
            value={form.termMonths}
            onChange={(e) => setField('termMonths', e.target.value)}
            className={inputCls}
          />
        </Field>
        <Field label="Monthly Payment (£)" hint="Auto-calculated if left blank">
          <input
            type="number"
            min={0}
            placeholder="e.g. 195"
            value={form.monthlyPayment}
            onChange={(e) => setField('monthlyPayment', e.target.value)}
            className={inputCls}
          />
        </Field>
      </div>
      <Field label="Start Date">
        <input
          type="date"
          value={form.startDate}
          onChange={(e) => setField('startDate', e.target.value)}
          className={inputCls}
        />
      </Field>
    </div>
  );
};
