import axios from 'axios';
import type { WealthEntry } from './utils/dataUtils';

export interface WealthSource {
    id: string;
    name: string;
    category: 'investment' | 'cash' | 'pension';
    color?: string;
}

const API_URL = 'http://localhost:3000';

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
