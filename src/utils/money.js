import { AppError } from './errors.js';

// Up to 9 digits before the decimal mark keeps every value a safe integer.
const PRICE_PATTERN = /^(\d{1,9})(?:[.,](\d{1,2}))?$/;

const priceFormatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

// Parses the string as text (never float * 100), so '0.29' is exactly 29 cents.
export function toCents(input) {
  const match = PRICE_PATTERN.exec(String(input ?? '').trim());
  if (!match) {
    throw new AppError('Enter a valid price, for example 49.99.', 422);
  }
  const [, whole, fraction = ''] = match;
  return Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
}

export function formatPrice(cents) {
  return `${priceFormatter.format(cents / 100)} RON`;
}
