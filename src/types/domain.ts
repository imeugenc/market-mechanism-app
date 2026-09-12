export type Market = "BTC" | "ETH" | "NQ" | "ES";

export type UserPlan = "FREE" | "PRO";

export type RequestStatus = "pending" | "accepted" | "delivered" | "cancelled";

export type RequestTier = 2 | 5 | 10;

export type PaymentStatus = "pending" | "paid" | "refunded";
export type FavoriteContentType = "analysis" | "review" | "altcoin";

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

export interface DailyBias {
  id: string;
  market: Market;
  forecastedBias: "Bullish" | "Bearish" | "Neutral" | "Range";
  confidence: "Low" | "Medium" | "High";
  outcome: "Correct" | "Partially correct" | "Wrong" | "Pending";
  notes: string;
  chartImage?: string;
  videoUrl?: string;
  relatedReviewId?: string;
  publishedAt: string;
}

export interface AfterActionReview {
  id: string;
  market: Market;
  title: string;
  shortText: string;
  bodyText?: string;
  chartImage: string;
  videoUrl?: string;
  publishedAt: string;
  isFree: true;
}

export interface AltcoinPost {
  id: string;
  coinSymbol: string;
  title: string;
  summary: string;
  bodyText: string;
  chartImage: string;
  videoUrl?: string;
  isPremium: boolean;
  publishedAt: string;
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
  planLabel?: string;
  startedAt?: string;
  expiresAt?: string;
  renewalMode?: "manual" | "none";
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

export interface FavoriteItem {
  id: string;
  userId: string;
  contentType: FavoriteContentType;
  contentId: string;
  title: string;
  subtitle?: string;
  marketLabel?: string;
  createdAt: string;
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
  planLabel?: string;
  durationDays?: number;
  fullName: string;
  contactEmail: string;
  paymentMethod: "paypal" | "usdt" | "redotpay";
  paymentProof: string;
  transactionRef?: string;
  notes?: string;
  status: "pending" | "verified" | "rejected";
  createdAt: string;
  verifiedAt?: string;
  archivedAt?: string;
  archivedBy?: string;
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
  archivedAt?: string;
  archivedBy?: string;
}

export interface InAppNotification {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
}

export interface ContactMessage {
  id: string;
  userId?: string;
  fullName: string;
  email: string;
  subject: string;
  message: string;
  status: "new" | "read" | "replied";
  createdAt: string;
  archivedAt?: string;
  archivedBy?: string;
  replies?: ContactMessageReply[];
}

export interface ContactMessageReply {
  id: string;
  messageId: string;
  senderRole: "admin" | "member";
  senderName: string;
  body: string;
  createdAt: string;
}

export interface ContentComment {
  id: string;
  contentType: "review" | "analysis" | "altcoin" | "news";
  contentId: string;
  userId?: string;
  authorName: string;
  body: string;
  createdAt: string;
}
