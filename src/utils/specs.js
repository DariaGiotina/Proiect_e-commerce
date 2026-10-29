import { AppError } from './errors.js';

// Turns "Material: satin" lines into [{ key, value }]. Only the first colon splits.
export function parseSpecs(text) {
  const specs = [];
  String(text ?? '')
    .split(/\r?\n/)
    .forEach((line, index) => {
      if (!line.trim()) return;
      const colon = line.indexOf(':');
      const key = colon === -1 ? '' : line.slice(0, colon).trim();
      const value = colon === -1 ? '' : line.slice(colon + 1).trim();
      if (!key || !value) {
        throw new AppError(`Line ${index + 1} must look like Key: Value`, 422);
      }
      specs.push({ key, value });
    });
  return specs;
}

export function formatSpecs(specs) {
  return specs.map(({ key, value }) => `${key}: ${value}`).join('\n');
}
