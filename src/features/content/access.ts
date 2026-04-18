import { DailyAnalysis, UserPlan } from "@/types/domain";

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
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  );

  const map = new Map<string, DailyAnalysis[]>();

  for (const item of sorted) {
    const key = new Date(item.publishedAt).toISOString().slice(0, 10);
    const bucket = map.get(key) ?? [];
    bucket.push(item);
    map.set(key, bucket);
  }

  return [...map.entries()].map(([dateKey, analyses]) => ({
    dateKey,
    analyses,
  }));
}

export function latestAnalysisByMarket(items: DailyAnalysis[]) {
  const sorted = [...items].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
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
