import { toCents } from './money.js';
import { parseSpecs } from './specs.js';

function text(value) {
  return typeof value === 'string' ? value.trim() : '';
}

export function normalizeEmail(value) {
  return text(value).toLowerCase();
}

export function validateRegistration(body) {
  const data = {
    name: text(body.name),
    email: normalizeEmail(body.email),
    password: typeof body.password === 'string' ? body.password : '',
    passwordConfirm: typeof body.passwordConfirm === 'string' ? body.passwordConfirm : '',
  };
  const errors = {};

  if (data.name.length < 2 || data.name.length > 60) {
    errors.name = 'Your name must be between 2 and 60 characters.';
  }
  if (!data.email.includes('@') || data.email.length > 254) {
    errors.email = 'Enter a valid email address.';
  }
  if (data.password.length < 8) {
    errors.password = 'The password must have at least 8 characters.';
  }
  if (data.passwordConfirm !== data.password) {
    errors.passwordConfirm = 'Passwords do not match.';
  }

  return { data, errors };
}

function positiveId(value) {
  return typeof value === 'string' && /^\d{1,9}$/.test(value) && Number(value) > 0 ? Number(value) : null;
}

/**
 * Checks the product form. The second argument lists the ids that exist, so a tampered
 * select value is reported as a field error instead of a database error.
 */
export function validateProduct(body, { categoryIds, supplierIds, deliveryMethodIds }) {
  const errors = {};
  const data = {
    name: text(body.name),
    description: text(body.description),
    specs: [],
    priceCents: null,
    stock: null,
    categoryId: positiveId(body.categoryId),
    supplierId: positiveId(body.supplierId),
    deliveryMethodIds: [...new Set([].concat(body.deliveryMethodIds ?? []).map(positiveId))].filter(
      (id) => id !== null && deliveryMethodIds.includes(id),
    ),
  };

  if (data.name.length < 2 || data.name.length > 120) {
    errors.name = 'The name must be between 2 and 120 characters.';
  }
  if (data.description.length < 10 || data.description.length > 2000) {
    errors.description = 'The description must be between 10 and 2000 characters.';
  }

  try {
    data.specs = parseSpecs(body.specs);
  } catch (err) {
    errors.specs = err.message;
  }

  const price = text(body.price);
  if (price.startsWith('-')) {
    errors.price = 'Price must be greater than 0.';
  } else {
    try {
      data.priceCents = toCents(price);
      if (data.priceCents === 0) errors.price = 'Price must be greater than 0.';
    } catch (err) {
      errors.price = err.message;
    }
  }

  const stock = text(body.stock);
  if (/^\d{1,6}$/.test(stock)) {
    data.stock = Number(stock);
  } else {
    errors.stock = 'Stock must be a whole number of 0 or more.';
  }

  if (!categoryIds.includes(data.categoryId)) {
    errors.categoryId = 'Choose a category.';
  }
  if (!supplierIds.includes(data.supplierId)) {
    errors.supplierId = 'Choose a supplier.';
  }
  if (data.deliveryMethodIds.length === 0) {
    errors.deliveryMethodIds = 'Choose at least one delivery method.';
  }

  return { data, errors };
}
