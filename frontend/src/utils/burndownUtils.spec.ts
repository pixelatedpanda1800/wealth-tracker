import { describe, it, expect } from 'vitest';
import { buildBurndownSeries, debtFreeDate, projectLiability } from './burndownUtils';
import type { Liability, LiabilitySnapshot, LiabilityOverpayment } from '../components/liabilities/types';

// --- helpers ---

function makeSnap(overrides: Partial<LiabilitySnapshot> = {}): LiabilitySnapshot {
    return {
        id: 's1',
        liabilityId: 'l1',
        year: 2025,
        month: 'Jan',
        balance: 100000,
        createdAt: '',
        updatedAt: '',
        ...overrides,
    };
}

function makeLiability(overrides: Partial<Liability> = {}): Liability {
    return {
        id: 'l1',
        name: 'Test',
        type: 'personal_loan',
        currency: 'GBP',
        interestRate: 5,
        monthlyPayment: 1000,
        typeMetadata: {},
        createdAt: '',
        updatedAt: '',
        ...overrides,
    };
}

// --- amortising projection (via projectLiability) ---

describe('projectLiability — amortising', () => {
    it('reaches zero balance', () => {
        const l = makeLiability({ interestRate: 5, monthlyPayment: 1000 });
        const snaps = [makeSnap({ balance: 10000 })];
        const pts = projectLiability(l, snaps, []);
        const last = pts[pts.length - 1];
        expect(last.projected).toBe(0);
    });

    it('overpayment shortens the term', () => {
        const base = makeLiability({ interestRate: 5, monthlyPayment: 500 });
        const withExtra = makeLiability({ interestRate: 5, monthlyPayment: 500, recurringOverpayment: 500 });
        const snaps = [makeSnap({ balance: 20000 })];
        const baseLen = projectLiability(base, snaps, []).length;
        const extraLen = projectLiability(withExtra, snaps, []).length;
        expect(extraLen).toBeLessThan(baseLen);
    });

    it('per-month override takes precedence over recurring', () => {
        const l = makeLiability({
            interestRate: 5,
            monthlyPayment: 500,
            recurringOverpayment: 1000,
        });
        const snaps = [makeSnap({ balance: 5000, year: 2025, month: 'Jan' })];
        // Override Feb 2025 to £0 overpayment
        const overrides: LiabilityOverpayment[] = [{
            id: 'op1',
            liabilityId: 'l1',
            year: 2025,
            month: 'Feb',
            amount: 0,
            createdAt: '',
            updatedAt: '',
        }];
        // With recurring=1000, first month projected balance is lower than with recurring=0
        const withRecurring = projectLiability(l, snaps, []);
        const withOverride = projectLiability(l, snaps, overrides);
        // Feb balance with override (0 overpayment) should be HIGHER than with recurring (1000)
        const febWithRecurring = withRecurring.find(p => p.monthKey === '2025-02');
        const febWithOverride = withOverride.find(p => p.monthKey === '2025-02');
        expect(febWithOverride!.projected).toBeGreaterThan(febWithRecurring!.projected);
    });

    it('handles 0% interest correctly', () => {
        const l = makeLiability({ interestRate: 0, monthlyPayment: 500 });
        const snaps = [makeSnap({ balance: 5000 })];
        const pts = projectLiability(l, snaps, []);
        // At 0% interest, 5000 / 500 = 10 months
        expect(pts.length).toBe(10);
        expect(pts[pts.length - 1].projected).toBe(0);
    });

    it('returns empty array when no snapshot exists', () => {
        const l = makeLiability();
        const pts = projectLiability(l, [], []);
        expect(pts).toHaveLength(0);
    });
});

// --- revolving projection ---

describe('projectLiability — revolving (credit_card)', () => {
    it('converges to zero with sufficient overpayment', () => {
        const l = makeLiability({
            type: 'credit_card',
            interestRate: 20,
            recurringOverpayment: 500,
            typeMetadata: { minPaymentPct: 2, minPaymentFloor: 25 },
        });
        const snaps = [makeSnap({ balance: 5000 })];
        const pts = projectLiability(l, snaps, []);
        expect(pts[pts.length - 1].projected).toBe(0);
    });

    it('caps at 360 months when minimum payment is insufficient', () => {
        // Very low payment relative to high balance and rate — should hit the 360-month cap
        const l = makeLiability({
            type: 'credit_card',
            interestRate: 39.9,
            recurringOverpayment: 0,
            typeMetadata: { minPaymentPct: 1, minPaymentFloor: 5 },
        });
        const snaps = [makeSnap({ balance: 50000 })];
        const pts = projectLiability(l, snaps, []);
        expect(pts.length).toBe(360);
        expect(pts[359].projected).toBeGreaterThan(0);
    });

    it('respects promo APR during promo period', () => {
        // Promo APR of 0% for 12 months — balance should not grow during promo period
        const l = makeLiability({
            type: 'credit_card',
            interestRate: 30,
            recurringOverpayment: 0,
            typeMetadata: {
                minPaymentPct: 2,
                minPaymentFloor: 25,
                promoApr: 0,
                promoEndDate: '2026-01-31',
            },
        });
        const snaps = [makeSnap({ balance: 2000, year: 2025, month: 'Jan' })];
        const pts = projectLiability(l, snaps, []);
        // During promo at 0% APR, balance should only decrease (no interest added)
        const promoPoint = pts.find(p => p.monthKey === '2025-06');
        const postPromoPoint = pts.find(p => p.monthKey === '2026-03');
        expect(promoPoint).toBeDefined();
        if (promoPoint && postPromoPoint) {
            // After promo ends, balance should be declining more slowly due to interest
            expect(promoPoint.projected).toBeLessThan(2000);
        }
    });
});

