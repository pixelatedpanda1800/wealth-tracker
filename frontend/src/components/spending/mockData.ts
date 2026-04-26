import type { MockAccount, Transaction } from './types';

export const mockAccounts: MockAccount[] = [
  { id: 'acc-current', name: 'Current Account' },
  { id: 'acc-joint', name: 'Joint Account' },
];

interface Seed {
  description: string;
  categoryId: string | null;
  min: number;
  max: number;
  perMonth: number;
  accountId: string;
  needsReview?: boolean;
}

const SEEDS: Seed[] = [
  {
    description: 'TESCO SUPERSTORE',
    categoryId: 'food-groceries',
    min: 38,
    max: 96,
    perMonth: 4,
    accountId: 'acc-joint',
  },
  {
    description: 'SAINSBURYS',
    categoryId: 'food-groceries',
    min: 25,
    max: 70,
    perMonth: 2,
    accountId: 'acc-joint',
  },
  {
    description: 'PRET A MANGER',
    categoryId: 'food-eating-out',
    min: 6,
    max: 14,
    perMonth: 6,
    accountId: 'acc-current',
  },
  {
    description: 'DELIVEROO',
    categoryId: 'food-eating-out',
    min: 18,
    max: 42,
    perMonth: 3,
    accountId: 'acc-current',
  },
  {
    description: 'SHELL FORECOURT',
    categoryId: 'transport-fuel',
    min: 45,
    max: 78,
    perMonth: 2,
    accountId: 'acc-current',
  },
  {
    description: 'TFL TRAVEL',
    categoryId: 'transport-public',
    min: 2,
    max: 8,
    perMonth: 12,
    accountId: 'acc-current',
  },
  {
    description: 'KWIK FIT',
    categoryId: 'transport-car',
    min: 60,
    max: 280,
    perMonth: 0.3,
    accountId: 'acc-current',
  },
  {
    description: 'BRITISH GAS',
    categoryId: 'housing-utilities',
    min: 85,
    max: 160,
    perMonth: 1,
    accountId: 'acc-joint',
  },
  {
    description: 'THAMES WATER',
    categoryId: 'housing-utilities',
    min: 35,
    max: 55,
    perMonth: 1,
    accountId: 'acc-joint',
  },
  {
    description: 'HALIFAX MORTGAGE',
    categoryId: 'housing-mortgage',
    min: 1280,
    max: 1280,
    perMonth: 1,
    accountId: 'acc-joint',
  },
  {
    description: 'AVIVA HOME INS',
    categoryId: 'housing-insurance',
    min: 22,
    max: 24,
    perMonth: 1,
    accountId: 'acc-joint',
  },
  {
    description: 'NETFLIX',
    categoryId: 'lifestyle-subscriptions',
    min: 10.99,
    max: 10.99,
    perMonth: 1,
    accountId: 'acc-current',
  },
  {
    description: 'SPOTIFY',
    categoryId: 'lifestyle-subscriptions',
    min: 11.99,
    max: 11.99,
    perMonth: 1,
    accountId: 'acc-current',
  },
  {
    description: 'CINEWORLD',
    categoryId: 'lifestyle-entertainment',
    min: 18,
    max: 44,
    perMonth: 1,
    accountId: 'acc-current',
  },
  {
    description: 'UNIQLO',
    categoryId: 'lifestyle-clothing',
    min: 25,
    max: 140,
    perMonth: 0.7,
    accountId: 'acc-current',
  },
  {
    description: 'PURE GYM',
    categoryId: 'health-fitness',
    min: 24.99,
    max: 24.99,
    perMonth: 1,
    accountId: 'acc-current',
  },
  {
    description: 'BOOTS PHARMACY',
    categoryId: 'health-pharmacy',
    min: 6,
    max: 28,
    perMonth: 1.5,
    accountId: 'acc-current',
  },
  {
    description: 'TRANSFER TO SAVINGS',
    categoryId: 'savings-transfer',
    min: 400,
    max: 600,
    perMonth: 1,
    accountId: 'acc-current',
  },
  {
    description: 'AMZN MKTPLACE',
    categoryId: null,
    min: 8,
    max: 120,
    perMonth: 3,
    accountId: 'acc-current',
    needsReview: true,
  },
  {
    description: 'PAYPAL *MERCHANT',
    categoryId: null,
    min: 12,
    max: 95,
    perMonth: 1.5,
    accountId: 'acc-current',
    needsReview: true,
  },
  {
    description: 'SQ *LOCAL CAFE',
    categoryId: 'food-eating-out',
    min: 4,
    max: 11,
    perMonth: 4,
    accountId: 'acc-current',
  },
];

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function monthKey(year: number, monthIndex: number): string {
  return `${year}-${String(monthIndex + 1).padStart(2, '0')}`;
}

function formatDate(year: number, monthIndex: number, day: number): string {
  return `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function buildMockTransactions(referenceDate: Date = new Date()): Transaction[] {
  const rand = seededRandom(42);
  const txns: Transaction[] = [];
  let counter = 0;

  for (let back = 5; back >= 0; back--) {
    const date = new Date(referenceDate.getFullYear(), referenceDate.getMonth() - back, 1);
    const year = date.getFullYear();
    const monthIndex = date.getMonth();
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

    SEEDS.forEach((seed) => {
      const whole = Math.floor(seed.perMonth);
      const fractional = seed.perMonth - whole;
      const count = whole + (rand() < fractional ? 1 : 0);

      for (let i = 0; i < count; i++) {
        const day = Math.max(1, Math.min(daysInMonth, Math.floor(rand() * daysInMonth) + 1));
        const amount = +(seed.min + rand() * (seed.max - seed.min)).toFixed(2);
        counter += 1;
        txns.push({
          id: `mock-${monthKey(year, monthIndex)}-${counter}`,
          accountId: seed.accountId,
          date: formatDate(year, monthIndex, day),
          description: seed.description,
          amount,
          categoryId: seed.categoryId,
          needsReview: !!seed.needsReview,
        });
      }
    });
  }

  txns.sort((a, b) => (a.date < b.date ? 1 : -1));
  return txns;
}
