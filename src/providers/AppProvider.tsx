import { PropsWithChildren, createContext, useContext, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Session } from "@supabase/supabase-js";
import { Platform } from "react-native";

import { dailyAnalyses, demoMembership, demoUser, requestHistory, reviews } from "@/data/seed";
import { deleteDailyAnalysis, fetchDailyAnalyses, publishDailyAnalysis, updateDailyAnalysis } from "@/features/content/analyses";
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
  ensureProfileAndMembership,
  fetchAdminUsers,
  fetchProfileAndMembership,
  markUserPlan,
  updateProfileAbout,
  updateUserAccess,
} from "@/features/auth/profile";
import { createPaymentRequest as persistPaymentRequest, fetchPaymentRequests, updatePaymentRequest as persistPaymentRequestUpdate } from "@/features/payments/service";
import {
  createPersonalRequest as persistPersonalRequest,
  fetchPersonalRequests,
  updatePersonalRequest as persistPersonalRequestUpdate,
} from "@/features/personal-requests/service";
import { queueRequestEmailNotification } from "@/features/requests/notifications";
import { createAnalysisRequest, createRequestStatusEvent, fetchAnalysisRequests, updateAnalysisRequest } from "@/features/requests/service";
import { applyRank } from "@/lib/rank";
import {
  AdminUserRecord,
  AnalysisRequest,
  AppUser,
  AfterActionReview,
  DailyAnalysis,
  InAppNotification,
  MembershipStats,
  PaymentRequest,
  PaymentStatus,
  PersonalRequest,
  RequestTier,
  UserPlan,
} from "@/types/domain";

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

type AuthActionResult = {
  success: boolean;
  isAdmin: boolean;
  requiresEmailConfirmation?: boolean;
  message?: string;
};

interface AppContextValue {
  session: Session | null;
  user: AppUser | null;
  authReady: boolean;
  isAuthenticated: boolean;
  membership: MembershipStats;
  analyses: DailyAnalysis[];
  reviews: AfterActionReview[];
  requests: AnalysisRequest[];
  paymentRequests: PaymentRequest[];
  personalRequests: PersonalRequest[];
  adminUsers: AdminUserRecord[];
  onboardingReady: boolean;
  hasCompletedOnboarding: boolean;
  authEmail: string;
  authPassword: string;
  authMessage: string;
  notifications: InAppNotification[];
  setAuthEmail: (value: string) => void;
  setAuthPassword: (value: string) => void;
  signInAsDemo: () => void;
  signInWithPassword: (email?: string, password?: string) => Promise<AuthActionResult>;
  signUpWithPassword: (email?: string, password?: string) => Promise<AuthActionResult>;
  requestMagicLink: (email?: string) => Promise<void>;
  signOut: () => Promise<void>;
  togglePlan: () => void;
  markUserAsPremium: (userId: string) => Promise<void>;
  trackView: (premium: boolean) => void;
  saveMarket: (market: AppUser["savedMarkets"][number]) => void;
  createRequest: (input: NewRequestInput) => void;
  createPaymentRequest: (input: NewPaymentRequestInput) => void;
  createPersonalRequest: (input: NewPersonalRequestInput) => void;
  updateProfileAbout: (input: ProfileAboutInput) => Promise<void>;
  publishAnalysis: (input: NewAnalysisInput) => void;
  updateAnalysis: (analysisId: string, input: NewAnalysisInput) => void;
  deleteAnalysis: (analysisId: string) => void;
  publishReview: (input: NewReviewInput) => void;
  updateReview: (reviewId: string, input: NewReviewInput) => void;
  deleteReview: (reviewId: string) => void;
  updateRequest: (requestId: string, input: RequestUpdateInput) => void;
  updatePaymentRequest: (paymentRequestId: string, status: PaymentRequest["status"]) => void;
  updatePersonalRequest: (requestId: string, input: NewPersonalRequestInput) => void;
  updateAdminUser: (input: { userId: string; role: "admin" | "user"; plan: UserPlan }) => void;
  markNotificationRead: (notificationId: string) => void;
  completeOnboarding: () => Promise<void>;
}

const ONBOARDING_STORAGE_KEY = "execution-edge:onboarding-complete";
const IS_STATIC_WEB_RENDER = Platform.OS === "web" && typeof window === "undefined";

