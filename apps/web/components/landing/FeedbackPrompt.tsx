"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, Sparkles, X, } from "lucide-react";
import FeedbackForm from "./FeedbackForm";

// const SNOOZE_MS =  2000;
const snoozeKey = (userId: string) => `catchmusic_feedback_snoozed_${userId}`;

export default function FeedbackPrompt({ delayMs = 4000 }: { delayMs?: number }) {
  const [open, setOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;

    fetch("/api/feedback/mine", { signal: controller.signal, cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data?.success || data.hasReviewed !== false || typeof data.userId !== "string") return;

//         try {
//           const snoozedAt = Number(localStorage.getItem(snoozeKey(data.userId)));
//           if (snoozedAt && Date.now() - snoozedAt < SNOOZE_MS) return;
//         } catch {
//
//         }

        setUserId(data.userId);
        timer = setTimeout(() => setOpen(true), delayMs);
      })
      .catch(() => {
      });

    return () => {
      controller.abort();
      if (timer) clearTimeout(timer);
    };
  }, [delayMs]);

  const dismiss = useCallback(() => {
    if (userId) {
      try {
        localStorage.setItem(snoozeKey(userId), String(Date.now()));
      } catch {}
    }
    setOpen(false);
  }, [userId]);

  useEffect(() => {
    if (!open) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismiss();
    };
    window.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, dismiss]);

  useEffect(() => {
    if (!submitted) return;
    const t = setTimeout(() => setOpen(false), 1800);
    return () => clearTimeout(t);
  }, [submitted]);

  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <style>{`
        @keyframes fp-fade{from{opacity:0}to{opacity:1}}
        @keyframes fp-pop{from{opacity:0;transform:translateY(12px) scale(.96)}to{opacity:1;transform:none}}
        .fp-fade{animation:fp-fade .25s ease-out both}
        .fp-pop{animation:fp-pop .3s cubic-bezier(.2,.8,.2,1) both}
        @media (prefers-reduced-motion:reduce){.fp-fade,.fp-pop{animation:none}}
      `}</style>

      <div
        className="fp-fade absolute inset-0 bg-black/55 backdrop-blur-md"
        onClick={submitted ? undefined : dismiss}
        aria-hidden
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="feedback-prompt-title"
        className="fp-pop relative w-full max-w-md"
      >



        <div className="relative max-h-[90vh] overflow-y-auto rounded-3xl border border-border-light bg-gradient-to-b from-surface to-card p-6 shadow-lg sm:p-8">
          <div className="pointer-events-none absolute inset-0 rounded-3xl bg-gradient-to-br from-[var(--glow-gold)] to-transparent opacity-30" />

          {submitted ? (
            <div className="relative z-10 flex flex-col items-center gap-3 py-10 text-center">
              <CheckCircle2 size={44} className="text-success" />
              <h2 id="feedback-prompt-title" className="text-xl font-bold tracking-tight text-pri">
                Thank you!
              </h2>
              <p className="text-sm text-sec">Your review means a lot to us.</p>
            </div>
          ) : (
            <>
              <div className="relative z-10 space-y-3 border-b border-border pb-4">
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-accent/15 text-accent shadow-[0_8px_24px_-10px_var(--accent)]">
                  <Sparkles size={20} />
                </span>
                <h2 id="feedback-prompt-title" className="text-xl font-bold tracking-tight text-pri">
                  Enjoying CatchMusic?
                </h2>
                <p className="text-xs leading-relaxed tracking-wide text-sec">
                  Tell us what you think. It takes 10 seconds and helps us make the app better.
                </p>
              </div>

              <FeedbackForm hideName autoFocus onSuccess={() => setSubmitted(true)} />
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
