export function sanitizeRemoteImageUrl(value?: string | null) {
  const trimmed = value?.trim();

  if (!trimmed) {
    return "";
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

  return "";
}
