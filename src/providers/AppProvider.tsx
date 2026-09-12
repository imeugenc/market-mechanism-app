import { PropsWithChildren, createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Session } from "@supabase/supabase-js";
import { AppState, Platform } from "react-native";

import { isOwnerEmail, OWNER_EMAIL } from "@/constants/access";
import { deleteDailyAnalysis, fetchDailyAnalyses, publishDailyAnalysis, updateDailyAnalysis } from "@/features/content/analyses";
import {
  deleteDailyBias as deleteDailyBiasRemote,
  fetchDailyBiases,
  publishDailyBias as publishDailyBiasRemote,
  updateDailyBias as updateDailyBiasRemote,
} from "@/features/content/biases";
import { deleteAltcoinPost, fetchAltcoinPosts, publishAltcoinPost, updateAltcoinPost } from "@/features/content/altcoins";
import {
  createContactMessage as persistContactMessage,
  createContactMessageReply as persistContactMessageReply,
  fetchContactMessages,
  setContactMessageArchive as persistContactMessageArchive,
  updateContactMessageStatus as persistContactMessageStatus,
} from "@/features/contact/service";
import { createFavorite, deleteFavorite, fetchFavorites } from "@/features/favorites/service";
import {
  deleteAfterActionReview,
  fetchAfterActionReviews,
  publishAfterActionReview,
  updateAfterActionReview,
} from "@/features/content/reviews";
import {
  formatAuthErrorMessage,
  getCurrentSession,
  sendMagicLink,
  signInWithEmailPassword,
  signOutRemote,
  signUpWithEmailPassword,
  subscribeToAuthChanges,
} from "@/features/auth/auth";
import {
  activateUserPlanByIdentifier,
  ensureProfileAndMembershipRecord,
  findAdminUserByIdentifier,
  fetchAdminUsers,
  fetchProfileAndMembership,
  markUserPlan,
  updateProfileAbout,
  updateUserAccess,
} from "@/features/auth/profile";
import { updatePassword as updatePasswordRemote } from "@/features/auth/auth";
import { createPaymentRequest as persistPaymentRequest, fetchPaymentRequests, updatePaymentRequest as persistPaymentRequestUpdate } from "@/features/payments/service";
import {
  createPersonalRequest as persistPersonalRequest,
  fetchPersonalRequests,
  updatePersonalRequest as persistPersonalRequestUpdate,
} from "@/features/personal-requests/service";
import { queueRequestEmailNotification } from "@/features/requests/notifications";
import { queueAccountEmailNotification } from "@/features/requests/notifications";
import { createAnalysisRequest, createRequestStatusEvent, fetchAnalysisRequests, updateAnalysisRequest } from "@/features/requests/service";
import { applyRank } from "@/lib/rank";
import {
  AdminUserRecord,
  AnalysisRequest,
  AltcoinPost,
  AppUser,
  AfterActionReview,
  ContactMessage,
  DailyAnalysis,
  DailyBias,
  FavoriteContentType,
  FavoriteItem,
  InAppNotification,
  MembershipStats,
  PaymentRequest,
  PaymentStatus,
  PersonalRequest,
  RequestTier,
  UserPlan,
} from "@/types/domain";
import { normalizeIsoDate } from "@/lib/dates";

type NewRequestInput = {
  assetInput: string;
  requesterEmail?: string;
  tier: RequestTier;
  notes: string;
  paymentProof?: string;
  paymentReference?: string;
};

type RequestUpdateInput = {
  status: AnalysisRequest["status"];
  paymentStatus?: PaymentStatus;
  deliveryNotes?: string;
  deliveryVideoUrl?: string;
};

type NewPaymentRequestInput = {
  planTarget: UserPlan;
  planLabel?: string;
  durationDays?: number;
  fullName: string;
  contactEmail: string;
  paymentMethod: PaymentRequest["paymentMethod"];
  paymentProof: string;
  transactionRef?: string;
  notes?: string;
};

type NewPersonalRequestInput = {
  userEmail: string;
  title: string;
  videoUrl?: string;
  notes?: string;
  tier?: RequestTier;
  status: AnalysisRequest["status"];
};

type NewAnalysisInput = Omit<DailyAnalysis, "id" | "publishedAt"> & {
  publishedAt?: string;
};

type NewReviewInput = Omit<AfterActionReview, "id" | "publishedAt" | "isFree"> & {
  publishedAt?: string;
};

type NewDailyBiasInput = Omit<DailyBias, "id" | "publishedAt"> & { publishedAt?: string };

type NewAltcoinPostInput = Omit<AltcoinPost, "id" | "publishedAt"> & {
  publishedAt?: string;
};

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

type FavoriteToggleInput = {
  contentType: FavoriteContentType;
  contentId: string;
  title: string;
  subtitle?: string;
  marketLabel?: string;
};

type ContactMessageInput = {
  fullName: string;
  email: string;
  subject: string;
  message: string;
};

type AuthActionResult = {
  success: boolean;
  isAdmin: boolean;
  requiresEmailConfirmation?: boolean;
  message?: string;
};

type ActionResult = {
  success: boolean;
  message: string;
};

interface AppContextValue {
  session: Session | null;
  user: AppUser | null;
  authReady: boolean;
  isAuthenticated: boolean;
  membership: MembershipStats;
  analyses: DailyAnalysis[];
  dailyBiases: DailyBias[];
  altcoinPosts: AltcoinPost[];
  reviews: AfterActionReview[];
  requests: AnalysisRequest[];
  paymentRequests: PaymentRequest[];
  personalRequests: PersonalRequest[];
  adminUsers: AdminUserRecord[];
  favorites: FavoriteItem[];
  contactMessages: ContactMessage[];
  onboardingReady: boolean;
  hasCompletedOnboarding: boolean;
  authEmail: string;
  authPassword: string;
  authMessage: string;
  notifications: InAppNotification[];
  setAuthEmail: (value: string) => void;
  setAuthPassword: (value: string) => void;
  signInWithPassword: (email?: string, password?: string) => Promise<AuthActionResult>;
  signUpWithPassword: (email?: string, password?: string) => Promise<AuthActionResult>;
  requestMagicLink: (email?: string) => Promise<void>;
  signOut: () => Promise<void>;
  togglePlan: () => void;
  markUserAsPremium: (input: { identifier: string; durationDays?: number; planLabel?: string }) => Promise<ActionResult>;
  trackView: (premium: boolean) => void;
  toggleFavorite: (input: FavoriteToggleInput) => Promise<ActionResult>;
  createRequest: (input: NewRequestInput) => Promise<ActionResult>;
  createPaymentRequest: (input: NewPaymentRequestInput) => Promise<ActionResult>;
  createPersonalRequest: (input: NewPersonalRequestInput) => void;
  createContactMessage: (input: ContactMessageInput) => Promise<ActionResult>;
  updateProfileAbout: (input: ProfileAboutInput) => Promise<void>;
  changePassword: (password: string) => Promise<ActionResult>;
  publishAnalysis: (input: NewAnalysisInput) => void;
  updateAnalysis: (analysisId: string, input: NewAnalysisInput) => void;
  deleteAnalysis: (analysisId: string) => void;
  publishDailyBias: (input: NewDailyBiasInput) => void;
  updateDailyBias: (biasId: string, input: NewDailyBiasInput) => void;
  deleteDailyBias: (biasId: string) => void;
  publishAltcoinPost: (input: NewAltcoinPostInput) => void;
  updateAltcoinPost: (postId: string, input: NewAltcoinPostInput) => void;
  deleteAltcoinPost: (postId: string) => void;
  publishReview: (input: NewReviewInput) => void;
  updateReview: (reviewId: string, input: NewReviewInput) => void;
  deleteReview: (reviewId: string) => void;
  updateRequest: (requestId: string, input: RequestUpdateInput) => Promise<ActionResult>;
  updatePaymentRequest: (paymentRequestId: string, status: PaymentRequest["status"]) => Promise<ActionResult>;
  archivePaymentRequest: (paymentRequestId: string, archived: boolean) => Promise<ActionResult>;
  updatePersonalRequest: (requestId: string, input: NewPersonalRequestInput) => void;
  archivePersonalRequest: (requestId: string, archived: boolean) => Promise<ActionResult>;
  updateAdminUser: (input: { userId: string; role: "admin" | "user"; plan: UserPlan }) => void;
  updateContactMessageStatus: (contactMessageId: string, status: ContactMessage["status"]) => Promise<ActionResult>;
  archiveContactMessage: (contactMessageId: string, archived: boolean) => Promise<ActionResult>;
  replyToContactMessage: (input: { contactMessageId: string; body: string }) => Promise<ActionResult>;
  markNotificationRead: (notificationId: string) => void;
  completeOnboarding: () => Promise<void>;
  refreshProtectedData: () => Promise<void>;
}

