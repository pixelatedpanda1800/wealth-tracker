import axios from 'axios';
import type { WealthEntry } from './utils/dataUtils';

export interface WealthSource {
    id: string;
    name: string;
    category: 'investment' | 'cash' | 'pension';
    color?: string;
}

const API_URL = '/api';

const api = axios.create({
    baseURL: API_URL,
});

export const getWealthSnapshots = async (): Promise<WealthEntry[]> => {
    const response = await api.get<WealthEntry[]>('/wealth');
    return response.data;
};

export const saveWealthSnapshot = async (data: WealthEntry): Promise<WealthEntry> => {
    const response = await api.post<WealthEntry>('/wealth', data);
    return response.data;
};

export const getWealthSources = async (): Promise<WealthSource[]> => {
    const response = await api.get<WealthSource[]>('/wealth/sources');
    return response.data;
};

export const createWealthSource = async (data: { name: string; category: string; color?: string }): Promise<WealthSource> => {
    const response = await api.post<WealthSource>('/wealth/sources', data);
    return response.data;
};

export const updateWealthSource = async (id: string, data: Partial<WealthSource>): Promise<WealthSource> => {
    const response = await api.patch<WealthSource>(`/wealth/sources/${id}`, data);
    return response.data;
};

export const deleteWealthSource = async (id: string): Promise<void> => {
    await api.delete(`/wealth/sources/${id}`);
};

// === BACKUP API ===

export interface BackupData {
    version: number;
    timestamp: string;
    data: any;
}

export const exportFullBackup = async (): Promise<BackupData> => {
    const response = await api.get<BackupData>('/backup/export');
    return response.data;
};

export const importFullBackup = async (data: BackupData): Promise<{ success: boolean; message: string }> => {
    const response = await api.post<{ success: boolean; message: string }>('/backup/import', data);
    return response.data;
};

export const canRevertBackup = async (): Promise<boolean> => {
    const response = await api.get<{ canRevert: boolean }>('/backup/can-revert');
    return response.data.canRevert;
};

export const revertBackup = async (): Promise<{ success: boolean; message: string }> => {
    const response = await api.post<{ success: boolean; message: string }>('/backup/revert');
    return response.data;
};

// === BUDGET API ===

export type OutgoingType = 'non-negotiable' | 'required' | 'optional' | 'savings';
export type Frequency = 'monthly' | 'annual';

export interface IncomeSource {
    id: string;
    name: string;
    category: string;
    amount: number;
}

export interface OutgoingSource {
    id: string;
    name: string;
    type: OutgoingType;
    frequency: Frequency;
    amount: number;
    paymentDate?: number | null;
    notes?: string | null;
    wealthSourceId?: string | null;
}

// Incomes
export const getIncomes = async (): Promise<IncomeSource[]> => {
    const response = await api.get<IncomeSource[]>('/budget/incomes');
    return response.data;
};

export const createIncome = async (data: Omit<IncomeSource, 'id'>): Promise<IncomeSource> => {
    const response = await api.post<IncomeSource>('/budget/incomes', data);
    return response.data;
};

export const updateIncome = async (id: string, data: Partial<Omit<IncomeSource, 'id'>>): Promise<IncomeSource> => {
    const response = await api.put<IncomeSource>(`/budget/incomes/${id}`, data);
    return response.data;
};

export const deleteIncome = async (id: string): Promise<void> => {
    await api.delete(`/budget/incomes/${id}`);
};

// Outgoings
export const getOutgoings = async (): Promise<OutgoingSource[]> => {
    const response = await api.get<OutgoingSource[]>('/budget/outgoings');
    return response.data;
};

export const createOutgoing = async (data: Omit<OutgoingSource, 'id'>): Promise<OutgoingSource> => {
    const response = await api.post<OutgoingSource>('/budget/outgoings', data);
    return response.data;
};

export const updateOutgoing = async (id: string, data: Partial<Omit<OutgoingSource, 'id'>>): Promise<OutgoingSource> => {
    const response = await api.put<OutgoingSource>(`/budget/outgoings/${id}`, data);
    return response.data;
};

export const deleteOutgoing = async (id: string): Promise<void> => {
    await api.delete(`/budget/outgoings/${id}`);
};
// Accounts
export type AccountCategory = 'investment' | 'spending' | 'saving' | 'outgoings';

export interface Account {
    id: string;
    name: string;
    category: AccountCategory;
    color?: string;
    allocatedAmount: number;
}

export const getAccounts = async (): Promise<Account[]> => {
    const response = await api.get<Account[]>('/budget/accounts');
    return response.data;
};

export const createAccount = async (data: Omit<Account, 'id'>): Promise<Account> => {
    const response = await api.post<Account>('/budget/accounts', data);
    return response.data;
};

export const updateAccount = async (id: string, data: Partial<Omit<Account, 'id'>>): Promise<Account> => {
    const response = await api.put<Account>(`/budget/accounts/${id}`, data);
    return response.data;
};

export const deleteAccount = async (id: string): Promise<void> => {
    await api.delete(`/budget/accounts/${id}`);
};

export interface Allocation {
    id: string;
    description: string;
    amount: number;
    accountId: string;
    account?: Account;
}

export const getAllocations = async (): Promise<Allocation[]> => {
    const response = await api.get<Allocation[]>('/budget/allocations');
    return response.data;
};

export const createAllocation = async (data: Omit<Allocation, 'id' | 'account'>): Promise<Allocation> => {
    const response = await api.post<Allocation>('/budget/allocations', data);
    return response.data;
};

export const updateAllocation = async (id: string, data: Partial<Omit<Allocation, 'id' | 'account'>>): Promise<Allocation> => {
    const response = await api.put<Allocation>(`/budget/allocations/${id}`, data);
    return response.data;
};

