import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toCents, formatPrice } from '../src/utils/money.js';
import { slugify, normalizeForSearch } from '../src/utils/text.js';

test('toCents parses prices with a comma or a dot', () => {
  assert.equal(toCents('49,99'), 4999);
  assert.equal(toCents('49.99'), 4999);
  assert.equal(toCents('49'), 4900);
  assert.equal(toCents(' 49,9 '), 4990);
});

test('toCents rejects empty, negative, non-numeric and 3-decimal input with 422', () => {
  for (const bad of ['', '-5', 'abc', '1,999']) {
    assert.throws(() => toCents(bad), { status: 422 }, `should reject ${JSON.stringify(bad)}`);
  }
});

test('formatPrice formats cents as RON', () => {
  assert.equal(formatPrice(4999), '49.99 RON');
  assert.equal(formatPrice(124999), '1,249.99 RON');
});

test('slugify strips accents and punctuation', () => {
  assert.equal(slugify('Rosé Satin Headband!'), 'rose-satin-headband');
});

test('normalizeForSearch strips accents, lowercases and collapses spaces', () => {
  assert.equal(normalizeForSearch('Crème  BRÛLÉE'), 'creme brulee');
});
