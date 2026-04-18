import { projectAmortising, projectRevolving, projectBnpl } from './burndown.service';

describe('projectAmortising', () => {
  it('reaches zero before term end with standard inputs', () => {
    const series = projectAmortising({
      balance: 200_000,
      annualRatePct: 2.19,
      monthlyPayment: 900,
      startMonth: 'Jan',
      startYear: 2025,
    });
    const lastPoint = series[series.length - 1];
    expect(lastPoint.projected).toBeLessThanOrEqual(0);
  });

  it('terminates in roughly the correct number of months', () => {
    // £10 000 at 5% APR, £200/mo → ~57 months
    const series = projectAmortising({
      balance: 10_000,
      annualRatePct: 5,
      monthlyPayment: 200,
      startMonth: 'Jan',
      startYear: 2025,
    });
    expect(series.length).toBeGreaterThan(50);
    expect(series.length).toBeLessThan(70);
  });

  it('overpayment shortens the debt-free date', () => {
    const noOverpay = projectAmortising({
      balance: 10_000,
      annualRatePct: 5,
      monthlyPayment: 200,
      startMonth: 'Jan',
      startYear: 2025,
    });
    const withOverpay = projectAmortising({
      balance: 10_000,
      annualRatePct: 5,
      monthlyPayment: 200,
      recurringOverpayment: 100,
      startMonth: 'Jan',
      startYear: 2025,
    });
    expect(withOverpay.length).toBeLessThan(noOverpay.length);
  });

  it('per-month override takes precedence over recurring', () => {
    // Set £500/mo recurring, but override the first projected month (Feb 2025) to £0
    // Balance after that month should be higher with the override than without
    const overrides: Record<string, number> = { '2025-02': 0 };
    const withOverride = projectAmortising({
      balance: 10_000,
      annualRatePct: 5,
      monthlyPayment: 200,
      recurringOverpayment: 500,
      monthlyOverrides: overrides,
      startMonth: 'Jan',
      startYear: 2025,
    });
    const withoutOverride = projectAmortising({
      balance: 10_000,
      annualRatePct: 5,
      monthlyPayment: 200,
      recurringOverpayment: 500,
      startMonth: 'Jan',
      startYear: 2025,
    });
    // Month 1 balance should be higher when override dropped the payment to £0
    expect(withOverride[0].projected).toBeGreaterThan(withoutOverride[0].projected);
  });

  it('handles 0% interest correctly (no interest accrual)', () => {
    const series = projectAmortising({
      balance: 1_200,
      annualRatePct: 0,
      monthlyPayment: 100,
      startMonth: 'Jan',
      startYear: 2025,
    });
    expect(series.length).toBe(12);
    expect(series[series.length - 1].projected).toBeCloseTo(0, 1);
  });
});

describe('projectRevolving (credit card)', () => {
  it('converges to zero eventually', () => {
    const series = projectRevolving({
      balance: 3_000,
      annualRatePct: 22.9,
      minPaymentPct: 2.5,
      minPaymentFloor: 25,
      startMonth: 'Jan',
      startYear: 2025,
    });
    const lastPoint = series[series.length - 1];
    expect(lastPoint.projected).toBeLessThanOrEqual(0.01);
  });

  it('caps projection at 360 months', () => {
    // Tiny balance / high rate / minimum only — very slow to clear
    const series = projectRevolving({
      balance: 10_000,
      annualRatePct: 39.9,
      minPaymentPct: 1,
      minPaymentFloor: 5,
      startMonth: 'Jan',
      startYear: 2025,
    });
    expect(series.length).toBeLessThanOrEqual(360);
  });

  it('respects promo APR period (0% until promoEndDate)', () => {
    const series = projectRevolving({
      balance: 1_000,
      annualRatePct: 22.9,
      minPaymentPct: 2.5,
      minPaymentFloor: 25,
      promoApr: 0,
      promoEndDate: '2025-06-30',
      startMonth: 'Jan',
      startYear: 2025,
    });
    // During promo months (Jan–Jun) balance should drop faster
    // Balance after 6 months should be lower than it would be at 22.9%
    const seriesWithoutPromo = projectRevolving({
      balance: 1_000,
      annualRatePct: 22.9,
      minPaymentPct: 2.5,
      minPaymentFloor: 25,
      startMonth: 'Jan',
      startYear: 2025,
    });
    expect(series[5].projected).toBeLessThan(seriesWithoutPromo[5].projected);
  });
});

describe('projectBnpl', () => {
  it('reaches zero at the final instalment', () => {
    const series = projectBnpl({
      balance: 300,
      instalmentCount: 3,
      instalmentsPaid: 0,
      startMonth: 'Jan',
      startYear: 2025,
    });
    expect(series.length).toBe(3);
    expect(series[2].projected).toBeCloseTo(0, 1);
  });

  it('accounts for already-paid instalments', () => {
    const series = projectBnpl({
      balance: 200,
      instalmentCount: 3,
      instalmentsPaid: 1,
      startMonth: 'Jan',
      startYear: 2025,
    });
    expect(series.length).toBe(2);
  });
});
