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

  if (!profile) {
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

  const fallbackPlan = profile.subscription_tier === "premium" ? "PRO" : "FREE";
  const stats: MembershipStats = {
    userId: membership?.user_id ?? profile.id,
    currentPlan: membership?.current_plan ?? fallbackPlan,
    currentRank: membership?.current_rank ?? "Recruit",
    planLabel: membership?.plan_label ?? (fallbackPlan === "PRO" ? "Premium All Access" : "Acces Gratuit"),
    startedAt: membership?.started_at ?? profile.created_at ?? undefined,
    expiresAt: membership?.expires_at ?? undefined,
    renewalMode: membership?.renewal_mode ?? "manual",
    loginStreak: membership?.login_streak ?? 0,
    totalViews: membership?.total_views ?? 0,
    premiumViews: membership?.premium_views ?? 0,
    totalRequests: membership?.total_requests ?? 0,
    engagementActions: membership?.engagement_actions ?? 0,
    score: membership?.score ?? 0,
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
    { onConflict: "id", ignoreDuplicates: true },
  );

  await supabase.from("memberships").upsert(
    {
      user_id: userId,
      current_plan: plan,
      current_rank: "Recruit",
      plan_label: "Premium All Access",
      started_at: new Date().toISOString(),
      expires_at: null,
      renewal_mode: "manual",
      login_streak: 0,
      total_views: 0,
      premium_views: 0,
      total_requests: 0,
      engagement_actions: 0,
      score: 0,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id", ignoreDuplicates: true },
  );
}

export async function ensureProfileAndMembershipRecord(userId: string, email?: string) {
  const normalizedEmail = email?.trim().toLowerCase() || null;
  const rpcResult = await supabase.rpc("ensure_profile_membership", {
    target_user_id: userId,
    target_email: normalizedEmail,
  });

  if (!rpcResult.error) {
    return {
      success: true,
      error: null,
    };
  }

  if (normalizedEmail) {
    await ensureProfileAndMembership(userId, normalizedEmail);
    return {
      success: true,
      error: null,
    };
  }

  return {
    success: false,
    error: rpcResult.error,
  };
}

export async function updateProfileAbout(userId: string, input: ProfileAboutInput) {
  const { data: currentProfile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (profileError) {
    return {
      data: null,
      error: profileError,
    };
  }

  const payload: Record<string, string | null> = {
    display_name: input.displayName,
  };

  if (currentProfile && "bio" in currentProfile) {
    payload.bio = input.bio || null;
  }

  if (currentProfile && "trading_experience" in currentProfile) {
    payload.trading_experience = input.tradingExperience || null;
  }

  if (currentProfile && "traded_markets" in currentProfile) {
    payload.traded_markets = input.tradedMarkets || null;
  }

  if (currentProfile && "trading_style" in currentProfile) {
    payload.trading_style = input.tradingStyle || null;
  }

  if (currentProfile && "preferred_sessions" in currentProfile) {
    payload.preferred_sessions = input.preferredSessions || null;
  }

  if (currentProfile && "focused_setups" in currentProfile) {
    payload.focused_setups = input.focusedSetups || null;
  }

  if (currentProfile && "current_goal" in currentProfile) {
    payload.current_goal = input.currentGoal || null;
  }

  if (currentProfile && "member_profile_visibility" in currentProfile) {
    payload.member_profile_visibility = input.memberProfileVisibility;
  }

  return supabase
    .from("profiles")
    .update(payload)
    .eq("id", userId);
}

export async function updateSavedMarkets(userId: string, savedMarkets: string[]) {
  return supabase
    .from("profiles")
    .update({
      saved_markets: savedMarkets,
    })
    .eq("id", userId);
}

export async function markUserPlan(
  userId: string,
  plan: "FREE" | "PRO",
  options?: {
    planLabel?: string;
    durationDays?: number;
    renewalMode?: "manual" | "none";
    email?: string;
  },
) {
  await ensureProfileAndMembershipRecord(userId, options?.email);

  const now = new Date();
  const startedAt = now.toISOString();
  const { data: existingMembership } = await supabase
    .from("memberships")
    .select("expires_at")
    .eq("user_id", userId)
    .maybeSingle();

  const currentExpiry = existingMembership?.expires_at ? new Date(existingMembership.expires_at) : null;
  const renewalBase =
    currentExpiry && !Number.isNaN(currentExpiry.getTime()) && currentExpiry.getTime() > now.getTime()
      ? currentExpiry
      : now;
  const expiresAt =
    plan === "PRO" && options?.durationDays
      ? new Date(renewalBase.getTime() + options.durationDays * 24 * 60 * 60 * 1000).toISOString()
      : null;

  const [membershipResult, profileResult] = await Promise.all([
    supabase
      .from("memberships")
      .upsert({
        user_id: userId,
        current_plan: plan,
        plan_label: options?.planLabel ?? (plan === "PRO" ? "Premium All Access" : "Acces Gratuit"),
        started_at: startedAt,
        expires_at: expiresAt,
        renewal_mode: options?.renewalMode ?? "manual",
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" }),
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
    expiresAt,
  };
}

export async function activateUserPlanByIdentifier(input: {
  identifier: string;
  plan: "FREE" | "PRO";
  durationDays?: number;
  planLabel?: string;
}) {
  const normalizedIdentifier = input.identifier.trim().toLowerCase();

  if (!normalizedIdentifier) {
    return {
      data: null,
      error: new Error("Introdu un email sau un ID valid."),
    };
  }

  const result = await supabase.rpc("admin_activate_member_plan", {
    p_target_identifier: normalizedIdentifier,
    p_target_plan: input.plan,
    p_target_duration_days: input.durationDays ?? 30,
    p_target_plan_label: input.planLabel ?? (input.plan === "PRO" ? "Premium All Access" : "Acces Gratuit"),
  });

  return {
    data: Array.isArray(result.data) ? result.data[0] ?? null : result.data,
    error: result.error,
  };
}

export async function fetchAdminUsers() {
  const [{ data: profiles, error: profilesError }, { data: memberships, error: membershipsError }] = await Promise.all([
    supabase.from("profiles").select("id, email, display_name, role, is_admin, subscription_tier"),
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
    plan: planByUserId.get(profile.id) ?? (profile.subscription_tier === "premium" ? "PRO" : "FREE"),
  }));

  return {
    data: users,
    error: null,
  };
}

export async function findAdminUserByIdentifier(identifier: string) {
  const normalizedIdentifier = identifier.trim().toLowerCase();

  if (!normalizedIdentifier) {
    return {
      data: null,
      error: new Error("Introdu un email sau un ID valid."),
    };
  }

  const rpcLookup = await supabase.rpc("admin_find_member", {
    p_target_identifier: normalizedIdentifier,
  });

  if (!rpcLookup.error && Array.isArray(rpcLookup.data) && rpcLookup.data[0]) {
    const item = rpcLookup.data[0] as {
      id: string;
      email: string;
      display_name: string | null;
      role: string | null;
      is_admin: boolean | null;
      subscription_tier?: string | null;
      current_plan?: UserPlan | null;
    };

    return {
      data: {
        id: item.id,
        email: item.email,
        name: item.display_name ?? "Utilizator",
        role: (item.role ?? (item.is_admin ? "admin" : "user")) as "admin" | "user",
        plan: (item.current_plan as UserPlan | undefined) ?? (item.subscription_tier === "premium" ? "PRO" : "FREE"),
      } satisfies AdminUserRecord,
      error: null,
    };
  }

  let profile:
    | {
        id: string;
        email: string;
        display_name: string | null;
        role: string | null;
        is_admin: boolean | null;
        subscription_tier?: string | null;
      }
    | null = null;

  if (normalizedIdentifier.includes("@")) {
    const { data: profilesByEmail, error: profileError } = await supabase
      .from("profiles")
      .select("id, email, display_name, role, is_admin, subscription_tier")
      .eq("email", normalizedIdentifier)
      .limit(1);

    if (profileError) {
      return {
        data: null,
        error: profileError,
      };
    }

    profile = profilesByEmail?.[0] ?? null;

    if (!profile) {
      const { data: paymentMatches, error: paymentMatchError } = await supabase
        .from("payment_requests")
        .select("user_id, contact_email, created_at")
        .ilike("contact_email", normalizedIdentifier)
        .order("created_at", { ascending: false })
        .limit(1);

      if (paymentMatchError) {
        return {
          data: null,
          error: paymentMatchError,
        };
      }

      const matchedUserId = paymentMatches?.[0]?.user_id;

      if (matchedUserId) {
        const { data: fallbackProfiles, error: fallbackProfileError } = await supabase
          .from("profiles")
          .select("id, email, display_name, role, is_admin, subscription_tier")
          .eq("id", matchedUserId)
          .limit(1);

        if (fallbackProfileError) {
          return {
            data: null,
            error: fallbackProfileError,
          };
        }

        profile = fallbackProfiles?.[0] ?? null;
      }
      if (!profile) {
        const { data: requestMatches, error: requestMatchError } = await supabase
          .from("analysis_requests")
          .select("user_id, requester_email, created_at")
          .ilike("requester_email", normalizedIdentifier)
          .order("created_at", { ascending: false })
          .limit(1);

        if (requestMatchError) {
          return {
            data: null,
            error: requestMatchError,
          };
        }

        const matchedUserId = requestMatches?.[0]?.user_id;

        if (matchedUserId) {
          const { data: fallbackProfiles, error: fallbackProfileError } = await supabase
            .from("profiles")
            .select("id, email, display_name, role, is_admin, subscription_tier")
            .eq("id", matchedUserId)
            .limit(1);

          if (fallbackProfileError) {
            return {
              data: null,
              error: fallbackProfileError,
            };
          }

          profile = fallbackProfiles?.[0] ?? null;
        }
      }

      if (!profile) {
        const { data: personalMatches, error: personalMatchError } = await supabase
          .from("personal_requests")
          .select("user_email, created_at")
          .ilike("user_email", normalizedIdentifier)
          .order("created_at", { ascending: false })
          .limit(1);

        if (personalMatchError) {
          return {
            data: null,
            error: personalMatchError,
          };
        }

        if (personalMatches?.length) {
          const { data: fallbackProfiles, error: fallbackProfileError } = await supabase
            .from("profiles")
            .select("id, email, display_name, role, is_admin, subscription_tier")
            .eq("email", normalizedIdentifier)
            .limit(1);

          if (fallbackProfileError) {
            return {
              data: null,
              error: fallbackProfileError,
            };
          }

          profile = fallbackProfiles?.[0] ?? null;
        }
      }
    }
  } else {
    const { data: profilesById, error: profileError } = await supabase
      .from("profiles")
      .select("id, email, display_name, role, is_admin, subscription_tier")
      .eq("id", normalizedIdentifier)
      .limit(1);

    if (profileError) {
      return {
        data: null,
        error: profileError,
      };
    }

    profile = profilesById?.[0] ?? null;
  }

  if (!profile) {
    return {
      data: null,
      error: new Error("Membrul nu a fost găsit."),
    };
  }

  const { data: membership, error: membershipError } = await supabase
    .from("memberships")
    .select("current_plan")
    .eq("user_id", profile.id)
    .maybeSingle();

  if (membershipError) {
    return {
      data: null,
      error: membershipError,
    };
  }

  return {
    data: {
      id: profile.id,
      email: profile.email,
      name: profile.display_name ?? "Utilizator",
      role: (profile.role ?? (profile.is_admin ? "admin" : "user")) as "admin" | "user",
      plan: (membership?.current_plan as UserPlan | undefined) ?? (profile.subscription_tier === "premium" ? "PRO" : "FREE"),
    } satisfies AdminUserRecord,
    error: null,
  };
}

export async function updateUserAccess(input: {
  userId: string;
  role: "admin" | "user";
  plan: UserPlan;
  durationDays?: number;
  planLabel?: string;
}) {
  const startedAt = new Date().toISOString();
  const expiresAt =
    input.plan === "PRO" && input.durationDays
      ? new Date(Date.now() + input.durationDays * 24 * 60 * 60 * 1000).toISOString()
      : null;

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
      .upsert({
        user_id: input.userId,
        current_plan: input.plan,
        plan_label: input.planLabel ?? (input.plan === "PRO" ? "Premium All Access" : "Acces Gratuit"),
        started_at: startedAt,
        expires_at: expiresAt,
        renewal_mode: "manual",
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" }),
  ]);

  return {
    profileResult,
    membershipResult,
  };
}
