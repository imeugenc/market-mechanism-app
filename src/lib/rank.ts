import { MembershipStats, RankName } from "@/types/domain";

const RANKS: Array<{ name: RankName; minScore: number }> = [
  { name: "Recruit", minScore: 0 },
  { name: "Disciplined", minScore: 80 },
  { name: "Executor", minScore: 180 },
  { name: "Elite", minScore: 320 },
  { name: "War Machine", minScore: 520 },
];

export function calculateScore(stats: Omit<MembershipStats, "score" | "currentRank">) {
  return (
    stats.loginStreak * 5 +
    stats.totalViews * 2 +
    stats.premiumViews * 6 +
    stats.totalRequests * 12 +
    stats.engagementActions * 4 +
    (stats.currentPlan === "PRO" ? 30 : 0)
  );
}

export function resolveRank(score: number): RankName {
  const matched = [...RANKS].reverse().find((rank) => score >= rank.minScore);
  return matched?.name ?? "Recruit";
}

export function applyRank(stats: Omit<MembershipStats, "score" | "currentRank">): MembershipStats {
  const score = calculateScore(stats);

  return {
    ...stats,
    score,
    currentRank: resolveRank(score),
  };
}
