"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, Send, Star } from "lucide-react";

// Tells <ReviewsSection /> to reload so the new review shows up without a page refresh.
const SUBMITTED_EVENT = "catchmusic:feedback-submitted";

type Status = "idle" | "submitting" | "success" | "error";

const inputClass =
  "w-full bg-[var(--background)] px-4 py-3 rounded-xl border border-border-light text-sm text-pri placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)] transition-colors duration-300";

export default function FeedbackForm({
  hideName = false,
  autoFocus = false,
  onSuccess,
}: {
  hideName?: boolean; // hide the name field (logged-in users are named from their profile)
  autoFocus?: boolean; // focus the message box on mount
  onSuccess?: () => void; // called after a successful submit
}) {
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");

  const submitting = status === "submitting";
  const shownRating = hoverRating || rating;

  const clearResult = () => {
    if (status === "success" || status === "error") setStatus("idle");
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;

    const text = message.trim();
    if (text.length < 10) {
      setError("Please write at least 10 characters.");
      setStatus("error");
      return;
    }
    if (rating ==0) {
      setError("Please give us rating");
      setStatus("error");
      return;
    }

    setStatus("submitting");
    setError("");

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim() || undefined,
          message: text,
          rating: rating || undefined,
        }),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success) {
        setError(data?.error || "Could not submit your review. Please try again.");
        setStatus("error");
        return;
      }

      setName("");
      setMessage("");
      setRating(0);
      setStatus("success");
      window.dispatchEvent(new Event(SUBMITTED_EVENT));
      onSuccess?.();
    } catch {
      setError("Network error. Please check your connection and try again.");
      setStatus("error");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="relative z-10 mt-6 space-y-4">
      {!hideName && (
        <input
          type="text"
          value={name}
          maxLength={60}
          onChange={(e) => {
            setName(e.target.value);
            clearResult();
          }}
          placeholder="Your Name"
          className={inputClass}
        />
      )}

      <textarea
        rows={3}
        value={message}
        maxLength={1000}
        autoFocus={autoFocus}
        onChange={(e) => {
          setMessage(e.target.value);
          clearResult();
        }}
        placeholder="Write your feedback..."
        className={`${inputClass} resize-none`}
      />

      <div className="flex items-center gap-3">
        <span className="text-xs text-sec tracking-wide">Rating </span>
        <div className="flex gap-1" onMouseLeave={() => setHoverRating(0)}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              aria-label={`${n} star${n > 1 ? "s" : ""}`}
              aria-pressed={rating === n}
              onMouseEnter={() => setHoverRating(n)}
              onClick={() => {
                setRating(rating === n ? 0 : n);
                clearResult();
              }}
              className="p-0.5 transition-transform duration-150 hover:scale-110 focus:outline-none focus-visible:ring-1 focus-visible:ring-[var(--primary)] rounded"
            >
              <Star
                size={20}
                strokeWidth={1.75}
                className={n <= shownRating ? "text-primary" : "text-muted/60"}
                fill={n <= shownRating ? "currentColor" : "none"}
              />
            </button>
          ))}
        </div>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full sm:w-1/2 sm:min-w-[11rem] whitespace-nowrap flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] px-6 py-3 text-black font-semibold text-sm tracking-wide shadow-[var(--shadow-premium)] transition-all duration-300 hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 mx-auto"
      >
        {submitting ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <Send size={16} strokeWidth={2.25} />
        )}
        <span>{submitting ? "Submitting..." : "Submit Review"}</span>
      </button>

      <div aria-live="polite" className="min-h-5 text-center text-xs tracking-wide">
        {status === "success" && (
          <p className="inline-flex items-center gap-1.5 text-success">
            <CheckCircle2 size={14} /> Thanks for your review!
          </p>
        )}
        {status === "error" && <p className="text-error">{error}</p>}
      </div>
    </form>
  );
}
