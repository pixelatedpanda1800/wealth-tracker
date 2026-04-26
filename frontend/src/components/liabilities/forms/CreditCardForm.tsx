import React from 'react';
import { Field, inputCls, type FormProps } from './shared';

export const CreditCardForm: React.FC<FormProps> = ({ form, setField, setMeta }) => {
  const promoApr = form.typeMetadata.promoApr;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Standard APR (%)" required>
          <input
            type="number"
            step="0.1"
            min={0}
            placeholder="e.g. 22.9"
            value={form.interestRate}
            onChange={(e) => setField('interestRate', e.target.value)}
            className={inputCls}
          />
        </Field>
        <Field label="Credit Limit (£)">
          <input
            type="number"
            min={0}
            placeholder="e.g. 8000"
            value={form.creditLimit}
            onChange={(e) => setField('creditLimit', e.target.value)}
            className={inputCls}
          />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Promo / 0% APR (%)" hint="Leave blank if no promo rate">
          <input
            type="number"
            step="0.1"
            min={0}
            placeholder="e.g. 0"
            value={promoApr ?? ''}
            onChange={(e) =>
              setMeta('promoApr', e.target.value !== '' ? Number(e.target.value) : undefined)
            }
            className={inputCls}
          />
        </Field>
        <Field label="Promo End Date">
          <input
            type="date"
            value={form.typeMetadata.promoEndDate ?? ''}
            onChange={(e) => setMeta('promoEndDate', e.target.value || undefined)}
            className={inputCls}
          />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Min Payment (%)" hint="e.g. 2.5% of balance">
          <input
            type="number"
            step="0.1"
            min={0}
            placeholder="e.g. 2.5"
            value={form.typeMetadata.minPaymentPct ?? ''}
            onChange={(e) =>
              setMeta('minPaymentPct', e.target.value !== '' ? Number(e.target.value) : undefined)
            }
            className={inputCls}
          />
        </Field>
        <Field label="Min Payment Floor (£)" hint="e.g. £25 minimum">
          <input
            type="number"
            min={0}
            placeholder="e.g. 25"
            value={form.typeMetadata.minPaymentFloor ?? ''}
            onChange={(e) =>
              setMeta('minPaymentFloor', e.target.value !== '' ? Number(e.target.value) : undefined)
            }
            className={inputCls}
          />
        </Field>
      </div>
      <Field label="Statement Day" hint="Day of the month (1–28)">
        <input
          type="number"
          min={1}
          max={28}
          placeholder="e.g. 15"
          value={form.typeMetadata.statementDay ?? ''}
          onChange={(e) =>
            setMeta('statementDay', e.target.value !== '' ? Number(e.target.value) : undefined)
          }
          className={inputCls}
        />
      </Field>
    </div>
  );
};
