export const CATEGORY_CONFIG = Object.freeze([
  { category: 'service', title: '服务', expectedCount: 17, costModel: 'rounded-service-staffing' },
  { category: 'cleaning', title: '清洁', expectedCount: 48, costModel: 'rounded-daily-staffing' },
  { category: 'greening', title: '绿化', expectedCount: 51, costModel: 'rounded-daily-staffing' },
  { category: 'assistance', title: '客助', expectedCount: 6, costModel: 'dedicated-posts' },
  { category: 'pestControl', title: '四害消杀', expectedCount: 7, costModel: 'pest-workdays' },
  { category: 'engineeringOutsourced', title: '工程委外', expectedCount: 95, costModel: 'rounded-outsourced-staffing' },
  { category: 'engineeringRoutine', title: '工程常规', expectedCount: 228, costModel: 'rounded-routine-staffing' },
]);

export const CATEGORY_TITLES = Object.freeze(Object.fromEntries(
  CATEGORY_CONFIG.map(({ category, title }) => [category, title]),
));

export const STANDARD_ACTION_COUNT = CATEGORY_CONFIG.reduce(
  (sum, item) => sum + item.expectedCount,
  0,
);
