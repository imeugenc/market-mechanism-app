import { getSafeTimestamp } from "@/lib/dates";

export function sortNewest<T extends { publishedAt: string }>(items: T[]) {
  return [...items].sort((a, b) => getSafeTimestamp(b.publishedAt) - getSafeTimestamp(a.publishedAt));
}

export function isPublishedToday(value?: string) {
  if (!value) return false;
  const date = new Date(value);
  const today = new Date();
  return date.getFullYear() === today.getFullYear() && date.getMonth() === today.getMonth() && date.getDate() === today.getDate();
}
