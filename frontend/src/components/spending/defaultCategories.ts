import type { SpendingCategory } from './types';

export const TOP_LEVEL_COLORS: Record<string, string> = {
  housing: '#6366f1',
  food: '#10b981',
  transport: '#f59e0b',
  lifestyle: '#ec4899',
  health: '#14b8a6',
  savings: '#8b5cf6',
  other: '#64748b',
};

export const defaultCategories: SpendingCategory[] = [
  { id: 'housing', name: 'Housing', parentId: null, color: TOP_LEVEL_COLORS.housing },
  {
    id: 'housing-mortgage',
    name: 'Mortgage / Rent',
    parentId: 'housing',
    color: TOP_LEVEL_COLORS.housing,
  },
  {
    id: 'housing-utilities',
    name: 'Utilities',
    parentId: 'housing',
    color: TOP_LEVEL_COLORS.housing,
  },
  {
    id: 'housing-insurance',
    name: 'Insurance',
    parentId: 'housing',
    color: TOP_LEVEL_COLORS.housing,
  },

  { id: 'food', name: 'Food', parentId: null, color: TOP_LEVEL_COLORS.food },
  { id: 'food-groceries', name: 'Groceries', parentId: 'food', color: TOP_LEVEL_COLORS.food },
  { id: 'food-eating-out', name: 'Eating out', parentId: 'food', color: TOP_LEVEL_COLORS.food },

  { id: 'transport', name: 'Transport', parentId: null, color: TOP_LEVEL_COLORS.transport },
  { id: 'transport-fuel', name: 'Fuel', parentId: 'transport', color: TOP_LEVEL_COLORS.transport },
  {
    id: 'transport-public',
    name: 'Public transport',
    parentId: 'transport',
    color: TOP_LEVEL_COLORS.transport,
  },
  {
    id: 'transport-car',
    name: 'Car maintenance',
    parentId: 'transport',
    color: TOP_LEVEL_COLORS.transport,
  },

  { id: 'lifestyle', name: 'Lifestyle', parentId: null, color: TOP_LEVEL_COLORS.lifestyle },
  {
    id: 'lifestyle-entertainment',
    name: 'Entertainment',
    parentId: 'lifestyle',
    color: TOP_LEVEL_COLORS.lifestyle,
  },
  {
    id: 'lifestyle-subscriptions',
    name: 'Subscriptions',
    parentId: 'lifestyle',
    color: TOP_LEVEL_COLORS.lifestyle,
  },
  {
    id: 'lifestyle-clothing',
    name: 'Clothing',
    parentId: 'lifestyle',
    color: TOP_LEVEL_COLORS.lifestyle,
  },

  { id: 'health', name: 'Health', parentId: null, color: TOP_LEVEL_COLORS.health },
  { id: 'health-pharmacy', name: 'Pharmacy', parentId: 'health', color: TOP_LEVEL_COLORS.health },
  { id: 'health-fitness', name: 'Fitness', parentId: 'health', color: TOP_LEVEL_COLORS.health },

  { id: 'savings', name: 'Savings', parentId: null, color: TOP_LEVEL_COLORS.savings },
  {
    id: 'savings-transfer',
    name: 'Transfers out',
    parentId: 'savings',
    color: TOP_LEVEL_COLORS.savings,
  },

  { id: 'other', name: 'Other', parentId: null, color: TOP_LEVEL_COLORS.other },
];
