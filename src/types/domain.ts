export type Market = "BTC" | "ETH" | "NQ" | "ES";

export type UserPlan = "FREE" | "PRO";

export type RequestStatus = "pending" | "accepted" | "delivered" | "cancelled";

export type RequestTier = 2 | 5 | 10;

export type PaymentStatus = "pending" | "paid" | "refunded";

export type RankName =
  | "Recruit"
  | "Disciplined"
  | "Executor"
  | "Elite"
  | "War Machine";

export interface DailyAnalysis {
  id: string;
  market: Market;
  title: string;
  summary?: string;
  chartImages?: string[];
  videoUrl: string;
  isPremium: boolean;
  publishedAt: string;
  tags?: string[];
  status?: "Live" | "Plan" | "Watch";
}

export interface AfterActionReview {
  id: string;
  market: Market;
  title: string;
  shortText: string;
  chartImage: string;
  publishedAt: string;
  isFree: true;
}

export interface AnalysisRequest {
  id: string;
  userId: string;
  requesterEmail?: string;
  ticker: string;
  assetInput: string;
  coinSymbol: string;
  tier: RequestTier;
  notes: string;
  status: RequestStatus;
  deliveryType: "text" | "video";
  paymentStatus: PaymentStatus;
  paymentProof?: string;
  paymentReference?: string;
  adminNotes?: string;
  deliveryUrl?: string;
  deliveryNotes?: string;
  deliveryVideoUrl?: string;
  requestedAt: string;
  fulfilledAt?: string;
  deliveredAt?: string;
  updatedAt?: string;
  createdAt: string;
}

export interface MembershipStats {
  userId: string;
  currentPlan: UserPlan;
  currentRank: RankName;
  loginStreak: number;
  totalViews: number;
  premiumViews: number;
  totalRequests: number;
  engagementActions: number;
  score: number;
}

export interface AppUser {
  id: string;
  name: string;
  email: string;
  isAdmin: boolean;
  role?: "admin" | "user";
  savedMarkets: Market[];
  bio?: string;
  tradingExperience?: string;
  tradedMarkets?: string;
  tradingStyle?: string;
  preferredSessions?: string;
  focusedSetups?: string;
  currentGoal?: string;
  memberProfileVisibility?: "members" | "private";
}

export interface AdminUserRecord {
  id: string;
  email: string;
  name: string;
  role: "admin" | "user";
  plan: UserPlan;
}

export interface PaymentRequest {
  id: string;
  userId: string;
  type: "membership_upgrade";
  planTarget: UserPlan;
  fullName: string;
  contactEmail: string;
  paymentMethod: "paypal" | "usdt" | "redotpay";
  paymentProof: string;
  transactionRef?: string;
  notes?: string;
  status: "pending" | "verified" | "rejected";
  createdAt: string;
  verifiedAt?: string;
}

export interface PersonalRequest {
  id: string;
  userEmail: string;
  title: string;
  videoUrl?: string;
  notes?: string;
  tier?: RequestTier;
  status: RequestStatus;
  createdAt: string;
  updatedAt: string;
}

export interface InAppNotification {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
}