const baseStats = {
  userId: demoMembership.userId,
  currentPlan: demoMembership.currentPlan,
  loginStreak: demoMembership.loginStreak,
  totalViews: demoMembership.totalViews,
  premiumViews: demoMembership.premiumViews,
  totalRequests: demoMembership.totalRequests,
  engagementActions: demoMembership.engagementActions,
};

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<AppUser | null>(null);
  const [authReady, setAuthReady] = useState(IS_STATIC_WEB_RENDER);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authMessage, setAuthMessage] = useState(
    "Autentifică-te cu email și parolă sau creează un cont nou pentru acces complet.",
  );
  const [currentPlan, setCurrentPlan] = useState<UserPlan>(demoMembership.currentPlan);
  const [stats, setStats] = useState(
    applyRank({
      ...baseStats,
      currentPlan: demoMembership.currentPlan,
    }),
  );
  const [analysisState, setAnalysisState] = useState<DailyAnalysis[]>(dailyAnalyses);
  const [reviewState, setReviewState] = useState<AfterActionReview[]>(reviews);
  const [requestState, setRequestState] = useState<AnalysisRequest[]>(requestHistory);
  const [paymentRequestState, setPaymentRequestState] = useState<PaymentRequest[]>([]);
  const [personalRequestState, setPersonalRequestState] = useState<PersonalRequest[]>([]);
  const [adminUserState, setAdminUserState] = useState<AdminUserRecord[]>([]);
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [onboardingReady, setOnboardingReady] = useState(IS_STATIC_WEB_RENDER);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(IS_STATIC_WEB_RENDER);

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
      await ensureProfileAndMembership(sessionUser.id, sessionUser.email);
      loaded = await fetchProfileAndMembership(sessionUser.id);
    }

    if (!loaded) {
      resetAuthState();
      setSession(nextSession);
      return {
        user: null as AppUser | null,
        isAdmin: false,
      };
    }

    setUser(loaded.user);
    setCurrentPlan(loaded.stats.currentPlan);
    setStats(loaded.stats);

    const [requestsResult, paymentRequestsResult, personalRequestsResult, adminUsersResult] = await Promise.all([
      fetchAnalysisRequests(),
      fetchPaymentRequests(),
      fetchPersonalRequests({
        userEmail: sessionUser.email ?? "",
        includeAll: loaded.user.isAdmin,
      }),
      fetchAdminUsers(),
    ]);

    setRequestState(!requestsResult.error && requestsResult.data ? requestsResult.data : []);
    setPaymentRequestState(!paymentRequestsResult.error && paymentRequestsResult.data ? paymentRequestsResult.data : []);
    setPersonalRequestState(!personalRequestsResult.error && personalRequestsResult.data ? personalRequestsResult.data : []);
    setAdminUserState(!adminUsersResult.error && adminUsersResult.data ? adminUsersResult.data : []);

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
      const [analysesResult, reviewsResult] = await Promise.all([fetchDailyAnalyses(), fetchAfterActionReviews()]);

      if (!analysesResult.error && analysesResult.data?.length) {
        setAnalysisState(analysesResult.data);
      }

      if (!reviewsResult.error && reviewsResult.data?.length) {
        setReviewState(reviewsResult.data);
      }
    })();

    void (async () => {
      setAuthReady(false);
      const { data } = await getCurrentSession();
      await applySessionState(data.session ?? null);
      setAuthReady(true);
    })();

    const { data: subscription } = subscribeToAuthChanges(async (_event, nextSession) => {
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

  const value = useMemo<AppContextValue>(
    () => ({
      session,
      user,
      authReady,
      isAuthenticated: Boolean(session?.user && user),
      membership,
      analyses: analysisState,
      reviews: reviewState,
      requests: requestState.filter((request) => (user?.isAdmin ? true : request.userId === user?.id)),
      paymentRequests: paymentRequestState.filter((request) => (user?.isAdmin ? true : request.userId === user?.id)),
      personalRequests: personalRequestState.filter((request) =>
        user?.isAdmin ? true : request.userEmail.toLowerCase() === (user?.email ?? "").toLowerCase(),
      ),
      adminUsers: user?.isAdmin ? adminUserState : [],
      onboardingReady,
      hasCompletedOnboarding,
      authEmail,
      authPassword,
      authMessage,
      notifications,
      setAuthEmail,
      setAuthPassword,
      signInAsDemo: () => {
        setSession(null);
        setUser(demoUser);
      },
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

        const { data, error } = await signUpWithEmailPassword(email, password, {
          role: "user",
          plan: "free",
        });

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

        const message = "Cont creat. Verifică emailul pentru confirmare, apoi autentifică-te.";
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
      markUserAsPremium: async (userId) => {
        if (!userId) {
          setAuthMessage("ID-ul utilizatorului lipsește. Adaugă un ID valid sau autentifică utilizatorul.");
          return;
        }

        await markUserPlan(userId, "PRO");
        if (user?.id === userId) {
          setCurrentPlan("PRO");
        }
        pushNotification("Plan actualizat", "Contul a fost marcat ca Premium după confirmarea plății.");
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
      saveMarket: (market) => {
        setUser((prev) =>
          prev
            ? {
                ...prev,
                savedMarkets: prev.savedMarkets.includes(market)
                  ? prev.savedMarkets
                  : [...prev.savedMarkets, market],
              }
            : prev,
        );
      },
      createRequest: ({ assetInput, requesterEmail, tier, notes, paymentProof, paymentReference }) => {
        const deliveryType = tier >= 5 ? "video" : "text";
        const normalizedInput = assetInput.trim();
        const normalizedSymbol = normalizedInput.toUpperCase();
        const contactEmail = (requesterEmail ?? user?.email ?? authEmail).trim();
        const request: AnalysisRequest = {
          id: `req-${Date.now()}`,
          userId: user?.id ?? "guest",
          requesterEmail: contactEmail || undefined,
          ticker: normalizedSymbol,
          assetInput: normalizedInput,
          coinSymbol: normalizedSymbol,
          tier,
          notes,
          status: "pending",
          deliveryType,
          paymentStatus: "pending",
          paymentProof,
          paymentReference,
          requestedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        };

        setRequestState((prev) => [request, ...prev]);
        void createAnalysisRequest({
          user_id: request.userId,
          requester_email: request.requesterEmail,
          asset_input: request.assetInput,
          coin_symbol: request.coinSymbol,
          tier: request.tier,
          notes: request.notes,
          delivery_type: request.deliveryType,
          payment_proof: paymentProof,
          payment_reference: paymentReference,
        });
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
        void queueRequestEmailNotification({
          event: "cerere_primită",
          userId: request.userId,
          email: contactEmail,
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
          email: "eugenfm95@gmail.com",
          requestId: request.id,
          subject: "Cerere nouă de analiză personală",
          body: `Contact: ${contactEmail || "nespecificat"}\nActiv: ${request.assetInput}\nTier: $${request.tier}\nNote: ${request.notes || "-"}\nDovadă plată: ${request.paymentProof || "-"}\nReferință: ${request.paymentReference || "-"}`,
          metadata: {
            requesterEmail: contactEmail,
            paymentProof: request.paymentProof,
            paymentReference: request.paymentReference,
          },
        });
      },
      createPaymentRequest: ({ planTarget, fullName, contactEmail, paymentMethod, paymentProof, transactionRef, notes }) => {
        const next: PaymentRequest = {
          id: `payment-${Date.now()}`,
          userId: user?.id ?? "guest",
          type: "membership_upgrade",
          planTarget,
          fullName,
          contactEmail,
          paymentMethod,
          paymentProof,
          transactionRef,
          notes,
          status: "pending",
          createdAt: new Date().toISOString(),
        };

        setPaymentRequestState((prev) => [next, ...prev]);
        void persistPaymentRequest({
          user_id: next.userId,
          plan_target: next.planTarget,
          full_name: next.fullName,
          contact_email: next.contactEmail,
          payment_method: next.paymentMethod,
          payment_proof: next.paymentProof,
          transaction_ref: next.transactionRef,
          notes: next.notes,
        });
        pushNotification(
          "Confirmare trimisă",
          "Confirmarea plății a fost trimisă. Verificarea manuală poate dura până la 24h.",
        );
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
        });
      },
      updateProfileAbout: async (input) => {
        if (!user?.id) {
          setAuthMessage("Autentifică-te pentru a-ți salva profilul.");
          return;
        }

        await updateProfileAbout(user.id, input);
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
      publishAnalysis: (input) => {
        const next: DailyAnalysis = {
          ...input,
          id: `analysis-${input.market.toLowerCase()}-${Date.now()}`,
          publishedAt: input.publishedAt ?? new Date().toISOString(),
        };

        setAnalysisState((prev) => [next, ...prev]);
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
                  publishedAt: input.publishedAt ?? item.publishedAt,
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
      publishReview: (input) => {
        const next: AfterActionReview = {
          ...input,
          id: `review-${input.market.toLowerCase()}-${Date.now()}`,
          publishedAt: input.publishedAt ?? new Date().toISOString(),
          isFree: true,
        };

        setReviewState((prev) => [next, ...prev]);
        void publishAfterActionReview({
          market: next.market,
          title: next.title,
          short_text: next.shortText,
          chart_image: next.chartImage,
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
                  publishedAt: input.publishedAt ?? item.publishedAt,
                }
              : item,
          ),
        );

        void updateAfterActionReview(reviewId, {
          market: input.market,
          title: input.title,
          short_text: input.shortText,
          chart_image: input.chartImage,
          published_at: input.publishedAt,
        });
      },
      deleteReview: (reviewId) => {
        setReviewState((prev) => prev.filter((item) => item.id !== reviewId));
        void deleteAfterActionReview(reviewId);
      },
      updateRequest: (requestId, input) => {
        let updatedOwnerId = "";
        let updatedStatus: AnalysisRequest["status"] = input.status;

        setRequestState((prev) =>
          prev.map((item) => {
            if (item.id !== requestId) {
              return item;
            }

            updatedOwnerId = item.userId;
            updatedStatus = input.status;

            return {
              ...item,
              status: input.status,
              paymentStatus: input.paymentStatus ?? item.paymentStatus,
              deliveryNotes: input.deliveryNotes ?? item.deliveryNotes,
              adminNotes: input.deliveryNotes ?? item.adminNotes,
              deliveryUrl: input.deliveryVideoUrl ?? item.deliveryUrl,
              deliveryVideoUrl: input.deliveryVideoUrl ?? item.deliveryVideoUrl,
              fulfilledAt: input.status === "delivered" ? new Date().toISOString() : item.fulfilledAt,
              deliveredAt: input.status === "delivered" ? new Date().toISOString() : item.deliveredAt,
              updatedAt: new Date().toISOString(),
            };
          }),
        );

        void updateAnalysisRequest(requestId, {
          status: input.status,
          payment_status: input.paymentStatus,
          admin_notes: input.deliveryNotes,
          delivery_url: input.deliveryVideoUrl,
          delivery_notes: input.deliveryNotes,
          delivery_video_url: input.deliveryVideoUrl,
        });

        if (updatedOwnerId) {
          void createRequestStatusEvent({
            request_id: requestId,
            user_id: updatedOwnerId,
            status: input.status,
          });
        }

        const notificationBody =
          updatedStatus === "delivered"
            ? "Analiza ta este gata."
            : updatedStatus === "accepted"
              ? "Solicitarea ta a fost acceptată. Timpul de livrare a început."
              : updatedStatus === "cancelled"
                ? "Solicitarea ta a fost anulată."
                : "Solicitarea ta este în așteptare.";

        if (user?.id === updatedOwnerId || user?.isAdmin) {
          pushNotification("Actualizare solicitare", notificationBody);
        }

        void queueRequestEmailNotification({
          event:
            updatedStatus === "accepted"
              ? "cerere_acceptată"
              : updatedStatus === "delivered"
                ? "cerere_livrată"
                : "cerere_primită",
          userId: updatedOwnerId,
          email: user?.email ?? authEmail,
          requestId,
          subject: "Actualizare solicitare",
          body: notificationBody,
        });
      },
      updatePaymentRequest: (paymentRequestId, status) => {
        let affectedUserId = "";
        let targetPlan: UserPlan = "PRO";

        setPaymentRequestState((prev) =>
          prev.map((item) => {
            if (item.id !== paymentRequestId) {
              return item;
            }

            affectedUserId = item.userId;
            targetPlan = item.planTarget;

            return {
              ...item,
              status,
              verifiedAt: status === "verified" ? new Date().toISOString() : item.verifiedAt,
            };
          }),
        );

        void persistPaymentRequestUpdate(paymentRequestId, { status });

        if (status === "verified" && affectedUserId) {
          void markUserPlan(affectedUserId, targetPlan);
          setAdminUserState((prev) =>
            prev.map((item) =>
              item.id === affectedUserId
                ? {
                    ...item,
                    plan: targetPlan,
                  }
                : item,
            ),
          );
          if (user?.id === affectedUserId) {
            setCurrentPlan(targetPlan);
          }
        }
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
      updateAdminUser: ({ userId, role, plan }) => {
        void updateUserAccess({ userId, role, plan });
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

        if (user?.id === userId) {
          setUser((prev) => (prev ? { ...prev, isAdmin: role === "admin", role } : prev));
          setCurrentPlan(plan);
        }
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
    }),
    [
      session,
      authReady,
      analysisState,
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
      adminUserState,
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
