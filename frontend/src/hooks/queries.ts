import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
    getWealthSnapshots,
    getWealthSources,
    getIncomes,
    getOutgoings,
    getAccounts,
    getAllocations,
    getInvestmentHoldings,
    getInvestmentSnapshots,
} from '../api';

export const QueryKeys = {
    wealthSnapshots: ['wealthSnapshots'] as const,
    wealthSources: ['wealthSources'] as const,
    incomes: ['incomes'] as const,
    outgoings: ['outgoings'] as const,
    accounts: ['accounts'] as const,
    allocations: ['allocations'] as const,
    investmentHoldings: ['investmentHoldings'] as const,
    investmentSnapshots: ['investmentSnapshots'] as const,
};

export const useWealthSnapshots = () =>
    useQuery({ queryKey: QueryKeys.wealthSnapshots, queryFn: getWealthSnapshots });

export const useWealthSources = () =>
    useQuery({ queryKey: QueryKeys.wealthSources, queryFn: getWealthSources });

export const useIncomes = () =>
    useQuery({ queryKey: QueryKeys.incomes, queryFn: getIncomes });

export const useOutgoings = () =>
    useQuery({ queryKey: QueryKeys.outgoings, queryFn: getOutgoings });

export const useAccounts = () =>
    useQuery({ queryKey: QueryKeys.accounts, queryFn: getAccounts });

export const useAllocations = () =>
    useQuery({ queryKey: QueryKeys.allocations, queryFn: getAllocations });

export const useInvestmentHoldings = () =>
    useQuery({ queryKey: QueryKeys.investmentHoldings, queryFn: getInvestmentHoldings });

export const useInvestmentSnapshots = () =>
    useQuery({ queryKey: QueryKeys.investmentSnapshots, queryFn: () => getInvestmentSnapshots() });

export { useQueryClient };
