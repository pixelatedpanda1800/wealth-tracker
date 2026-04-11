export type HoldingType = 'fund' | 'etf' | 'stock' | 'bond' | 'other';

export interface InvestmentHolding {
    id: string;
    name: string;
    ticker?: string;
    type: HoldingType;
    color?: string;
    wealthSourceId: string;
    wealthSource?: {
        id: string;
        name: string;
        category: string;
        color?: string;
    };
    createdAt: string;
    updatedAt: string;
}

export interface InvestmentSnapshot {
    id: string;
    holdingId: string;
    holding?: InvestmentHolding;
    year: number;
    month: string;
    units?: number;
    costBasis?: number;
    value: number;
    createdAt: string;
    updatedAt: string;
}

export const HOLDING_TYPE_LABELS: Record<HoldingType, string> = {
    fund: 'Fund',
    etf: 'ETF',
    stock: 'Stock',
    bond: 'Bond',
    other: 'Other',
};
