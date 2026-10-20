import { useEffect, useState } from "react";
import { api } from "../lib/api";
import type { Review } from "../types/review";

const isReview = (v: any): v is Review =>
  !!v && typeof v.name === "string" && typeof v.message === "string" && v.message.trim() !== "";

/** Public endpoint: GET /api/feedback (no token needed). */
export function useReviews(limit = 10) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    api<{ feedback: unknown[] }>(`/api/feedback?limit=${limit}`, { auth: false })
      .then((d) => alive && setReviews((d.feedback ?? []).filter(isReview)))
      .catch(() => {})
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [limit]);

  return { reviews, loading };
}