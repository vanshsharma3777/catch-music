"use client";

import { useEffect, useState } from "react";
import { Quote, Star } from "lucide-react";

export type Review = {
  id: string | number;
  name: string;
  message: string;
  rating?: number | null;
};

const CELL = 280; // width of one hanging slot (px), keep in sync with the CSS below
const SWAY = [2.2, 3.1, 1.8, 2.7, 3.4];
const DURATION = [3.6, 4.4, 3.9, 5.0, 4.1];
const TILT = [-1.2, 0.8, -0.4, 1.4, -0.9];
const PIN = ["var(--primary)", "var(--accent)", "var(--secondary-hover)"];

function Stars({ value }: { value: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${value} out of 5 stars`} role="img">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={14}
          strokeWidth={1.75}
          className={i < value ? "text-primary" : "text-muted/50"}
          fill={i < value ? "currentColor" : "none"}
        />
      ))}
    </div>
  );
}

function HangingCard({ review, index }: { review: Review; index: number }) {
  const k = index % 5;
  const initial = review.name.trim().charAt(0).toUpperCase() || "?";
  const delay = -((index * 0.83) % DURATION[k]!);

  return (
    <div className="hc-cell">
      {/* thread segment: sags in the middle where the card hangs */}
      <svg className="hc-thread" viewBox="0 0 100 24" preserveAspectRatio="none" aria-hidden>
        <path d="M0 1 Q50 23 100 1" fill="none" vectorEffect="non-scaling-stroke" />
      </svg>

      <div
        className="hc-hang"
        style={
          {
            "--sway": `${SWAY[k]}deg`,
            "--tilt": `${TILT[k]}deg`,
            "--dur": `${DURATION[k]}s`,
            "--delay": `${delay.toFixed(2)}s`,
            "--pin": PIN[index % PIN.length],
          } as React.CSSProperties
        }
      >
        <span className="hc-knot" aria-hidden />
        <svg className="hc-strings" viewBox="0 0 240 30" aria-hidden>
          <line x1="120" y1="0" x2="22" y2="30" />
          <line x1="120" y1="0" x2="218" y2="30" />
        </svg>

        <article className="hc-card group relative h-[226px] overflow-hidden rounded-2xl border border-border-light bg-gradient-to-b from-surface to-card p-5 shadow-md transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-primary">
          <span className="hc-tack left-[19px]" aria-hidden />
          <span className="hc-tack right-[19px]" aria-hidden />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[var(--glow-gold)] to-transparent opacity-40" />

          <div className="relative flex h-full flex-col">
            <div className="flex items-center justify-between">
              {review.rating ? <Stars value={review.rating} /> : <span />}
              <Quote size={18} strokeWidth={1.75} className="text-primary/40 transition-colors duration-300 group-hover:text-primary" />
            </div>

            <p className="mt-3 line-clamp-4 text-sm leading-relaxed text-sec transition-colors duration-300 group-hover:text-pri">
              {review.message}
            </p>

            <div className="mt-auto flex items-center gap-3 border-t border-border pt-3">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-border-light bg-bg-ter text-xs font-bold text-primary">
                {initial}
              </span>
              <span className="truncate text-sm font-semibold tracking-wide text-pri">{review.name}</span>
            </div>
          </div>
        </article>
      </div>
    </div>
  );
}

const MIN_ROW_WIDTH = 2800; // one loop must be at least this wide so wide screens never show a gap

const isReview = (v: unknown): v is Review => {
  const r = v as Review | null;
  return !!r && typeof r.name === "string" && typeof r.message === "string" && r.message.trim() !== "";
};

export default function ReviewsSection({
  speed = 75,
  limit = 20,
}: {
  speed?: number;
  limit?: number;
}) {
  const [reviews, setReviews] = useState<Review[]>([]);

  useEffect(() => {
    let controller: AbortController | null = null;

    const load = () => {
      controller?.abort();
      controller = new AbortController();

      fetch(`/api/feedback?limit=${limit}`, { signal: controller.signal, cache: "no-store" })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          const list: unknown[] = Array.isArray(data?.feedback) ? data.feedback : [];
          setReviews(list.filter(isReview));
        })
        .catch((err) => {
          if (err?.name !== "AbortError") console.error("Failed to load reviews:", err);
        });
    };

    load();
    window.addEventListener("catchmusic:feedback-submitted", load);

    return () => {
      window.removeEventListener("catchmusic:feedback-submitted", load);
      controller?.abort();
    };
  }, [limit]);

  if (reviews.length === 0) return null;

  const repeats = Math.max(1, Math.ceil(MIN_ROW_WIDTH / (reviews.length * CELL)));
  const row = Array.from({ length: repeats }, () => reviews).flat();
  const duration = (row.length * CELL) / speed;

  return (
    <section className="bg-bg py-20" aria-label="What listeners say about CatchMusic">
      <style>{`
        .hc-wrap{
          overflow:hidden; padding:4px 0 28px;
          -webkit-mask-image:linear-gradient(to right,transparent,#000 8%,#000 92%,transparent);
          mask-image:linear-gradient(to right,transparent,#000 8%,#000 92%,transparent);
        }
        .hc-track{display:flex;width:max-content;animation:hc-scroll var(--hc-duration) linear infinite;will-change:transform}
        .hc-track:hover,.hc-track:hover .hc-hang{animation-play-state:paused}
        .hc-group{display:flex}
        .hc-cell{position:relative;flex:none;width:${CELL}px;padding-top:12px}
        .hc-thread{position:absolute;top:0;left:0;width:100%;height:24px;display:block;overflow:visible}
        .hc-thread path{stroke:var(--primary);stroke-opacity:.55;stroke-width:1.5}
        .hc-hang{
          position:relative;width:240px;margin:0 auto;transform-origin:50% 0;
          animation:hc-sway var(--dur) ease-in-out var(--delay) infinite alternate;
        }
        .hc-knot{position:absolute;top:-4px;left:50%;width:8px;height:8px;margin-left:-4px;border-radius:9999px;background:var(--pin);box-shadow:0 0 10px var(--pin);z-index:2}
        .hc-strings{display:block;width:100%;height:30px}
        .hc-strings line{stroke:var(--primary);stroke-opacity:.5;stroke-width:1.25}
        .hc-tack{position:absolute;top:-3px;width:6px;height:6px;border-radius:9999px;background:var(--pin);z-index:2}
        @keyframes hc-scroll{from{transform:translateX(0)}to{transform:translateX(-50%)}}
        @keyframes hc-sway{
          from{transform:rotate(calc(var(--tilt) - var(--sway)))}
          to{transform:rotate(calc(var(--tilt) + var(--sway)))}
        }
        @media (prefers-reduced-motion:reduce){
          .hc-track,.hc-hang{animation:none}
          .hc-wrap{overflow-x:auto}
        }
      `}</style>

      <div className="mx-auto mb-14 max-w-7xl space-y-4 px-6 text-center lg:px-16">
        <div className="inline-flex items-center rounded-full border border-border-light bg-surface px-4 py-1.5 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-widest text-primary">Reviews</span>
        </div>
        <h2 className="text-4xl font-bold leading-[1.15] tracking-tight text-pri sm:text-5xl">
          Loved by Listeners.{" "}
          <span className="bg-gradient-to-r from-primary via-accent to-primary-hover bg-clip-text text-transparent">
            Hanging on Every Word.
          </span>
        </h2>
      </div>

      <div className="hc-wrap">
        <div className="hc-track" style={{ "--hc-duration": `${duration}s` } as React.CSSProperties}>
          <div className="hc-group">
            {row.map((r, i) => (
              <HangingCard key={`a-${r.id}-${i}`} review={r} index={i} />
            ))}
          </div>
          <div className="hc-group" aria-hidden>
            {row.map((r, i) => (
              <HangingCard key={`b-${r.id}-${i}`} review={r} index={i} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
