export function isValidDateInput(value?: string | null) {
  if (!value) {
    return false;
  }

  return !Number.isNaN(new Date(value).getTime());
}

export function normalizeIsoDate(value?: string | null, fallback?: string) {
  const fallbackValue = fallback && isValidDateInput(fallback) ? fallback : new Date().toISOString();

  if (!isValidDateInput(value)) {
    return fallbackValue;
  }

  return new Date(value as string).toISOString();
}

export function getSafeTimestamp(value?: string | null, fallback = 0) {
  if (!isValidDateInput(value)) {
    return fallback;
  }

  return new Date(value as string).getTime();
}

export function getSafeDateKey(value?: string | null, fallback?: string) {
  return normalizeIsoDate(value, fallback).slice(0, 10);
}
