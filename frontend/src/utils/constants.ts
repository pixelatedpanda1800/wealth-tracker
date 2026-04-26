export const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const;

export type Month = (typeof MONTHS)[number];

export const CATEGORIES = ['investment', 'cash', 'pension'] as const;

export type Category = (typeof CATEGORIES)[number];
