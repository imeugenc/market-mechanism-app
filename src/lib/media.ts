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

export function contentPreviewImage({ videoUrl, thumbnailUrl, chartImage }: {
  videoUrl?: string | null;
  thumbnailUrl?: string | null;
  chartImage?: string | null;
}) {
  const video = videoUrl?.trim();
  if (video) {
    try {
      const url = new URL(video);
      const host = url.hostname.toLowerCase();
      const id = host === "youtu.be" || host === "www.youtu.be"
        ? url.pathname.split("/")[1]
        : ["youtube.com", "www.youtube.com", "m.youtube.com"].includes(host)
          ? url.pathname === "/watch" ? url.searchParams.get("v") : url.pathname.match(/^\/(?:shorts|embed)\/([^/]+)/)?.[1]
          : null;
      if (id && /^[a-zA-Z0-9_-]{11}$/.test(id)) {
        return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
      }
    } catch {
      // Other video hosts may still provide an explicit thumbnail.
    }
  }
  return sanitizeRemoteImageUrl(thumbnailUrl) || sanitizeRemoteImageUrl(chartImage);
}
