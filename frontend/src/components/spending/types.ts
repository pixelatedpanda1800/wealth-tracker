export interface SpendingCategory {
  id: string;
  name: string;
  parentId: string | null;
  color: string;
}

export interface MockAccount {
  id: string;
  name: string;
}

export interface Transaction {
  id: string;
  accountId: string;
  date: string;
  description: string;
  amount: number;
  categoryId: string | null;
  needsReview: boolean;
}

export interface CategorySpend {
  categoryId: string;
  categoryName: string;
  color: string;
  amount: number;
  transactionCount: number;
  children: CategorySpend[];
}

export interface MonthlySpend {
  monthKey: string;
  label: string;
  totalsByTopCategoryId: Record<string, number>;
}

export interface SpendingSummary {
  totalSpent: number;
  largestCategory: { name: string; amount: number } | null;
  uncategorisedAmount: number;
  uncategorisedCount: number;
  previousTotal: number;
  changeAbsolute: number;
  changePercent: number;
}
