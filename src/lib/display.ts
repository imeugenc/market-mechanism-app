import { DailyBias, RankName, UserPlan } from "@/types/domain";

export function displayBiasOutcome(outcome: DailyBias["outcome"]) {
  const labels: Record<DailyBias["outcome"], string> = {
    Correct: "Corect",
    "Partially correct": "Parțial corect",
    Wrong: "Incorect",
    Pending: "În așteptare",
  };
  return labels[outcome];
}

export function displayBiasConfidence(confidence: DailyBias["confidence"]) {
  const labels: Record<DailyBias["confidence"], string> = {
    Low: "scăzută",
    Medium: "medie",
    High: "ridicată",
  };
  return labels[confidence];
}

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
