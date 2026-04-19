export type LiabilityType =
    | 'mortgage'
    | 'personal_loan'
    | 'car_loan'
    | 'credit_card'
    | 'student_loan'
    | 'overdraft'
    | 'bnpl'
    | 'tax_owed'
    | 'family_loan'
    | 'other';

export interface Property {
    id: string;
    name: string;
    estimatedValue?: number;
    valuationDate?: string;
    notes?: string;
    createdAt: string;
    updatedAt: string;
}

export interface Liability {
    id: string;
    name: string;
    type: LiabilityType;
    propertyId?: string;
    property?: Property;
    currency: string;
    startDate?: string;
    originalPrincipal?: number;
    interestRate?: number;
    monthlyPayment?: number;
    recurringOverpayment?: number;
    creditLimit?: number;
    termMonths?: number;
    endDate?: string;
    typeMetadata: Record<string, any>;
    color?: string;
    notes?: string;
    archivedAt?: string;
    createdAt: string;
    updatedAt: string;
}

export interface LiabilitySnapshot {
    id: string;
    liabilityId: string;
    year: number;
    month: string;
    balance: number;
    interestPaid?: number;
    paymentMade?: number;
    createdAt: string;
    updatedAt: string;
}

export interface LiabilityOverpayment {
    id: string;
    liabilityId: string;
    year: number;
    month: string;
    amount: number;
    createdAt: string;
    updatedAt: string;
}

export const LIABILITY_TYPE_LABELS: Record<LiabilityType, string> = {
    mortgage: 'Mortgage',
    personal_loan: 'Personal Loan',
    car_loan: 'Car Loan / PCP',
    credit_card: 'Credit Card',
    student_loan: 'Student Loan',
    overdraft: 'Overdraft',
    bnpl: 'Buy Now Pay Later',
    tax_owed: 'Tax Owed',
    family_loan: 'Family / IOU',
    other: 'Other',
};

export const LIABILITY_TYPE_DESCRIPTIONS: Record<LiabilityType, string> = {
    mortgage: 'Fixed / variable / tracker rate, linked to a property',
    personal_loan: 'Fixed-term amortising loan with regular payments',
    car_loan: 'HP, PCP (with balloon), or straight loan',
    credit_card: 'Revolving credit — APR, promo rate, min payments',
    student_loan: 'UK plan 1/2/4/5 or postgrad — income-contingent',
    overdraft: 'Arranged overdraft facility — high APR, revolving',
    bnpl: 'Klarna, Clearpay or similar instalment plan',
    tax_owed: 'HMRC self-assessment or other tax liability',
    family_loan: 'Informal IOU — usually interest-free',
    other: 'Anything else with a balance and optional rate',
};

export function isSecured(type: LiabilityType): boolean {
    return type === 'mortgage' || type === 'car_loan';
}

export function latestSnapshot(
    snapshots: LiabilitySnapshot[],
    liabilityId: string,
): LiabilitySnapshot | undefined {
    return snapshots
        .filter(s => s.liabilityId === liabilityId)
        .sort((a, b) => b.year - a.year || b.month.localeCompare(a.month))
    [0];
}

export function totalOutstanding(liabilities: Liability[], snapshots: LiabilitySnapshot[]): number {
    return liabilities
        .filter(l => !l.archivedAt)
        .reduce((sum, l) => {
            const snap = latestSnapshot(snapshots, l.id);
            return sum + (snap ? Number(snap.balance) : 0);
        }, 0);
}
