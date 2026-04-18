import { type Liability, type LiabilitySnapshot, type LiabilityOverpayment, latestSnapshot } from '../components/liabilities/types';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function toMonthKey(year: number, month: string): string {
    const idx = MONTH_NAMES.indexOf(month);
    return `${year}-${String(idx + 1).padStart(2, '0')}`;
}

function advanceMonth(year: number, month: string): { year: number; month: string } {
    const idx = MONTH_NAMES.indexOf(month);
    if (idx === 11) return { year: year + 1, month: 'Jan' };
    return { year, month: MONTH_NAMES[idx + 1] };
}

function keyToYearMonth(key: string): { year: number; month: string } {
    const [y, m] = key.split('-');
    return { year: Number(y), month: MONTH_NAMES[Number(m) - 1] };
}

export interface BurndownPoint {
    monthKey: string;
    projected: number;
}

// --- Per-type projection ---

function projectAmortising(opts: {
    balance: number;
    annualRatePct: number;
    monthlyPayment: number;
    recurringOverpayment?: number;
    monthlyOverrides?: Record<string, number>;
    startMonth: string;
    startYear: number;
    maxMonths?: number;
}): BurndownPoint[] {
    const { annualRatePct, monthlyPayment, recurringOverpayment = 0, monthlyOverrides = {}, maxMonths = 360 } = opts;
    const monthlyRate = annualRatePct / 100 / 12;
    let balance = opts.balance;
    let { year, month } = advanceMonth(opts.startYear, opts.startMonth);
    const series: BurndownPoint[] = [];

    for (let i = 0; i < maxMonths; i++) {
        const key = toMonthKey(year, month);
        const overpayment = key in monthlyOverrides ? monthlyOverrides[key] : recurringOverpayment;
        const interest = balance * monthlyRate;
        balance = balance + interest - (monthlyPayment + overpayment);
        series.push({ monthKey: key, projected: Math.max(0, balance) });
        if (balance <= 0) break;
        ({ year, month } = advanceMonth(year, month));
    }
    return series;
}

function projectRevolving(opts: {
    balance: number;
    annualRatePct: number;
    minPaymentPct: number;
    minPaymentFloor: number;
    recurringOverpayment?: number;
    monthlyOverrides?: Record<string, number>;
    promoApr?: number;
    promoEndDate?: string;
    startMonth: string;
    startYear: number;
    maxMonths?: number;
}): BurndownPoint[] {
    const { annualRatePct, minPaymentPct, minPaymentFloor, recurringOverpayment = 0, monthlyOverrides = {}, promoApr, promoEndDate, maxMonths = 360 } = opts;
    let balance = opts.balance;
    let { year, month } = advanceMonth(opts.startYear, opts.startMonth);
    const series: BurndownPoint[] = [];

    for (let i = 0; i < maxMonths; i++) {
        const key = toMonthKey(year, month);
        const promoActive = promoApr !== undefined && promoEndDate !== undefined && key <= promoEndDate.substring(0, 7);
        const rate = promoActive ? promoApr! / 100 / 12 : annualRatePct / 100 / 12;
        balance += balance * rate;
        const minPayment = Math.max(minPaymentFloor, (balance * minPaymentPct) / 100);
        const overpayment = key in monthlyOverrides ? monthlyOverrides[key] : recurringOverpayment;
        balance -= minPayment + overpayment;
        series.push({ monthKey: key, projected: Math.max(0, balance) });
        if (balance <= 0) break;
        ({ year, month } = advanceMonth(year, month));
    }
    return series;
}

function projectBnpl(opts: {
    balance: number;
    instalmentCount: number;
    instalmentsPaid: number;
    startMonth: string;
    startYear: number;
}): BurndownPoint[] {
    const { balance, instalmentCount, instalmentsPaid } = opts;
    const remaining = instalmentCount - instalmentsPaid;
    if (remaining <= 0) return [];
    const perInstalment = balance / remaining;
    let runningBalance = balance;
    let currentYear = opts.startYear;
    let currentMonth = opts.startMonth;
    const series: BurndownPoint[] = [];
    for (let i = 0; i < remaining; i++) {
        ({ year: currentYear, month: currentMonth } = advanceMonth(currentYear, currentMonth));
        runningBalance -= perInstalment;
        series.push({ monthKey: toMonthKey(currentYear, currentMonth), projected: Math.max(0, runningBalance) });
    }
    return series;
}

