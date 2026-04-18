import { supabase } from "@/lib/supabase";
import { AdminUserRecord, AppUser, MembershipStats, UserPlan } from "@/types/domain";

type ProfileAboutInput = {
  displayName: string;
  bio?: string;
  tradingExperience?: string;
  tradedMarkets?: string;
  tradingStyle?: string;
  preferredSessions?: string;
  focusedSetups?: string;
  currentGoal?: string;
  memberProfileVisibility: "members" | "private";
};

export async function fetchProfileAndMembership(userId: string) {
  const [{ data: profile }, { data: membership }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
    supabase.from("memberships").select("*").eq("user_id", userId).maybeSingle(),
  ]);

  if (!profile || !membership) {
    return null;
  }

  const user: AppUser = {
    id: profile.id,
    name: profile.display_name ?? "Utilizator",
    email: profile.email,
    isAdmin: profile.role ? profile.role === "admin" : profile.is_admin,
    role: profile.role ?? (profile.is_admin ? "admin" : "user"),
    savedMarkets: profile.saved_markets ?? [],
    bio: profile.bio ?? undefined,
    tradingExperience: profile.trading_experience ?? undefined,
    tradedMarkets: profile.traded_markets ?? undefined,
    tradingStyle: profile.trading_style ?? undefined,
    preferredSessions: profile.preferred_sessions ?? undefined,
    focusedSetups: profile.focused_setups ?? undefined,
    currentGoal: profile.current_goal ?? undefined,
    memberProfileVisibility: profile.member_profile_visibility ?? "private",
  };

  const stats: MembershipStats = {
    userId: membership.user_id,
    currentPlan: membership.current_plan,
    currentRank: membership.current_rank,
    loginStreak: membership.login_streak,
    totalViews: membership.total_views,
    premiumViews: membership.premium_views,
    totalRequests: membership.total_requests,
    engagementActions: membership.engagement_actions,
    score: membership.score,
  };

  return { user, stats };
}

export async function ensureProfileAndMembership(userId: string, email: string) {
  const role = "user";
  const plan = "FREE";

  await supabase.from("profiles").upsert(
    {
      id: userId,
      email,
      display_name: email.split("@")[0] || "Utilizator",
      is_admin: false,
      role,
      subscription_tier: "free",
      saved_markets: [],
      bio: null,
      trading_experience: null,
      traded_markets: null,
      trading_style: null,
      preferred_sessions: null,
      focused_setups: null,
      current_goal: null,
      member_profile_visibility: "private",
    },
    { onConflict: "id" },
  );

  await supabase.from("memberships").upsert(
    {
      user_id: userId,
      current_plan: plan,
      current_rank: "Recruit",
      login_streak: 0,
      total_views: 0,
      premium_views: 0,
      total_requests: 0,
      engagement_actions: 0,
      score: 0,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );
}

export async function updateProfileAbout(userId: string, input: ProfileAboutInput) {
  return supabase
    .from("profiles")
    .update({
      display_name: input.displayName,
      bio: input.bio || null,
      trading_experience: input.tradingExperience || null,
      traded_markets: input.tradedMarkets || null,
      trading_style: input.tradingStyle || null,
      preferred_sessions: input.preferredSessions || null,
      focused_setups: input.focusedSetups || null,
      current_goal: input.currentGoal || null,
      member_profile_visibility: input.memberProfileVisibility,
    })
    .eq("id", userId);
}

export async function markUserPlan(userId: string, plan: "FREE" | "PRO") {
  const [membershipResult, profileResult] = await Promise.all([
    supabase
      .from("memberships")
      .update({
        current_plan: plan,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId),
    supabase
      .from("profiles")
      .update({
        subscription_tier: plan === "PRO" ? "premium" : "free",
      })
      .eq("id", userId),
  ]);

  return {
    membershipResult,
    profileResult,
  };
}

export async function fetchAdminUsers() {
  const [{ data: profiles, error: profilesError }, { data: memberships, error: membershipsError }] = await Promise.all([
    supabase.from("profiles").select("id, email, display_name, role, is_admin"),
    supabase.from("memberships").select("user_id, current_plan"),
  ]);

  if (profilesError || membershipsError) {
    return {
      data: null,
      error: profilesError ?? membershipsError,
    };
  }

  const planByUserId = new Map((memberships ?? []).map((item) => [item.user_id, item.current_plan as UserPlan]));
  const users: AdminUserRecord[] = (profiles ?? []).map((profile) => ({
    id: profile.id,
    email: profile.email,
    name: profile.display_name ?? "Utilizator",
    role: (profile.role ?? (profile.is_admin ? "admin" : "user")) as "admin" | "user",
    plan: planByUserId.get(profile.id) ?? "FREE",
  }));

  return {
    data: users,
    error: null,
  };
}

export async function updateUserAccess(input: {
  userId: string;
  role: "admin" | "user";
  plan: UserPlan;
}) {
  const [profileResult, membershipResult] = await Promise.all([
    supabase
      .from("profiles")
      .update({
        role: input.role,
        is_admin: input.role === "admin",
        subscription_tier: input.plan === "PRO" ? "premium" : "free",
      })
      .eq("id", input.userId),
    supabase
      .from("memberships")
      .update({
        current_plan: input.plan,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", input.userId),
  ]);

  return {
    profileResult,
    membershipResult,
  };
}