const ONBOARDING_STORAGE_KEY = "execution-edge:onboarding-complete";
const IS_STATIC_WEB_RENDER = Platform.OS === "web" && typeof window === "undefined";
const baseStats = {
  userId: "",
  currentPlan: "FREE" as UserPlan,
  loginStreak: 0,
  totalViews: 0,
  premiumViews: 0,
  totalRequests: 0,
  engagementActions: 0,
};

const AppContext = createContext<AppContextValue | null>(null);

function getSessionKey(session: Session | null) {
  if (!session?.user) {
    return "guest";
  }

  return `${session.user.id}:${session.access_token.slice(-12)}`;
}

export function AppProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<AppUser | null>(null);
  const [authReady, setAuthReady] = useState(IS_STATIC_WEB_RENDER);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authMessage, setAuthMessage] = useState(
    "Autentifică-te cu email și parolă sau creează un cont nou pentru acces complet.",
  );
  const [currentPlan, setCurrentPlan] = useState<UserPlan>("FREE");
  const [stats, setStats] = useState(
    applyRank({
      ...baseStats,
      currentPlan: "FREE",
    }),
  );
  const [analysisState, setAnalysisState] = useState<DailyAnalysis[]>([]);
  const [dailyBiasState, setDailyBiasState] = useState<DailyBias[]>([]);
  const [altcoinPostState, setAltcoinPostState] = useState<AltcoinPost[]>([]);
  const [reviewState, setReviewState] = useState<AfterActionReview[]>([]);
  const [requestState, setRequestState] = useState<AnalysisRequest[]>([]);
  const [paymentRequestState, setPaymentRequestState] = useState<PaymentRequest[]>([]);
  const [personalRequestState, setPersonalRequestState] = useState<PersonalRequest[]>([]);
  const [adminUserState, setAdminUserState] = useState<AdminUserRecord[]>([]);
  const [favoriteState, setFavoriteState] = useState<FavoriteItem[]>([]);
  const [contactMessageState, setContactMessageState] = useState<ContactMessage[]>([]);
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [onboardingReady, setOnboardingReady] = useState(IS_STATIC_WEB_RENDER);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(IS_STATIC_WEB_RENDER);
  const lastHydratedSessionKeyRef = useRef<string>("guest");

  const resetAuthState = () => {
    setSession(null);
    setUser(null);
    setCurrentPlan("FREE");
    setStats(
      applyRank({
        ...baseStats,
        currentPlan: "FREE",
      }),
    );
    setRequestState([]);
    setPaymentRequestState([]);
    setPersonalRequestState([]);
    setAdminUserState([]);
    setFavoriteState([]);
    setContactMessageState([]);
  };

  const applySessionState = async (nextSession: Session | null) => {
    setSession(nextSession);

    const sessionUser = nextSession?.user;
    if (!sessionUser) {
      resetAuthState();
      return {
        user: null as AppUser | null,
        isAdmin: false,
      };
    }

    let loaded = await fetchProfileAndMembership(sessionUser.id);
    if (!loaded && sessionUser.email) {
      await ensureProfileAndMembershipRecord(sessionUser.id);
      loaded = await fetchProfileAndMembership(sessionUser.id);
    }

    if (!loaded) {
      const fallbackUser: AppUser = {
        id: sessionUser.id,
        name: sessionUser.email?.split("@")[0] ?? "Utilizator",
        email: sessionUser.email ?? "",
        isAdmin: isOwnerEmail(sessionUser.email),
        role: isOwnerEmail(sessionUser.email) ? "admin" : "user",
        savedMarkets: [],
      };

      const fallbackStats = applyRank({
        ...baseStats,
        userId: sessionUser.id,
        currentPlan: "FREE",
        planLabel: "Acces Gratuit",
        startedAt: new Date().toISOString(),
        expiresAt: undefined,
        renewalMode: "manual",
      });

      setUser(fallbackUser);
      setCurrentPlan("FREE");
      setStats(fallbackStats);
      return {
        user: fallbackUser,
        isAdmin: fallbackUser.isAdmin,
      };
    }

    if (isOwnerEmail(loaded.user.email)) {
      loaded = {
        ...loaded,
        user: {
          ...loaded.user,
          isAdmin: true,
          role: "admin",
        },
      };
    }

    setUser(loaded.user);
    setCurrentPlan(loaded.stats.currentPlan);
    setStats(loaded.stats);

    const [requestsResult, paymentRequestsResult, personalRequestsResult, adminUsersResult, favoritesResult, contactMessagesResult] = await Promise.all([
      fetchAnalysisRequests(),
      fetchPaymentRequests(),
      fetchPersonalRequests({
        userEmail: sessionUser.email ?? "",
        includeAll: loaded.user.isAdmin,
      }),
      fetchAdminUsers(),
      fetchFavorites(sessionUser.id),
      fetchContactMessages(),
    ]);

    setRequestState(!requestsResult.error && requestsResult.data ? requestsResult.data : []);
    setPaymentRequestState(!paymentRequestsResult.error && paymentRequestsResult.data ? paymentRequestsResult.data : []);
    setPersonalRequestState(!personalRequestsResult.error && personalRequestsResult.data ? personalRequestsResult.data : []);
    setAdminUserState(!adminUsersResult.error && adminUsersResult.data ? adminUsersResult.data : []);
    setFavoriteState(!favoritesResult.error && favoritesResult.data ? favoritesResult.data : []);
    setContactMessageState(!contactMessagesResult.error && contactMessagesResult.data ? contactMessagesResult.data : []);

    return {
      user: loaded.user,
      isAdmin: loaded.user.isAdmin,
    };
  };

  useEffect(() => {
    if (IS_STATIC_WEB_RENDER) {
      return;
    }

    void (async () => {
      const stored = await AsyncStorage.getItem(ONBOARDING_STORAGE_KEY);
      setHasCompletedOnboarding(stored === "true");
      setOnboardingReady(true);
    })();

    void (async () => {
      const [analysesResult, biasesResult, reviewsResult, altcoinsResult] = await Promise.all([
        fetchDailyAnalyses(),
        fetchDailyBiases(),
        fetchAfterActionReviews(),
        fetchAltcoinPosts(),
      ]);

      if (!analysesResult.error && analysesResult.data) {
        setAnalysisState(analysesResult.data);
      }

      if (!biasesResult.error && biasesResult.data) {
        setDailyBiasState(biasesResult.data);
      }

      if (!reviewsResult.error && reviewsResult.data) {
        setReviewState(reviewsResult.data);
      }

      if (!altcoinsResult.error && altcoinsResult.data) {
        setAltcoinPostState(altcoinsResult.data);
      }

    })();

    void (async () => {
      setAuthReady(false);
      const { data } = await getCurrentSession();
      const nextSession = data.session ?? null;
      const nextSessionKey = getSessionKey(nextSession);
      lastHydratedSessionKeyRef.current = nextSessionKey;
      await applySessionState(nextSession);
      setAuthReady(true);
    })();

    const { data: subscription } = subscribeToAuthChanges(async (_event, nextSession) => {
      const nextSessionKey = getSessionKey(nextSession);

      if (lastHydratedSessionKeyRef.current === nextSessionKey) {
        setAuthReady(true);
        return;
      }

      lastHydratedSessionKeyRef.current = nextSessionKey;
      setAuthReady(false);
      await applySessionState(nextSession);
      setAuthReady(true);
    });

    return () => {
      subscription.subscription.unsubscribe();
    };
  }, []);

  const membership = useMemo(
    () =>
      applyRank({
        ...stats,
        currentPlan,
      }),
    [currentPlan, stats],
  );

  const pushNotification = (title: string, body: string) => {
    setNotifications((prev) => [
      {
        id: `notif-${Date.now()}`,
        title,
        body,
        createdAt: new Date().toISOString(),
        read: false,
      },
      ...prev,
    ]);
  };

  const queueContentNotifications = (input: {
    title: string;
    body: string;
    premiumOnly?: boolean;
  }) => {
    adminUserState
      .filter((member) => (input.premiumOnly ? member.plan === "PRO" || member.role === "admin" : true))
      .forEach((member) => {
        void queueAccountEmailNotification({
          userId: member.id,
          email: member.email,
          eventName: "continut_nou",
          subject: input.title,
          body: input.body,
          metadata: {
            premiumOnly: input.premiumOnly ? "true" : "false",
          },
        });
      });
  };

  const ensureActiveProfile = async () => {
    const activeSessionUser = session?.user;

    if (!activeSessionUser?.id || !activeSessionUser.email) {
      return null;
    }

    let loaded = await fetchProfileAndMembership(activeSessionUser.id);

    if (!loaded) {
      await ensureProfileAndMembershipRecord(activeSessionUser.id);
      loaded = await fetchProfileAndMembership(activeSessionUser.id);
    }

    if (loaded) {
      setUser((prev) => {
        const nextUser = isOwnerEmail(loaded.user.email)
          ? {
              ...loaded.user,
              isAdmin: true,
              role: "admin" as const,
            }
          : loaded.user;

        if (
          prev &&
          prev.id === nextUser.id &&
          prev.savedMarkets.join(",") === nextUser.savedMarkets.join(",") &&
          prev.role === nextUser.role &&
          prev.isAdmin === nextUser.isAdmin
        ) {
          return prev;
        }

        return nextUser;
      });
      setCurrentPlan(loaded.stats.currentPlan);
      setStats(loaded.stats);
    }

    return loaded;
  };

  const refreshProtectedData = async () => {
    const activeSessionUser = session?.user;

    if (!activeSessionUser) {
      return;
    }

    const hydratedProfile = await ensureActiveProfile();
    const isAdmin = hydratedProfile?.user.isAdmin ?? isOwnerEmail(activeSessionUser.email);

    const [requestsResult, paymentRequestsResult, personalRequestsResult, adminUsersResult, favoritesResult, contactMessagesResult] = await Promise.all([
      fetchAnalysisRequests(),
      fetchPaymentRequests(),
      fetchPersonalRequests({
        userEmail: activeSessionUser.email ?? "",
        includeAll: isAdmin,
      }),
      fetchAdminUsers(),
      fetchFavorites(activeSessionUser.id),
      fetchContactMessages(),
    ]);

    setRequestState(!requestsResult.error && requestsResult.data ? requestsResult.data : []);
    setPaymentRequestState(!paymentRequestsResult.error && paymentRequestsResult.data ? paymentRequestsResult.data : []);
    setPersonalRequestState(!personalRequestsResult.error && personalRequestsResult.data ? personalRequestsResult.data : []);
    setAdminUserState(!adminUsersResult.error && adminUsersResult.data ? adminUsersResult.data : []);
    setFavoriteState(!favoritesResult.error && favoritesResult.data ? favoritesResult.data : []);
    setContactMessageState(!contactMessagesResult.error && contactMessagesResult.data ? contactMessagesResult.data : []);
  };

  useEffect(() => {
    if (IS_STATIC_WEB_RENDER) {
      return;
    }

    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active" && session?.user) {
        void refreshProtectedData();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [session?.user?.id]);

  const value = useMemo<AppContextValue>(
    () => ({
      session,
      user,
      authReady,
      isAuthenticated: Boolean(session?.user),
      membership,
      analyses: analysisState,
      dailyBiases: dailyBiasState,
      altcoinPosts: altcoinPostState,
      reviews: reviewState,
      requests: requestState.filter((request) =>
        user?.isAdmin
          ? true
          : request.userId === (session?.user?.id ?? user?.id) ||
            (request.requesterEmail ?? "").toLowerCase() === (session?.user?.email ?? user?.email ?? "").toLowerCase(),
      ),
      paymentRequests: paymentRequestState.filter((request) =>
        user?.isAdmin ? true : request.userId === (session?.user?.id ?? user?.id),
      ),
      personalRequests: personalRequestState.filter((request) =>
        user?.isAdmin
          ? true
          : request.userEmail.toLowerCase() === (session?.user?.email ?? user?.email ?? "").toLowerCase(),
      ),
      adminUsers: user?.isAdmin ? adminUserState : [],
      favorites: favoriteState,
      contactMessages: contactMessageState,
      onboardingReady,
      hasCompletedOnboarding,
      authEmail,
      authPassword,
      authMessage,
      notifications,
      setAuthEmail,
      setAuthPassword,
      signInWithPassword: async (emailInput, passwordInput) => {
        const email = (emailInput ?? authEmail).trim();
        const password = passwordInput ?? authPassword;

        if (!email || !password) {
          const message = "Introdu emailul și parola pentru autentificare.";
          setAuthMessage(message);
          return { success: false, isAdmin: false, message };
        }

        const { data, error } = await signInWithEmailPassword(email, password);
        if (error || !data.session) {
          const message = formatAuthErrorMessage(error?.message ?? "Autentificarea a eșuat.");
          setAuthMessage(message);
          return { success: false, isAdmin: false, message };
        }

        const result = await applySessionState(data.session);
        const message = "Autentificare reușită.";
        setAuthMessage(message);
        return {
          success: true,
          isAdmin: result.isAdmin,
          message,
        };
      },
      signUpWithPassword: async (emailInput, passwordInput) => {
        const email = (emailInput ?? authEmail).trim();
        const password = passwordInput ?? authPassword;

        if (!email || !password) {
          const message = "Introdu emailul și parola pentru a crea contul.";
          setAuthMessage(message);
          return { success: false, isAdmin: false, message };
        }

        const { data, error } = await signUpWithEmailPassword(email, password);

        if (error) {
          const message = formatAuthErrorMessage(error.message);
          setAuthMessage(message);
          return { success: false, isAdmin: false, message };
        }

        if (data.session) {
          const result = await applySessionState(data.session);
          const message = "Cont creat și autentificat.";
          setAuthMessage(message);
          return {
            success: true,
            isAdmin: result.isAdmin,
            message,
          };
        }

        const message = "Cont creat. Confirmă emailul din mesajul primit, apoi revino în aplicație și autentifică-te.";
        setAuthMessage(message);
        return {
          success: true,
          isAdmin: false,
          requiresEmailConfirmation: true,
          message,
        };
      },
      requestMagicLink: async (emailInput) => {
        const email = (emailInput ?? authEmail).trim();
        const { error } = await sendMagicLink(email);
        setAuthMessage(
          error
            ? `Trimiterea linkului de acces a eșuat: ${error.message}`
            : `Link de acces trimis către ${email}. Configurează cheia Supabase pentru fluxul complet.`,
        );
      },
      signOut: async () => {
        await signOutRemote();
        resetAuthState();
        setAuthMessage("Te-ai deconectat. Te poți autentifica din nou sau poți crea un cont nou.");
      },
      togglePlan: () => {
        setCurrentPlan((prev) => (prev === "FREE" ? "PRO" : "FREE"));
      },
      markUserAsPremium: async ({ identifier, durationDays = 30, planLabel = "Premium All Access" }) => {
        const normalizedIdentifier = identifier.trim().toLowerCase();
        await refreshProtectedData();
        const adminLookup = await fetchAdminUsers();
        const candidateUsers = adminLookup.data ?? adminUserState;
        let matchedUser = candidateUsers.find(
          (item) => item.id.toLowerCase() === normalizedIdentifier || item.email.toLowerCase() === normalizedIdentifier,
        );

        if (!matchedUser) {
          const lookupResult = await findAdminUserByIdentifier(normalizedIdentifier);
          matchedUser = lookupResult.data ?? undefined;
        }

        if (!matchedUser) {
          const message = "Nu am găsit un membru cu acest email sau ID.";
          setAuthMessage(message);
          return { success: false, message };
        }

        const planResult = await activateUserPlanByIdentifier({
          identifier: matchedUser.email || matchedUser.id,
          plan: "PRO",
          durationDays,
          planLabel,
        });

        if (planResult.error) {
          const message = `Nu am putut activa Premium. ${planResult.error.message ?? "Încearcă din nou."}`;
          return { success: false, message };
        }

        setAdminUserState((prev) =>
          prev.some((item) => item.id === matchedUser.id)
            ? prev.map((item) =>
                item.id === matchedUser.id
                  ? {
                      ...item,
                      plan: "PRO",
                    }
                  : item,
              )
            : [
                ...prev,
                {
                  ...matchedUser,
                  plan: "PRO",
                },
              ],
        );

        if (user?.id === matchedUser.id) {
          const nextExpiry =
            (planResult.data && "expires_at" in planResult.data ? (planResult.data.expires_at as string | null | undefined) : undefined) ??
            new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString();
          setCurrentPlan("PRO");
          setStats((prev) =>
            applyRank({
              ...prev,
              currentPlan: "PRO",
              planLabel,
              startedAt: new Date().toISOString(),
              expiresAt: nextExpiry,
              renewalMode: "manual",
            }),
          );
          setUser((prev) =>
            prev
              ? {
                  ...prev,
                  isAdmin: matchedUser.role === "admin",
                }
              : prev,
          );
        }

        void queueAccountEmailNotification({
          userId: matchedUser.id,
          email: matchedUser.email,
          eventName: "premium_validat",
          subject: "Premium activat",
          body: `Contul tău Premium este activ pentru ${durationDays} zile.`,
          metadata: {
            durationDays: String(durationDays),
            planLabel,
          },
        });

        const message = `Membrul ${matchedUser.email} a fost activat Premium pentru ${durationDays} zile.`;
        pushNotification("Plan actualizat", message);
        await refreshProtectedData();
        return { success: true, message };
      },
      trackView: (premium) => {
        setStats((prev) =>
          applyRank({
            ...prev,
            currentPlan,
            totalViews: prev.totalViews + 1,
            premiumViews: prev.premiumViews + (premium ? 1 : 0),
            engagementActions: prev.engagementActions + 1,
          }),
        );
      },
      toggleFavorite: async ({ contentType, contentId, title, subtitle, marketLabel }) => {
        const activeUserId = session?.user?.id ?? user?.id;

        if (!activeUserId) {
          const message = "Autentifică-te pentru a salva conținutul în Favorite.";
          pushNotification("Favorite indisponibile", message);
          return { success: false, message };
        }

        const existing = favoriteState.find(
          (item) => item.contentType === contentType && item.contentId === contentId,
        );

        if (existing) {
          const result = await deleteFavorite(activeUserId, contentType, contentId);

          if (result.error) {
            const message = `Nu am putut actualiza Favorite: ${result.error.message}`;
            pushNotification("Actualizare eșuată", message);
            return { success: false, message };
          }

          setFavoriteState((prev) => prev.filter((item) => item.id !== existing.id));
          const message = "Elementul a fost scos din Favorite.";
          pushNotification("Favorite actualizate", message);
          return { success: true, message };
        }

        const result = await createFavorite({
          user_id: activeUserId,
          content_type: contentType,
          content_id: contentId,
          title,
          subtitle,
          market_label: marketLabel,
        });

        if (result.error || !result.data) {
          const message = `Nu am putut salva în Favorite: ${result.error?.message ?? "încearcă din nou."}`;
          pushNotification("Actualizare eșuată", message);
          return { success: false, message };
        }

        setFavoriteState((prev) => [result.data!, ...prev]);
        const message = "Elementul a fost adăugat în Favorite.";
        pushNotification("Favorite actualizate", message);
        return { success: true, message };
      },
      createRequest: async ({ assetInput, requesterEmail, tier, notes, paymentProof, paymentReference }) => {
        const deliveryType = tier >= 5 ? "video" : "text";
        const normalizedInput = assetInput.trim();
        const normalizedSymbol = normalizedInput.toUpperCase();
        const activeUserId = session?.user?.id ?? user?.id;
        const hydratedProfile = activeUserId ? await ensureActiveProfile() : null;
        const fallbackEmail = session?.user?.email ?? hydratedProfile?.user.email ?? user?.email ?? authEmail;
        const ensureProfileResult =
          activeUserId && fallbackEmail
            ? await ensureProfileAndMembershipRecord(activeUserId, fallbackEmail)
            : { success: false, error: null };
        const requestUserId = ensureProfileResult.success ? activeUserId : hydratedProfile?.user.id ?? activeUserId ?? undefined;
        const contactEmail = (
          requesterEmail?.trim() ||
          fallbackEmail?.trim() ||
          ""
        ).trim();

        if (!requestUserId) {
          return {
            success: false,
            message: "Autentificarea membrului nu este sincronizată încă. Reautentifică-te și încearcă din nou.",
          };
        }

        const result = await createAnalysisRequest({
          user_id: requestUserId,
          requester_email: contactEmail || undefined,
          asset_input: normalizedInput,
          coin_symbol: normalizedSymbol,
          tier,
          notes,
          delivery_type: deliveryType,
          payment_proof: paymentProof,
          payment_reference: paymentReference,
        });

        if (result.error || !result.data) {
          return {
            success: false,
            message: `Solicitarea nu a putut fi salvată. ${result.error?.message ?? "Verifică datele și încearcă din nou."}`,
          };
        }

        const request = result.data;
        setRequestState((prev) => [request, ...prev]);
        setStats((prev) =>
          applyRank({
            ...prev,
            currentPlan,
            totalRequests: prev.totalRequests + 1,
            engagementActions: prev.engagementActions + 1,
          }),
        );
        pushNotification(
          "Solicitare primită",
          "Cererea a fost înregistrată. Plata se confirmă manual, iar livrarea începe după confirmare.",
        );
        const customerEmail = (
          request.requesterEmail?.trim() ||
          contactEmail ||
          fallbackEmail?.trim() ||
          ""
        ).trim();

        void queueRequestEmailNotification({
          event: "cerere_primită",
          userId: request.userId,
          email: customerEmail,
          requestId: request.id,
          subject: "Cererea ta a fost primită",
          body: "Solicitarea a fost înregistrată și așteaptă confirmarea.",
          metadata: {
            asset: request.assetInput,
            tier: String(request.tier),
          },
        });
        void queueRequestEmailNotification({
          event: "cerere_primită",
          userId: request.userId,
          email: OWNER_EMAIL,
          requestId: request.id,
          subject: "Cerere nouă de analiză personală",
          body: `Contact: ${contactEmail || "nespecificat"}\nActiv: ${request.assetInput}\nTier: $${request.tier}\nNote: ${request.notes || "-"}\nDovadă plată: ${request.paymentProof || "-"}\nReferință: ${request.paymentReference || "-"}`,
          metadata: {
            requesterEmail: contactEmail,
            paymentProof: request.paymentProof,
            paymentReference: request.paymentReference,
          },
        });
        return {
          success: true,
          message:
            "Solicitarea a fost înregistrată. O găsești în istoric, iar adminul o vede imediat în panoul de administrare.",
        };
      },
      createPaymentRequest: async ({
        planTarget,
        planLabel,
        durationDays,
        fullName,
        contactEmail,
        paymentMethod,
        paymentProof,
        transactionRef,
        notes,
      }) => {
        const activeUserId = session?.user?.id ?? user?.id;

        if (!activeUserId) {
          return {
            success: false,
            message: "Autentifică-te înainte să trimiți confirmarea pentru Premium.",
          };
        }

        await ensureActiveProfile();
        const ensureResult = await ensureProfileAndMembershipRecord(activeUserId, contactEmail || session?.user?.email || user?.email);

        if (!ensureResult.success) {
          return {
            success: false,
            message: `Confirmarea nu a putut fi pregătită. ${ensureResult.error?.message ?? "Reîncearcă după reautentificare."}`,
          };
        }

        const result = await persistPaymentRequest({
          user_id: activeUserId,
          plan_target: planTarget,
          plan_label: planLabel,
          duration_days: durationDays,
          full_name: fullName,
          contact_email: contactEmail,
          payment_method: paymentMethod,
          payment_proof: paymentProof,
          transaction_ref: transactionRef,
          notes,
        });

        if (result.error || !result.data) {
          return {
            success: false,
            message: `Confirmarea nu a putut fi salvată. ${result.error?.message ?? "Încearcă din nou după ce verifici datele."}`,
          };
        }

        const next = result.data;
        setPaymentRequestState((prev) => [next, ...prev]);
        void queueAccountEmailNotification({
          userId: activeUserId,
          email: contactEmail.trim(),
          eventName: "premium_trimisa",
          subject: "Confirmare Premium primită",
          body: "Contul tău Premium va deveni activ imediat ce plata este validată. Validarea poate dura până la 24 de ore.",
          metadata: {
            paymentMethod,
            durationDays: String(durationDays ?? 30),
            planLabel: planLabel ?? "Premium All Access",
          },
        });
        void queueAccountEmailNotification({
          userId: activeUserId,
          email: OWNER_EMAIL,
          eventName: "premium_nou_admin",
          subject: "Cerere nouă pentru upgrade Premium",
          body: `Client: ${fullName}\nEmail: ${contactEmail}\nPlan: ${planLabel ?? "Premium All Access"}\nDurată: ${durationDays ?? 30} zile\nMetodă: ${paymentMethod}\nDovadă: ${paymentProof}\nReferință: ${transactionRef || "-"}`,
          metadata: {
            paymentRequestId: next.id,
            contactEmail,
          },
        });
        pushNotification(
          "Confirmare trimisă",
          "Confirmarea plății a fost trimisă. Verificarea manuală poate dura până la 24h.",
        );
        return {
          success: true,
          message: "Contul tău Premium va deveni activ imediat ce plata este validată. Validarea poate dura până la 24 de ore.",
        };
      },
      createPersonalRequest: ({ userEmail, title, videoUrl, notes, tier, status }) => {
        const next: PersonalRequest = {
          id: `personal-${Date.now()}`,
          userEmail,
          title,
          videoUrl,
          notes,
          tier,
          status,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        setPersonalRequestState((prev) => [next, ...prev]);
        void persistPersonalRequest({
          user_email: next.userEmail,
          title: next.title,
          video_url: next.videoUrl,
          notes: next.notes,
          tier: next.tier,
          status: next.status,
        }).then((result) => {
          if (result.error || !result.data) {
            pushNotification(
              "Salvare eșuată",
              `Analiza personală nu a putut fi salvată în baza de date: ${result.error?.message ?? "încearcă din nou."}`,
            );
            return;
          }

          setPersonalRequestState((prev) =>
            prev.map((item) => (item.id === next.id ? result.data! : item)),
          );
          pushNotification("Analiză personală salvată", "Livrarea privată este acum vizibilă în aplicație.");
        });
      },
      createContactMessage: async ({ fullName, email, subject, message }) => {
        const activeUserId = session?.user?.id ?? user?.id;
        const result = await persistContactMessage({
          user_id: activeUserId,
          full_name: fullName.trim(),
          email: email.trim(),
          subject: subject.trim(),
          message: message.trim(),
        });

        if (result.error || !result.data) {
          return {
            success: false,
            message: `Mesajul nu a putut fi trimis. ${result.error?.message ?? "Încearcă din nou."}`,
          };
        }

        if (user?.isAdmin) {
          setContactMessageState((prev) => [result.data!, ...prev]);
        }

        if (activeUserId) {
          void queueAccountEmailNotification({
            userId: activeUserId,
            email: OWNER_EMAIL,
            eventName: "contact_nou",
            subject: `Mesaj nou din aplicație: ${subject.trim()}`,
            body: `Nume: ${fullName.trim()}\nEmail: ${email.trim()}\n\n${message.trim()}`,
            metadata: {
              contactEmail: email.trim(),
            },
          });
        }

        pushNotification("Mesaj trimis", "Mesajul tău a fost trimis și este disponibil în Admin.");
        return {
          success: true,
          message: "Mesajul a fost trimis. Revenim pe email cât mai curând.",
        };
      },
      updateProfileAbout: async (input) => {
        const activeUserId = session?.user?.id ?? user?.id;

        if (!activeUserId) {
          setAuthMessage("Autentifică-te pentru a-ți salva profilul.");
          return;
        }

        const result = await updateProfileAbout(activeUserId, input);

        if (result.error) {
          pushNotification("Profil neactualizat", `Nu am putut salva secțiunea „Despre mine”. ${result.error.message}`);
          return;
        }

        setUser((prev) =>
          prev
            ? {
                ...prev,
                name: input.displayName,
                bio: input.bio,
                tradingExperience: input.tradingExperience,
                tradedMarkets: input.tradedMarkets,
                tradingStyle: input.tradingStyle,
                preferredSessions: input.preferredSessions,
                focusedSetups: input.focusedSetups,
                currentGoal: input.currentGoal,
                memberProfileVisibility: input.memberProfileVisibility,
              }
            : prev,
        );
        pushNotification("Profil actualizat", "Secțiunea „Despre mine” a fost salvată.");
      },
      changePassword: async (password) => {
        const { error } = await updatePasswordRemote(password);

        if (error) {
          return {
            success: false,
            message: error.message,
          };
        }

        pushNotification("Parolă actualizată", "Parola contului a fost schimbată cu succes.");
        return {
          success: true,
          message: "Parola a fost actualizată.",
        };
      },
      publishAnalysis: (input) => {
        const next: DailyAnalysis = {
          ...input,
          id: `analysis-${input.market.toLowerCase()}-${Date.now()}`,
          publishedAt: normalizeIsoDate(input.publishedAt),
        };

        setAnalysisState((prev) => [next, ...prev]);
        pushNotification("Conținut nou publicat", `${next.market}: ${next.title}`);
        queueContentNotifications({
          title: `Analiză nouă ${next.market}`,
          body: next.title,
          premiumOnly: next.isPremium,
        });
        void publishDailyAnalysis({
          market: next.market,
          title: next.title,
          summary: next.summary,
          chart_images: next.chartImages,
          video_url: next.videoUrl,
          is_premium: next.isPremium,
          tags: next.tags,
          status: next.status,
          published_at: next.publishedAt,
        });
      },
      updateAnalysis: (analysisId, input) => {
        setAnalysisState((prev) =>
          prev.map((item) =>
            item.id === analysisId
              ? {
                  ...item,
                  ...input,
                  publishedAt: normalizeIsoDate(input.publishedAt, item.publishedAt),
                }
              : item,
          ),
        );

        void updateDailyAnalysis(analysisId, {
          market: input.market,
          title: input.title,
          summary: input.summary,
          chart_images: input.chartImages,
          video_url: input.videoUrl,
          is_premium: input.isPremium,
          tags: input.tags,
          status: input.status,
          published_at: input.publishedAt,
        });
      },
      deleteAnalysis: (analysisId) => {
        setAnalysisState((prev) => prev.filter((item) => item.id !== analysisId));
        void deleteDailyAnalysis(analysisId);
      },
      publishDailyBias: (input) => {
        const next: DailyBias = {
          ...input,
          id: `bias-${input.market.toLowerCase()}-${Date.now()}`,
          publishedAt: normalizeIsoDate(input.publishedAt),
        };

        setDailyBiasState((prev) => [next, ...prev]);
        void publishDailyBiasRemote(next).then((result) => {
          if (result.data) {
            setDailyBiasState((prev) => prev.map((item) => (item.id === next.id ? result.data! : item)));
          }
        });
      },
      updateDailyBias: (biasId, input) => {
        const existing = dailyBiasState.find((item) => item.id === biasId);
        const next = {
          ...input,
          publishedAt: normalizeIsoDate(input.publishedAt, existing?.publishedAt),
        };

        setDailyBiasState((prev) => prev.map((item) => (item.id === biasId ? { ...item, ...next } : item)));
        void updateDailyBiasRemote(biasId, next);
      },
      deleteDailyBias: (biasId) => {
        setDailyBiasState((prev) => prev.filter((item) => item.id !== biasId));
        void deleteDailyBiasRemote(biasId);
      },
      publishAltcoinPost: (input) => {
        const next: AltcoinPost = {
          ...input,
          id: `altcoin-${input.coinSymbol.toLowerCase()}-${Date.now()}`,
          publishedAt: normalizeIsoDate(input.publishedAt),
        };

        setAltcoinPostState((prev) => [next, ...prev]);
        pushNotification("Altcoin nou publicat", `${next.coinSymbol}: ${next.title}`);
        queueContentNotifications({
          title: `Postare nouă Altcoins: ${next.coinSymbol}`,
          body: next.title,
          premiumOnly: next.isPremium,
        });
        void publishAltcoinPost({
          coin_symbol: next.coinSymbol,
          title: next.title,
          summary: next.summary,
          body_text: next.bodyText,
          chart_image: next.chartImage,
          video_url: next.videoUrl,
          is_premium: next.isPremium,
          published_at: next.publishedAt,
        });
      },
      updateAltcoinPost: (postId, input) => {
        setAltcoinPostState((prev) =>
          prev.map((item) =>
            item.id === postId
              ? {
                  ...item,
                  ...input,
                  publishedAt: normalizeIsoDate(input.publishedAt, item.publishedAt),
                }
              : item,
          ),
        );

        void updateAltcoinPost(postId, {
          coin_symbol: input.coinSymbol,
          title: input.title,
          summary: input.summary,
          body_text: input.bodyText,
          chart_image: input.chartImage,
          video_url: input.videoUrl,
          is_premium: input.isPremium,
          published_at: input.publishedAt,
        });
      },
      deleteAltcoinPost: (postId) => {
        setAltcoinPostState((prev) => prev.filter((item) => item.id !== postId));
        void deleteAltcoinPost(postId);
      },
      publishReview: (input) => {
        const next: AfterActionReview = {
          ...input,
          id: `review-${input.market.toLowerCase()}-${Date.now()}`,
          publishedAt: normalizeIsoDate(input.publishedAt),
          isFree: true,
        };

        setReviewState((prev) => [next, ...prev]);
        pushNotification("AAR nou publicat", `${next.market}: ${next.title}`);
        queueContentNotifications({
          title: `After Action Review nou: ${next.market}`,
          body: next.title,
          premiumOnly: false,
        });
        void publishAfterActionReview({
          market: next.market,
          title: next.title,
          short_text: next.shortText,
          chart_image: next.chartImage,
          body_text: next.bodyText,
          video_url: next.videoUrl,
          published_at: next.publishedAt,
        });
      },
      updateReview: (reviewId, input) => {
        setReviewState((prev) =>
          prev.map((item) =>
            item.id === reviewId
              ? {
                  ...item,
                  ...input,
                  publishedAt: normalizeIsoDate(input.publishedAt, item.publishedAt),
                }
              : item,
          ),
        );

        void updateAfterActionReview(reviewId, {
          market: input.market,
          title: input.title,
          short_text: input.shortText,
          chart_image: input.chartImage,
          body_text: input.bodyText,
          video_url: input.videoUrl,
          published_at: input.publishedAt,
        });
      },
      deleteReview: (reviewId) => {
        setReviewState((prev) => prev.filter((item) => item.id !== reviewId));
        void deleteAfterActionReview(reviewId);
      },
      updateRequest: async (requestId, input) => {
        const existing = requestState.find((item) => item.id === requestId);

        if (!existing) {
          return {
            success: false,
            message: "Solicitarea nu a fost găsită.",
          };
        }

        const persisted = await updateAnalysisRequest(requestId, {
          status: input.status,
          payment_status: input.paymentStatus,
          admin_notes: input.deliveryNotes,
          delivery_url: input.deliveryVideoUrl,
          delivery_notes: input.deliveryNotes,
          delivery_video_url: input.deliveryVideoUrl,
        });

        if (persisted.error) {
          return {
            success: false,
            message: `Actualizarea solicitării a eșuat. ${persisted.error.message}`,
          };
        }

        const nextRequest =
          persisted.data ??
          {
            ...existing,
            status: input.status,
            paymentStatus: input.paymentStatus ?? existing.paymentStatus,
            deliveryNotes: input.deliveryNotes ?? existing.deliveryNotes,
            adminNotes: input.deliveryNotes ?? existing.adminNotes,
            deliveryUrl: input.deliveryVideoUrl ?? existing.deliveryUrl,
            deliveryVideoUrl: input.deliveryVideoUrl ?? existing.deliveryVideoUrl,
            fulfilledAt: input.status === "delivered" ? new Date().toISOString() : existing.fulfilledAt,
            deliveredAt: input.status === "delivered" ? new Date().toISOString() : existing.deliveredAt,
            updatedAt: new Date().toISOString(),
          };

        setRequestState((prev) =>
          prev.map((item) => (item.id === requestId ? nextRequest : item)),
        );

        if (existing.userId) {
          void createRequestStatusEvent({
            request_id: requestId,
            user_id: existing.userId,
            status: input.status,
          });
        }

        const notificationBody =
          input.status === "delivered"
            ? "Analiza ta este gata."
            : input.status === "accepted"
              ? "Solicitarea ta a fost acceptată. Timpul de livrare a început."
              : input.status === "cancelled"
                ? "Solicitarea ta a fost anulată."
                : "Solicitarea ta este în așteptare.";

        if (user?.id === existing.userId || user?.isAdmin) {
          pushNotification("Actualizare solicitare", notificationBody);
        }

        const requestOwnerProfile =
          existing.userId && existing.userId !== "guest" ? await fetchProfileAndMembership(existing.userId) : null;
        const requestRecipientEmail =
          nextRequest.requesterEmail?.trim() ||
          existing.requesterEmail?.trim() ||
          requestOwnerProfile?.user.email?.trim() ||
          (session?.user?.id === existing.userId ? session.user.email?.trim() : "") ||
          "";

        if (!requestRecipientEmail) {
          await refreshProtectedData();
          return {
            success: false,
            message: "Solicitarea a fost actualizată, dar nu am găsit emailul membrului pentru notificare.",
          };
        }

        void queueRequestEmailNotification({
          event:
            input.status === "accepted"
              ? "cerere_acceptată"
              : input.status === "delivered"
                ? "cerere_livrată"
                : "cerere_primită",
          userId: existing.userId,
          email: requestRecipientEmail,
          requestId,
          subject: "Actualizare solicitare",
          body: notificationBody,
          metadata: {
            asset: existing.assetInput,
            deliveryUrl: nextRequest.deliveryVideoUrl ?? nextRequest.deliveryUrl,
            deliveryNotes: nextRequest.deliveryNotes,
          },
        });

        await refreshProtectedData();
        return {
          success: true,
          message: "Solicitarea a fost actualizată.",
        };
      },
      updatePaymentRequest: async (paymentRequestId, status) => {
        const existing = paymentRequestState.find((item) => item.id === paymentRequestId);

        if (!existing) {
          return {
            success: false,
            message: "Cererea de plată nu a fost găsită.",
          };
        }

        if (status === "verified" && existing.userId) {
          const planResult = await activateUserPlanByIdentifier({
            identifier: existing.contactEmail?.trim() || existing.userId,
            plan: existing.planTarget,
            durationDays: existing.durationDays ?? 30,
            planLabel: existing.planLabel ?? "Premium All Access",
          });

          if (planResult.error) {
            return {
              success: false,
              message: `Plata a fost validată, dar activarea Premium a eșuat. ${planResult.error.message ?? "Verifică politicile și reîncearcă."}`,
            };
          }
        }

        const persisted = await persistPaymentRequestUpdate(paymentRequestId, { status });

        if (persisted.error) {
          return {
            success: false,
            message: `Actualizarea plății a eșuat. ${persisted.error?.message ?? "Încearcă din nou."}`,
          };
        }

        const nextPaymentRequest =
          persisted.data ??
          {
            ...existing,
            status,
            verifiedAt: status === "verified" ? new Date().toISOString() : existing.verifiedAt,
          };

        setPaymentRequestState((prev) =>
          prev.map((item) => (item.id === paymentRequestId ? nextPaymentRequest : item)),
        );

        if (status === "verified" && existing.userId) {
          void queueAccountEmailNotification({
            userId: existing.userId,
            email: existing.contactEmail,
            eventName: "premium_validat",
            subject: "Premium activat",
            body: `Plata a fost validată. Accesul tău ${existing.planLabel ?? "Premium All Access"} este activ pentru ${existing.durationDays ?? 30} zile.`,
            metadata: {
              planLabel: existing.planLabel ?? "Premium All Access",
              durationDays: String(existing.durationDays ?? 30),
            },
          });
        } else if (status === "rejected" && existing.userId) {
          void queueAccountEmailNotification({
            userId: existing.userId,
            email: existing.contactEmail,
            eventName: "premium_respins",
            subject: "Confirmare Premium respinsă",
            body: "Confirmarea trimisă pentru Premium a fost respinsă. Verifică dovada plății și retrimite cererea dacă este nevoie.",
            metadata: {
              paymentRequestId: paymentRequestId,
            },
          });
        }

        const message =
          status === "verified"
            ? "Plata a fost validată, iar contul utilizatorului a fost activat imediat pe Premium."
            : status === "rejected"
              ? "Cererea a fost respinsă și utilizatorul rămâne pe planul curent."
              : "Cererea a fost actualizată.";

        pushNotification("Confirmare Premium actualizată", message);
        await refreshProtectedData();
        return {
          success: true,
          message,
        };
      },
      archivePaymentRequest: async (paymentRequestId, archived) => {
        const existing = paymentRequestState.find((item) => item.id === paymentRequestId);
        const archiverId = session?.user?.id ?? user?.id;

        if (!existing) {
          return {
            success: false,
            message: "Cererea de plată nu a fost găsită.",
          };
        }

        if (!archiverId) {
          return {
            success: false,
            message: "Autentifică-te din nou înainte să arhivezi această cerere.",
          };
        }

        const archivedAt = archived ? new Date().toISOString() : null;
        const persisted = await persistPaymentRequestUpdate(paymentRequestId, {
          archived_at: archivedAt,
          archived_by: archived ? archiverId : null,
        });

        if (persisted.error || !persisted.data) {
          return {
            success: false,
            message: `Nu am putut actualiza arhiva pentru această cerere. ${persisted.error?.message ?? "Încearcă din nou."}`,
          };
        }

        setPaymentRequestState((prev) =>
          prev.map((item) => (item.id === paymentRequestId ? persisted.data! : item)),
        );

        return {
          success: true,
          message: archived ? "Cererea a fost arhivată." : "Cererea a fost readusă în lista activă.",
        };
      },
      updatePersonalRequest: (requestId, input) => {
        setPersonalRequestState((prev) =>
          prev.map((item) =>
            item.id === requestId
              ? {
                  ...item,
                  userEmail: input.userEmail,
                  title: input.title,
                  videoUrl: input.videoUrl,
                  notes: input.notes,
                  tier: input.tier,
                  status: input.status,
                  updatedAt: new Date().toISOString(),
                }
              : item,
          ),
        );

        void persistPersonalRequestUpdate(requestId, {
          user_email: input.userEmail,
          title: input.title,
          video_url: input.videoUrl,
          notes: input.notes,
          tier: input.tier,
          status: input.status,
        });
      },
      archivePersonalRequest: async (requestId, archived) => {
        const existing = personalRequestState.find((item) => item.id === requestId);
        const archiverId = session?.user?.id ?? user?.id;

        if (!existing) {
          return {
            success: false,
            message: "Cererea personală nu a fost găsită.",
          };
        }

        if (!archiverId) {
          return {
            success: false,
            message: "Autentifică-te din nou înainte să arhivezi această cerere.",
          };
        }

        const archivedAt = archived ? new Date().toISOString() : null;
        const persisted = await persistPersonalRequestUpdate(requestId, {
          user_email: existing.userEmail,
          title: existing.title,
          video_url: existing.videoUrl,
          notes: existing.notes,
          tier: existing.tier,
          status: existing.status,
          archived_at: archivedAt,
          archived_by: archived ? archiverId : null,
        });

        if (persisted.error || !persisted.data) {
          return {
            success: false,
            message: `Nu am putut actualiza arhiva pentru această livrare. ${persisted.error?.message ?? "Încearcă din nou."}`,
          };
        }

        setPersonalRequestState((prev) =>
          prev.map((item) => (item.id === requestId ? persisted.data! : item)),
        );

        return {
          success: true,
          message: archived ? "Cererea a fost arhivată." : "Cererea a fost readusă în lista activă.",
        };
      },
      updateAdminUser: ({ userId, role, plan }) => {
        void updateUserAccess({ userId, role, plan, durationDays: plan === "PRO" ? 30 : undefined });
        setAdminUserState((prev) =>
          prev.map((item) =>
            item.id === userId
              ? {
                  ...item,
                  role,
                  plan,
                }
              : item,
          ),
        );

        if ((session?.user?.id ?? user?.id) === userId) {
          setUser((prev) => (prev ? { ...prev, isAdmin: role === "admin", role } : prev));
          setCurrentPlan(plan);
        }
      },
      updateContactMessageStatus: async (contactMessageId, status) => {
        const result = await persistContactMessageStatus(contactMessageId, status);

        if (result.error || !result.data) {
          return {
            success: false,
            message: `Mesajul nu a putut fi actualizat. ${result.error?.message ?? "Încearcă din nou."}`,
          };
        }

        setContactMessageState((prev) =>
          prev.map((item) => (item.id === contactMessageId ? result.data! : item)),
        );

        return {
          success: true,
          message: "Statusul mesajului a fost actualizat.",
        };
      },
      archiveContactMessage: async (contactMessageId, archived) => {
        const existing = contactMessageState.find((item) => item.id === contactMessageId);
        const archiverId = session?.user?.id ?? user?.id;

        if (!existing) {
          return {
            success: false,
            message: "Mesajul nu a fost găsit.",
          };
        }

        if (!archiverId) {
          return {
            success: false,
            message: "Autentifică-te din nou înainte să arhivezi acest mesaj.",
          };
        }

        const persisted = await persistContactMessageArchive(contactMessageId, {
          archived_at: archived ? new Date().toISOString() : null,
          archived_by: archived ? archiverId : null,
        });

        if (persisted.error || !persisted.data) {
          return {
            success: false,
            message: `Mesajul nu a putut fi arhivat. ${persisted.error?.message ?? "Încearcă din nou."}`,
          };
        }

        setContactMessageState((prev) =>
          prev.map((item) =>
            item.id === contactMessageId
              ? {
                  ...item,
                  ...persisted.data!,
                  replies: existing.replies,
                }
              : item,
          ),
        );

        return {
          success: true,
          message: archived ? "Mesajul a fost arhivat." : "Mesajul a fost readus în lista activă.",
        };
      },
      replyToContactMessage: async ({ contactMessageId, body }) => {
        const message = contactMessageState.find((item) => item.id === contactMessageId);

        if (!message) {
          return {
            success: false,
            message: "Mesajul nu a fost găsit.",
          };
        }

        if (!body.trim()) {
          return {
            success: false,
            message: "Scrie un răspuns înainte să îl trimiți.",
          };
        }

        const senderName = user?.name ?? session?.user?.email ?? "Admin";
        const replyResult = await persistContactMessageReply({
          message_id: contactMessageId,
          sender_role: "admin",
          sender_name: senderName,
          body: body.trim(),
        });

        if (replyResult.error || !replyResult.data) {
          return {
            success: false,
            message: `Răspunsul nu a putut fi salvat. ${replyResult.error?.message ?? "Încearcă din nou."}`,
          };
        }

        const statusResult = await persistContactMessageStatus(contactMessageId, "replied");
        const nextMessage = statusResult.data
          ? {
              ...statusResult.data,
              replies: [...(message.replies ?? []), replyResult.data],
            }
          : {
              ...message,
              status: "replied" as const,
              replies: [...(message.replies ?? []), replyResult.data],
            };

        setContactMessageState((prev) =>
          prev.map((item) => (item.id === contactMessageId ? nextMessage : item)),
        );

        if (message.userId) {
          void queueAccountEmailNotification({
            userId: message.userId,
            email: message.email,
            eventName: "mesaj_admin",
            subject: `Răspuns nou: ${message.subject}`,
            body: body.trim(),
            metadata: {
              contactMessageId,
            },
          });
        }

        pushNotification("Răspuns trimis", "Mesajul este acum vizibil în conversația membrului.");
        return {
          success: true,
          message: "Răspunsul a fost trimis în aplicație.",
        };
      },
      markNotificationRead: (notificationId) => {
        setNotifications((prev) =>
          prev.map((item) =>
            item.id === notificationId
              ? { ...item, read: true }
              : item,
          ),
        );
      },
      completeOnboarding: async () => {
        await AsyncStorage.setItem(ONBOARDING_STORAGE_KEY, "true");
        setHasCompletedOnboarding(true);
      },
      refreshProtectedData,
    }),
    [
      session,
      authReady,
      analysisState,
      dailyBiasState,
      authEmail,
      authMessage,
      authPassword,
      currentPlan,
      hasCompletedOnboarding,
      membership,
      notifications,
      onboardingReady,
      paymentRequestState,
      personalRequestState,
      refreshProtectedData,
      altcoinPostState,
      adminUserState,
      contactMessageState,
      favoriteState,
      requestState,
      reviewState,
      user,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppState() {
  const context = useContext(AppContext);

  if (!context) {
    throw new Error("useAppState must be used within AppProvider");
  }

  return context;
}
