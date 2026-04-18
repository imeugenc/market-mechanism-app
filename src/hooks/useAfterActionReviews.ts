import { useEffect, useState } from "react";

import { fetchAfterActionReviews } from "@/features/content/reviews";
import { AfterActionReview } from "@/types/domain";

export function useAfterActionReviews() {
  const [reviews, setReviews] = useState<AfterActionReview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      const result = await fetchAfterActionReviews();
      if (!result.error && result.data) {
        setReviews(result.data);
      }
      setLoading(false);
    })();
  }, []);

  return {
    reviews,
    loading,
  };
}