// --- BNPL projection ---

describe('projectLiability — bnpl', () => {
    it('reaches zero over remaining instalments', () => {
        const l = makeLiability({
            type: 'bnpl',
            typeMetadata: { instalmentCount: 6, instalmentsPaid: 0 },
        });
        const snaps = [makeSnap({ balance: 600 })];
        const pts = projectLiability(l, snaps, []);
        expect(pts.length).toBe(6);
        expect(pts[pts.length - 1].projected).toBe(0);
    });

    it('accounts for already-paid instalments', () => {
        const l = makeLiability({
            type: 'bnpl',
            typeMetadata: { instalmentCount: 6, instalmentsPaid: 3 },
        });
        const snaps = [makeSnap({ balance: 300 })];
        const pts = projectLiability(l, snaps, []);
        expect(pts.length).toBe(3);
        expect(pts[pts.length - 1].projected).toBe(0);
    });

    it('returns empty array when all instalments paid', () => {
        const l = makeLiability({
            type: 'bnpl',
            typeMetadata: { instalmentCount: 4, instalmentsPaid: 4 },
        });
        const snaps = [makeSnap({ balance: 0 })];
        const pts = projectLiability(l, snaps, []);
        expect(pts).toHaveLength(0);
    });
});

// --- buildBurndownSeries + debtFreeDate ---

describe('buildBurndownSeries', () => {
    it('returns actual data for snapshot months', () => {
        const l = makeLiability();
        const snaps = [makeSnap({ balance: 10000, year: 2024, month: 'Dec' })];
        const series = buildBurndownSeries([l], snaps, [], 'all');
        const dec = series.find(p => p.monthKey === '2024-12');
        expect(dec).toBeDefined();
        expect(dec!.actual).toBe(10000);
    });

    it('filters by secured scope', () => {
        const mortgage = makeLiability({ id: 'm1', type: 'mortgage' });
        const card = makeLiability({ id: 'c1', type: 'credit_card', interestRate: 20, typeMetadata: { minPaymentPct: 2, minPaymentFloor: 25 } });
        const snaps = [
            makeSnap({ id: 'sm', liabilityId: 'm1', balance: 200000 }),
            makeSnap({ id: 'sc', liabilityId: 'c1', balance: 5000 }),
        ];
        const secured = buildBurndownSeries([mortgage, card], snaps, [], 'secured');
        // The first point should only include the mortgage balance
        const jan = secured.find(p => p.monthKey === '2025-01');
        expect(jan!.actual).toBe(200000);
    });

    it('debtFreeDate returns month where projected hits 0', () => {
        const now = new Date();
        const year = now.getFullYear();
        const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        const month = MONTHS[now.getMonth()];
        // At 0% interest, 2000 / 1000 = 2 months from snapshot month
        const l = makeLiability({ interestRate: 0, monthlyPayment: 1000 });
        const snaps = [makeSnap({ balance: 2000, year, month })];
        const series = buildBurndownSeries([l], snaps, [], 'all');
        const free = debtFreeDate(series);
        expect(free).not.toBeNull();
        // Should be 2 months after the snapshot month
        const m1idx = now.getMonth() + 2;
        const expectedYear = m1idx >= 12 ? year + 1 : year;
        const expectedMonth = m1idx >= 12 ? m1idx - 12 : m1idx;
        const expected = `${expectedYear}-${String(expectedMonth + 1).padStart(2, '0')}`;
        expect(free).toBe(expected);
    });

    it('debtFreeDate returns null for unprojectable types (student_loan)', () => {
        const l = makeLiability({ type: 'student_loan' });
        const snaps = [makeSnap({ balance: 30000 })];
        const series = buildBurndownSeries([l], snaps, [], 'all');
        // student_loan returns no projection points, so projected never hits 0
        const free = debtFreeDate(series);
        expect(free).toBeNull();
    });
});
