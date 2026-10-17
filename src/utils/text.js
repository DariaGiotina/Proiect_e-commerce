function stripDiacritics(text) {
  return String(text).normalize('NFD').replace(/\p{Diacritic}/gu, '');
}

export function slugify(text) {
  return stripDiacritics(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function normalizeForSearch(text) {
  return stripDiacritics(text).toLowerCase().replace(/\s+/g, ' ').trim();
}
