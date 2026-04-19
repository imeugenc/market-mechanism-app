const FALLBACK_REVIEW_IMAGE =
  "https://images.unsplash.com/photo-1559526324-593bc073d938?auto=format&fit=crop&w=1200&q=80";

export function sanitizeRemoteImageUrl(value?: string | null, fallback = FALLBACK_REVIEW_IMAGE) {
  const trimmed = value?.trim();

  if (!trimmed) {
    return fallback;
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  const embeddedHttpIndex = trimmed.toLowerCase().indexOf("http");
  if (embeddedHttpIndex >= 0) {
    const candidate = trimmed.slice(embeddedHttpIndex);
    if (/^https?:\/\//i.test(candidate)) {
      return candidate;
    }
  }

  return fallback;
}