export const deleteAllocation = async (id: string): Promise<void> => {
    await api.delete(`/budget/allocations/${id}`);
};

// === INVESTMENTS API ===

import type { InvestmentHolding, InvestmentSnapshot, HoldingType } from './components/investments/types';
export type { InvestmentHolding, InvestmentSnapshot, HoldingType };

export const getInvestmentHoldings = async (): Promise<InvestmentHolding[]> => {
    const response = await api.get<InvestmentHolding[]>('/investments/holdings');
    return response.data;
};

export const createInvestmentHolding = async (data: {
    name: string;
    ticker?: string;
    type: HoldingType;
    color?: string;
    wealthSourceId: string;
}): Promise<InvestmentHolding> => {
    const response = await api.post<InvestmentHolding>('/investments/holdings', data);
    return response.data;
};

export const updateInvestmentHolding = async (id: string, data: Partial<{
    name: string;
    ticker: string;
    type: HoldingType;
    color: string;
    wealthSourceId: string;
}>): Promise<InvestmentHolding> => {
    const response = await api.put<InvestmentHolding>(`/investments/holdings/${id}`, data);
    return response.data;
};

export const deleteInvestmentHolding = async (id: string): Promise<void> => {
    await api.delete(`/investments/holdings/${id}`);
};

export const getInvestmentSnapshots = async (holdingId?: string): Promise<InvestmentSnapshot[]> => {
    const params = holdingId ? { holdingId } : {};
    const response = await api.get<InvestmentSnapshot[]>('/investments/snapshots', { params });
    return response.data;
};

export const saveInvestmentSnapshot = async (data: {
    holdingId: string;
    year: number;
    month: string;
    value: number;
    units?: number;
    costBasis?: number;
}): Promise<InvestmentSnapshot> => {
    const response = await api.post<InvestmentSnapshot>('/investments/snapshots', data);
    return response.data;
};

export const deleteInvestmentSnapshot = async (id: string): Promise<void> => {
    await api.delete(`/investments/snapshots/${id}`);
};

// === LIABILITIES API ===

import type {
    Property,
    Liability,
    LiabilitySnapshot,
    LiabilityOverpayment,
} from './components/liabilities/types';
export type { Property, Liability, LiabilitySnapshot, LiabilityOverpayment };

// Properties
export const getProperties = async (): Promise<Property[]> => {
    const response = await api.get<Property[]>('/liabilities/properties');
    return response.data;
};

export const createProperty = async (data: Omit<Property, 'id' | 'createdAt' | 'updatedAt'>): Promise<Property> => {
    const response = await api.post<Property>('/liabilities/properties', data);
    return response.data;
};

export const updateProperty = async (id: string, data: Partial<Omit<Property, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Property> => {
    const response = await api.put<Property>(`/liabilities/properties/${id}`, data);
    return response.data;
};

export const deleteProperty = async (id: string): Promise<void> => {
    await api.delete(`/liabilities/properties/${id}`);
};

// Liabilities
export const getLiabilities = async (): Promise<Liability[]> => {
    const response = await api.get<Liability[]>('/liabilities');
    return response.data;
};

export const createLiability = async (data: Omit<Liability, 'id' | 'property' | 'createdAt' | 'updatedAt'>): Promise<Liability> => {
    const response = await api.post<Liability>('/liabilities', data);
    return response.data;
};

export const updateLiability = async (id: string, data: Partial<Omit<Liability, 'id' | 'property' | 'createdAt' | 'updatedAt'>>): Promise<Liability> => {
    const response = await api.put<Liability>(`/liabilities/${id}`, data);
    return response.data;
};

export const archiveLiability = async (id: string): Promise<Liability> => {
    const response = await api.post<Liability>(`/liabilities/${id}/archive`);
    return response.data;
};

export const deleteLiability = async (id: string): Promise<void> => {
    await api.delete(`/liabilities/${id}`);
};

// Snapshots
export const getLiabilitySnapshots = async (liabilityId?: string): Promise<LiabilitySnapshot[]> => {
    const params = liabilityId ? { liabilityId } : {};
    const response = await api.get<LiabilitySnapshot[]>('/liabilities/snapshots', { params });
    return response.data;
};

export const saveLiabilitySnapshot = async (data: {
    liabilityId: string;
    year: number;
    month: string;
    balance: number;
    interestPaid?: number;
    paymentMade?: number;
}): Promise<LiabilitySnapshot> => {
    const response = await api.post<LiabilitySnapshot>('/liabilities/snapshots', data);
    return response.data;
};

export const deleteLiabilitySnapshot = async (id: string): Promise<void> => {
    await api.delete(`/liabilities/snapshots/${id}`);
};

// Overpayments
export const getLiabilityOverpayments = async (liabilityId?: string): Promise<LiabilityOverpayment[]> => {
    const params = liabilityId ? { liabilityId } : {};
    const response = await api.get<LiabilityOverpayment[]>('/liabilities/overpayments', { params });
    return response.data;
};

export const saveLiabilityOverpayment = async (data: {
    liabilityId: string;
    year: number;
    month: string;
    amount: number;
}): Promise<LiabilityOverpayment> => {
    const response = await api.post<LiabilityOverpayment>('/liabilities/overpayments', data);
    return response.data;
};

export const bulkUpsertOverpayments = async (data: {
    liabilityId: string;
    recurringOverpayment?: number;
    overpayments: { liabilityId: string; year: number; month: string; amount: number }[];
}): Promise<void> => {
    await api.post('/liabilities/overpayments/bulk', data);
};

export const deleteLiabilityOverpayment = async (id: string): Promise<void> => {
    await api.delete(`/liabilities/overpayments/${id}`);
};

