import { displayRank } from "@/lib/display";
import { fetchProfileAndMembership } from "@/features/auth/profile";

export type MemberProfileView = {
  id: string;
  email: string;
  displayName: string;
  role: "admin" | "user";
  isAdmin: boolean;
  subscriptionTier: "free" | "premium";
  currentPlan: "FREE" | "PRO";
  currentRank: string;
  score: number;
  bio?: string;
  tradingExperience?: string;
  tradedMarkets?: string;
  tradingStyle?: string;
  preferredSessions?: string;
  focusedSetups?: string;
  currentGoal?: string;
  memberProfileVisibility?: "members" | "private";
};

export async function fetchMemberProfileView(userId: string) {
  const result = await fetchProfileAndMembership(userId);

  if (!result) {
    return {
      data: null,
      error: new Error("Profilul nu a putut fi încărcat."),
    };
  }

  const { user, stats: membership } = result;

  const member: MemberProfileView = {
    id: user.id,
    email: user.email,
    displayName: user.name ?? user.email.split("@")[0] ?? "Membru",
    role: (user.role ?? (user.isAdmin ? "admin" : "user")) as "admin" | "user",
    isAdmin: Boolean(user.isAdmin) || user.role === "admin",
    subscriptionTier: membership.currentPlan === "PRO" ? "premium" : "free",
    currentPlan: membership.currentPlan,
    currentRank: displayRank(membership.currentRank as never),
    score: membership.score ?? 0,
    bio: user.bio ?? undefined,
    tradingExperience: user.tradingExperience ?? undefined,
    tradedMarkets: user.tradedMarkets ?? undefined,
    tradingStyle: user.tradingStyle ?? undefined,
    preferredSessions: user.preferredSessions ?? undefined,
    focusedSetups: user.focusedSetups ?? undefined,
    currentGoal: user.currentGoal ?? undefined,
    memberProfileVisibility: user.memberProfileVisibility ?? "private",
  };

  return {
    data: member,
    error: null,
  };
}