// --- Overpayment override map for a liability ---

function buildOverrideMap(overpayments: LiabilityOverpayment[], liabilityId: string): Record<string, number> {
    const map: Record<string, number> = {};
    for (const op of overpayments) {
        if (op.liabilityId === liabilityId) {
            map[toMonthKey(op.year, op.month)] = Number(op.amount);
        }
    }
    return map;
}

// --- Project a single liability forward from its latest snapshot ---

export function projectLiability(
    liability: Liability,
    snapshots: LiabilitySnapshot[],
    overpayments: LiabilityOverpayment[],
): BurndownPoint[] {
    const snap = latestSnapshot(snapshots, liability.id);
    if (!snap) return [];

    const balance = Number(snap.balance);
    if (balance <= 0) return [];

    const startYear = snap.year;
    const startMonth = snap.month;
    const monthlyOverrides = buildOverrideMap(overpayments, liability.id);
    const recurringOverpayment = liability.recurringOverpayment != null ? Number(liability.recurringOverpayment) : 0;
    const annualRatePct = liability.interestRate != null ? Number(liability.interestRate) : 0;
    const monthlyPayment = liability.monthlyPayment != null ? Number(liability.monthlyPayment) : 0;
    const meta = (liability.typeMetadata as Record<string, any>) ?? {};

    switch (liability.type) {
        case 'mortgage':
        case 'personal_loan':
        case 'car_loan': {
            if (liability.type === 'car_loan' && meta.subType === 'pcp' && meta.balloonPayment) {
                // PCP: amortise to balloon payment, then stops
                return projectAmortising({
                    balance,
                    annualRatePct,
                    monthlyPayment,
                    recurringOverpayment,
                    monthlyOverrides,
                    startMonth,
                    startYear,
                    maxMonths: 360,
                }).map(p => ({ ...p, projected: Math.max(Number(meta.balloonPayment), p.projected) }));
            }
            return projectAmortising({ balance, annualRatePct, monthlyPayment, recurringOverpayment, monthlyOverrides, startMonth, startYear });
        }
        case 'credit_card':
        case 'overdraft': {
            const minPaymentPct = meta.minPaymentPct ?? 2;
            const minPaymentFloor = meta.minPaymentFloor ?? 25;
            return projectRevolving({
                balance,
                annualRatePct,
                minPaymentPct,
                minPaymentFloor,
                recurringOverpayment,
                monthlyOverrides,
                promoApr: meta.promoApr,
                promoEndDate: meta.promoEndDate,
                startMonth,
                startYear,
            });
        }
        case 'bnpl': {
            const instalmentCount = meta.instalmentCount ?? 3;
            const instalmentsPaid = meta.instalmentsPaid ?? 0;
            return projectBnpl({ balance, instalmentCount, instalmentsPaid, startMonth, startYear });
        }
        case 'student_loan':
        case 'tax_owed':
        case 'family_loan':
        case 'other':
        default:
            // Flat projection — shown as-is without burndown maths
            return [];
    }
}

// --- Scope types ---

export type BurndownScope = 'all' | 'secured' | 'unsecured' | string; // string for a specific liability id

// --- Aggregated chart data ---

export interface ChartPoint {
    monthKey: string;
    actual: number | null;
    projected: number;
    byLiability: Record<string, number>;
}

function isoYM(year: number, month: string) {
    return toMonthKey(year, month);
}

/**
 * Builds the combined burndown series for the chart.
 * - actual: sum of latest balances from snapshots up to current month
 * - projected: forward projection from latest snapshot per liability
 * - byLiability: per-liability balance at each point (for stacked view)
 */
