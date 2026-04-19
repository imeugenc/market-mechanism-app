import { RankName, UserPlan } from "@/types/domain";

export function displayPlan(plan: UserPlan) {
  return plan === "FREE" ? "GRATUIT" : "PREMIUM";
}

export function displayRank(rank: RankName) {
  const labels: Record<RankName, string> = {
    Recruit: "Observator",
    Disciplined: "Membru activ",
    Executor: "Operator",
    Elite: "Avansat",
    "War Machine": "Specialist",
  };

  return labels[rank];
}
