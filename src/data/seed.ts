import {
  AnalysisRequest,
  AppUser,
  AfterActionReview,
  DailyAnalysis,
  MembershipStats,
} from "@/types/domain";

export const demoUser: AppUser = {
  id: "user-1",
  name: "Membru Execution Edge",
  email: "member@executionedge.app",
  isAdmin: true,
  savedMarkets: ["BTC", "NQ"],
};

export const demoMembership: MembershipStats = {
  userId: "user-1",
  currentPlan: "FREE",
  currentRank: "Disciplined",
  loginStreak: 9,
  totalViews: 42,
  premiumViews: 8,
  totalRequests: 2,
  engagementActions: 14,
  score: 248,
};

export const dailyAnalyses: DailyAnalysis[] = [
  {
    id: "analysis-btc-1",
    market: "BTC",
    title: "Plan sesiune Londra",
    videoUrl: "https://example.com/video/btc-daily",
    isPremium: true,
    publishedAt: "2026-04-17T06:30:00.000Z",
  },
  {
    id: "analysis-eth-1",
    market: "ETH",
    title: "Plan sesiune Europa",
    videoUrl: "https://example.com/video/eth-daily",
    isPremium: true,
    publishedAt: "2026-04-17T06:45:00.000Z",
  },
  {
    id: "analysis-nq-1",
    market: "NQ",
    title: "Briefing open SUA",
    videoUrl: "https://example.com/video/nq-daily",
    isPremium: true,
    publishedAt: "2026-04-17T07:00:00.000Z",
  },
  {
    id: "analysis-es-1",
    market: "ES",
    title: "Plan sesiune principală",
    videoUrl: "https://example.com/video/es-daily",
    isPremium: true,
    publishedAt: "2026-04-17T07:10:00.000Z",
  },
  {
    id: "analysis-btc-0",
    market: "BTC",
    title: "Recapitulare de dimineață",
    videoUrl: "https://example.com/video/btc-prev",
    isPremium: true,
    publishedAt: "2026-04-16T06:30:00.000Z",
  },
];

export const reviews: AfterActionReview[] = [
  {
    id: "review-es-1",
    market: "ES",
    title: "Review post-sesiune ES",
    shortText:
      "Sweep curat peste maximele anterioare urmat de respingere agresivă. Recapitularea gratuită arată triggerul și lecția sesiunii.",
    chartImage: "https://images.unsplash.com/photo-1559526324-593bc073d938?auto=format&fit=crop&w=1200&q=80",
    publishedAt: "2026-04-16T18:10:00.000Z",
    isFree: true,
  },
  {
    id: "review-btc-1",
    market: "BTC",
    title: "Replay BTC după sweep",
    shortText:
      "Membrii Gratuit primesc secvența de pe grafic și ideea principală a mișcării.",
    chartImage: "https://images.unsplash.com/photo-1518546305927-5a555bb7020d?auto=format&fit=crop&w=1200&q=80",
    publishedAt: "2026-04-15T17:40:00.000Z",
    isFree: true,
  },
];

export const requestHistory: AnalysisRequest[] = [
  {
    id: "req-1",
    userId: "user-1",
    ticker: "SOL",
    assetInput: "Solana",
    coinSymbol: "SOL",
    tier: 5,
    notes: "Am nevoie de context pentru următoarele 24h în jurul sesiunii NY.",
    status: "delivered",
    deliveryType: "video",
    paymentStatus: "paid",
    adminNotes: "Confirmare plată primită. Livrare finalizată.",
    deliveryUrl: "https://example.com/video/sol-custom",
    deliveryNotes: "Cererea a fost livrată. Contextul principal rămâne constructiv peste suportul recâștigat.",
    deliveryVideoUrl: "https://example.com/video/sol-custom",
    requestedAt: "2026-04-14T09:30:00.000Z",
    fulfilledAt: "2026-04-14T12:10:00.000Z",
    deliveredAt: "2026-04-14T12:10:00.000Z",
    updatedAt: "2026-04-14T12:10:00.000Z",
    createdAt: "2026-04-14T09:30:00.000Z",
  },
  {
    id: "req-2",
    userId: "user-1",
    ticker: "XRP",
    assetInput: "XRP",
    coinSymbol: "XRP",
    tier: 10,
    notes: "Vreau video complet dacă structura rămâne validă până la închidere.",
    status: "pending",
    deliveryType: "video",
    paymentStatus: "pending",
    requestedAt: "2026-04-17T08:15:00.000Z",
    updatedAt: "2026-04-17T08:15:00.000Z",
    createdAt: "2026-04-17T08:15:00.000Z",
  },
  {
    id: "req-3",
    userId: "user-1",
    ticker: "RNDR",
    assetInput: "Render",
    coinSymbol: "RNDR",
    tier: 2,
    notes: "Am nevoie de o citire rapidă pentru următoarea sesiune SUA.",
    status: "accepted",
    deliveryType: "text",
    paymentStatus: "paid",
    adminNotes: "Plată confirmată. În pregătire.",
    deliveryNotes: "Acceptată pentru următorul slot de publicare. Aștept confirmare mai clară înainte de livrarea finală.",
    requestedAt: "2026-04-16T15:20:00.000Z",
    updatedAt: "2026-04-16T16:05:00.000Z",
    createdAt: "2026-04-16T15:20:00.000Z",
  },
];
