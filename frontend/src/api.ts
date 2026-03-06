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

export const exportData = async (): Promise<string> => {
    const response = await api.get<{ csv: string }>('/wealth/export');
    return response.data.csv;
};

export interface ImportResult {
    rowsProcessed: number;
    newSources: string[];
}

export const importData = async (csv: string): Promise<ImportResult> => {
    const response = await api.post<ImportResult>('/wealth/import', { csv });
    return response.data;
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
export interface Account {
    id: string;
    name: string;
    type: 'bank' | 'savings';
    color?: string;
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

// Allocations
export type AllocationCategory = 'bills' | 'spending' | 'savings';

export interface Allocation {
    id: string;
    description: string;
    amount: number;
    category: AllocationCategory;
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

// Income Transfers
export interface IncomeTransfer {
    id: string;
    description: string;
    amount: number;
    category: AllocationCategory;
    sourceAccountId: string;
    targetAccountId: string;
    sourceAccount?: Account;
    targetAccount?: Account;
}

export const getIncomeTransfers = async (): Promise<IncomeTransfer[]> => {
    const response = await api.get<IncomeTransfer[]>('/budget/income-transfers');
    return response.data;
};

export const createIncomeTransfer = async (data: Omit<IncomeTransfer, 'id' | 'sourceAccount' | 'targetAccount'>): Promise<IncomeTransfer> => {
    const response = await api.post<IncomeTransfer>('/budget/income-transfers', data);
    return response.data;
};

export const updateIncomeTransfer = async (id: string, data: Partial<Omit<IncomeTransfer, 'id' | 'sourceAccount' | 'targetAccount'>>): Promise<IncomeTransfer> => {
    const response = await api.put<IncomeTransfer>(`/budget/income-transfers/${id}`, data);
    return response.data;
};

export const deleteIncomeTransfer = async (id: string): Promise<void> => {
    await api.delete(`/budget/income-transfers/${id}`);
};
