const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

/** 1234.5 -> "$1,234.50" */
export const formatPrice = (value) => currency.format(Number(value) || 0);

const compactCurrency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  notation: 'compact',
  maximumFractionDigits: 1,
});

/** 1500 -> "$1.5K" (used for chart axis ticks) */
export const formatCompactPrice = (value) => compactCurrency.format(Number(value) || 0);

/** ISO date -> "Sep 25, 2026" */
export const formatDate = (value, options = { dateStyle: 'medium' }) =>
  value ? new Intl.DateTimeFormat('en-US', options).format(new Date(value)) : '';

/** ISO date -> "Sep 25, 2026, 4:30 PM" */
export const formatDateTime = (value) => formatDate(value, { dateStyle: 'medium', timeStyle: 'short' });

/** ISO date -> "Sep 25, 4:30 PM" (compact, used by the tracking timeline) */
export const formatCompactDateTime = (value) =>
  formatDate(value, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });

/** ISO date -> "Thu, Sep 25" */
export const formatShortDate = (value) => formatDate(value, { weekday: 'short', month: 'short', day: 'numeric' });

/** "Alex Johnson" -> "AJ" */
export const getInitials = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('') || '?';

/** pluralize(1, 'item') -> "1 item", pluralize(3, 'item') -> "3 items" */
export const pluralize = (count, word) => `${count} ${word}${count === 1 ? '' : 's'}`;
