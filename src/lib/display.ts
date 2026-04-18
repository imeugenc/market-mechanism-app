import { RankName, UserPlan } from "@/types/domain";

export function displayPlan(plan: UserPlan) {
  return plan === "FREE" ? "GRATUIT" : "PREMIUM";
}

export function displayRank(rank: RankName) {
  const labels: Record<RankName, string> = {
    Recruit: "Recrut",
    Disciplined: "Disciplinat",
    Executor: "Executor",
    Elite: "Elită",
    "War Machine": "Mașină de război",
  };

  return labels[rank];
}
