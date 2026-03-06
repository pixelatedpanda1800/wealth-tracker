export type Frequency = 'monthly' | 'annual';
export type OutgoingType = 'non-negotiable' | 'required' | 'optional' | 'savings';

export interface IncomeItem {
    id: string;
    name: string;
    category: string;
    amount: number;
}

export interface OutgoingItem {
    id: string;
    name: string;
    type: OutgoingType;
    frequency: Frequency;
    amount: number;
    paymentDate?: number | null;
    notes?: string | null;
    wealthSourceId?: string | null;
}

export interface BudgetData {
    incomes: IncomeItem[];
    outgoings: OutgoingItem[];
}