export function buildBurndownSeries(
    liabilities: Liability[],
    snapshots: LiabilitySnapshot[],
    overpayments: LiabilityOverpayment[],
    scope: BurndownScope = 'all',
): ChartPoint[] {
    const now = new Date();
    const currentKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // Filter liabilities by scope
    const filtered = liabilities.filter(l => {
        if (l.archivedAt) return false;
        if (scope === 'all') return true;
        if (scope === 'secured') return ['mortgage', 'car_loan'].includes(l.type);
        if (scope === 'unsecured') return !['mortgage', 'car_loan'].includes(l.type);
        return l.id === scope;
    });

    // Collect all month keys that appear in snapshots for filtered liabilities
    const snapshotKeys = new Set<string>();
    for (const s of snapshots) {
        if (filtered.some(l => l.id === s.liabilityId)) {
            snapshotKeys.add(isoYM(s.year, s.month));
        }
    }

    // Build actual history: for each historical month key, sum latest balance per liability up to that point
    // We collect all unique snapshot months, sort them, and for each compute total
    const sortedSnapshotKeys = Array.from(snapshotKeys).sort();

    const actualPoints: ChartPoint[] = sortedSnapshotKeys.map(key => {
        const byLiability: Record<string, number> = {};
        let total = 0;
        for (const l of filtered) {
            const { year, month } = keyToYearMonth(key);
            const snapsAtOrBefore = snapshots.filter(s =>
                s.liabilityId === l.id &&
                isoYM(s.year, s.month) <= key
            );
            if (snapsAtOrBefore.length === 0) continue;
            snapsAtOrBefore.sort((a, b) => isoYM(a.year, a.month).localeCompare(isoYM(b.year, b.month)));
            const latest = snapsAtOrBefore[snapsAtOrBefore.length - 1];
            const bal = Number(latest.balance);
            byLiability[l.id] = bal;
            total += bal;
        }
        return {
            monthKey: key,
            actual: key <= currentKey ? total : null,
            projected: total,
            byLiability,
        };
    });

    // Build projected series from latest snapshot per liability
    const projectionsByLiability: Record<string, BurndownPoint[]> = {};
    for (const l of filtered) {
        projectionsByLiability[l.id] = projectLiability(l, snapshots, overpayments);
    }

    // Collect all projection month keys
    const projectionKeys = new Set<string>();
    for (const pts of Object.values(projectionsByLiability)) {
        for (const p of pts) projectionKeys.add(p.monthKey);
    }

    // For each projected month key, sum up per-liability projected values
    // Use the latest known balance (from actual) as baseline; projections extend forward
    const latestActualByLiability: Record<string, number> = {};
    for (const l of filtered) {
        const snap = latestSnapshot(snapshots, l.id);
        latestActualByLiability[l.id] = snap ? Number(snap.balance) : 0;
    }

    const sortedProjectionKeys = Array.from(projectionKeys)
        .filter(k => k > currentKey)
        .sort();

    const projectedPoints: ChartPoint[] = sortedProjectionKeys.map(key => {
        const byLiability: Record<string, number> = {};
        let total = 0;
        for (const l of filtered) {
            const pts = projectionsByLiability[l.id];
            const match = pts.find(p => p.monthKey === key);
            // If no projection data for this month and the key is beyond projection end, use 0
            const lastProjKey = pts.length > 0 ? pts[pts.length - 1].monthKey : null;
            let bal: number;
            if (match) {
                bal = match.projected;
            } else if (lastProjKey && key > lastProjKey) {
                bal = 0;
            } else {
                bal = latestActualByLiability[l.id] ?? 0;
            }
            byLiability[l.id] = bal;
            total += bal;
        }
        return { monthKey: key, actual: null, projected: total, byLiability };
    });

    // Merge actual and projected, deduplicating the current month (use actual if both exist)
    const allKeys = new Set([...sortedSnapshotKeys, ...sortedProjectionKeys]);
    const merged: ChartPoint[] = Array.from(allKeys).sort().map(key => {
        const a = actualPoints.find(p => p.monthKey === key);
        const p = projectedPoints.find(pt => pt.monthKey === key);
        if (a && p) return { ...a, projected: p.projected, byLiability: { ...p.byLiability, ...a.byLiability } };
        return a ?? p!;
    });

    return merged;
}

/** Returns the first month key where projected balance reaches 0, or null */
export function debtFreeDate(series: ChartPoint[]): string | null {
    const pt = series.find(p => p.projected === 0);
    return pt?.monthKey ?? null;
}

/** Formats a YYYY-MM key as "Jan 2026" */
export function formatMonthKey(key: string): string {
    const { year, month } = keyToYearMonth(key);
    return `${month} ${year}`;
}
