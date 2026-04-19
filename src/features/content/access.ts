import { AfterActionReview, DailyAnalysis, UserPlan } from "@/types/domain";
import { getSafeDateKey, getSafeTimestamp, normalizeIsoDate } from "@/lib/dates";

export function canAccessPremiumContent(plan: UserPlan, item: DailyAnalysis) {
  return !item.isPremium || plan === "PRO";
}

export function teaserText(item: DailyAnalysis) {
  return `${item.summary} Deblochează Premium pentru acces la briefingul video complet al zilei.`;
}

export function isPremiumLocked(plan: UserPlan, item: DailyAnalysis) {
  return item.isPremium && plan === "FREE";
}

export function groupAnalysesByDate(items: DailyAnalysis[]) {
  const sorted = [...items].sort(
    (a, b) => getSafeTimestamp(b.publishedAt) - getSafeTimestamp(a.publishedAt),
  );

  const map = new Map<string, DailyAnalysis[]>();

  for (const item of sorted) {
    const normalizedItem = {
      ...item,
      publishedAt: normalizeIsoDate(item.publishedAt),
    };
    const key = getSafeDateKey(normalizedItem.publishedAt);
    const bucket = map.get(key) ?? [];
    bucket.push(normalizedItem);
    map.set(key, bucket);
  }

  return [...map.entries()].map(([dateKey, analyses]) => ({
    dateKey,
    analyses,
  }));
}

export function latestAnalysisByMarket(items: DailyAnalysis[]) {
  const sorted = [...items].sort(
    (a, b) => getSafeTimestamp(b.publishedAt) - getSafeTimestamp(a.publishedAt),
  );
  const seen = new Set<string>();

  return sorted.filter((item) => {
    if (seen.has(item.market)) {
      return false;
    }
    seen.add(item.market);
    return true;
  });
}

export function groupReviewsByDate(items: AfterActionReview[]) {
  const sorted = [...items].sort(
    (a, b) => getSafeTimestamp(b.publishedAt) - getSafeTimestamp(a.publishedAt),
  );

  const map = new Map<string, AfterActionReview[]>();

  for (const item of sorted) {
    const normalizedItem = {
      ...item,
      publishedAt: normalizeIsoDate(item.publishedAt),
    };
    const key = getSafeDateKey(normalizedItem.publishedAt);
    const bucket = map.get(key) ?? [];
    bucket.push(normalizedItem);
    map.set(key, bucket);
  }

  return [...map.entries()].map(([dateKey, reviews]) => ({
    dateKey,
    reviews,
  }));
}
