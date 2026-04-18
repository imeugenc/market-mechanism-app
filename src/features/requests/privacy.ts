import { AnalysisRequest, AppUser } from "@/types/domain";

export function canViewPrivateRequestDelivery(user: AppUser | null, request: AnalysisRequest) {
  if (!user) {
    return false;
  }

  return user.isAdmin || user.id === request.userId;
}
