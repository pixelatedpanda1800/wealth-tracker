const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function monthKey(year: number, month: string): string {
  const idx = MONTH_NAMES.indexOf(month);
  return `${year}-${String(idx + 1).padStart(2, '0')}`;
}

function advanceMonth(year: number, month: string): { year: number; month: string } {
  const idx = MONTH_NAMES.indexOf(month);
  if (idx === 11) return { year: year + 1, month: 'Jan' };
  return { year, month: MONTH_NAMES[idx + 1] };
}

export interface BurndownPoint {
  monthKey: string; // 'YYYY-MM'
  projected: number;
}

export interface AmorisingOptions {
  balance: number;
  annualRatePct: number;
  monthlyPayment: number;
  recurringOverpayment?: number;
  /** Keys are 'YYYY-MM', values override the overpayment for that month */
  monthlyOverrides?: Record<string, number>;
  startMonth: string;
  startYear: number;
  /** Cap at this many months (default: 360) */
  maxMonths?: number;
}

/**
 * Projects an amortising loan balance forward month by month.
 * Returns a series from the month after startMonth until balance hits 0 (or maxMonths).
 * Overpayment resolution: monthlyOverrides[key] → recurringOverpayment → 0
 */
export function projectAmortising(opts: AmorisingOptions): BurndownPoint[] {
  const {
    annualRatePct,
    monthlyPayment,
    recurringOverpayment = 0,
    monthlyOverrides = {},
    maxMonths = 360,
  } = opts;

  const monthlyRate = annualRatePct / 100 / 12;
  let balance = opts.balance;
  let { year, month } = advanceMonth(opts.startYear, opts.startMonth);
  const series: BurndownPoint[] = [];

  for (let i = 0; i < maxMonths; i++) {
    const key = monthKey(year, month);
    const overpayment = key in monthlyOverrides ? monthlyOverrides[key] : recurringOverpayment;
    const interest = balance * monthlyRate;
    const totalPayment = monthlyPayment + overpayment;
    balance = balance + interest - totalPayment;

    series.push({ monthKey: key, projected: Math.max(0, balance) });

    if (balance <= 0) break;
    ({ year, month } = advanceMonth(year, month));
  }

  return series;
}

export interface RevolvingOptions {
  balance: number;
  annualRatePct: number;
  minPaymentPct: number;
  minPaymentFloor: number;
  recurringOverpayment?: number;
  monthlyOverrides?: Record<string, number>;
  promoApr?: number;
  promoEndDate?: string; // 'YYYY-MM-DD'
  startMonth: string;
  startYear: number;
  maxMonths?: number;
}

/**
 * Projects a revolving balance (credit card / overdraft).
 * Payment = max(minFloor, balance * minPct%) + overpayment.
 * Respects promo APR until promoEndDate, then switches to annualRatePct.
 */
export function projectRevolving(opts: RevolvingOptions): BurndownPoint[] {
  const {
    annualRatePct,
    minPaymentPct,
    minPaymentFloor,
    recurringOverpayment = 0,
    monthlyOverrides = {},
    promoApr,
    promoEndDate,
    maxMonths = 360,
  } = opts;

  let balance = opts.balance;
  let { year, month } = advanceMonth(opts.startYear, opts.startMonth);
  const series: BurndownPoint[] = [];

  for (let i = 0; i < maxMonths; i++) {
    const key = monthKey(year, month);

    const promoActive =
      promoApr !== undefined &&
      promoEndDate !== undefined &&
      key <= promoEndDate.substring(0, 7);

    const rate = promoActive ? promoApr! / 100 / 12 : annualRatePct / 100 / 12;
    const interest = balance * rate;
    balance += interest;

    const minPayment = Math.max(minPaymentFloor, (balance * minPaymentPct) / 100);
    const overpayment = key in monthlyOverrides ? monthlyOverrides[key] : recurringOverpayment;
    balance -= minPayment + overpayment;

    series.push({ monthKey: key, projected: Math.max(0, balance) });

    if (balance <= 0) break;
    ({ year, month } = advanceMonth(year, month));
  }

  return series;
}

export interface BnplOptions {
  balance: number;
  instalmentCount: number;
  instalmentsPaid: number;
  startMonth: string;
  startYear: number;
}

/**
 * Projects a BNPL balance as a straight-line reduction over remaining instalments.
 */
export function projectBnpl(opts: BnplOptions): BurndownPoint[] {
  const { balance, instalmentCount, instalmentsPaid, startYear } = opts;
  let { startMonth } = opts;
  let year = startYear;

  const remaining = instalmentCount - instalmentsPaid;
  if (remaining <= 0) return [];

  const perInstalment = balance / remaining;
  let runningBalance = balance;
  const series: BurndownPoint[] = [];

  let currentMonth = startMonth;
  let currentYear = year;

  for (let i = 0; i < remaining; i++) {
    const next = advanceMonth(currentYear, currentMonth);
    currentYear = next.year;
    currentMonth = next.month;
    runningBalance -= perInstalment;
    series.push({
      monthKey: monthKey(currentYear, currentMonth),
      projected: Math.max(0, runningBalance),
    });
  }

  return series;
}
