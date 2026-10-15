"use client";

import React, { useEffect, useState } from "react";
import { Wifi, WifiOff, X, ArrowLeft } from "lucide-react";

export interface ToastItem {
  id: string;
  variant: "offline" | "online";
  title: string;
  message?: string;
  duration?: number;
  action?: { label: string; onClick: () => void };
}

const THEME = {
  offline: {
    ring: "ring-amber-400/30",
    glow: "from-amber-500/25",
    icon: "bg-amber-400/15 text-amber-300",
    bar: "bg-amber-400",
    Icon: WifiOff,
  },
  online: {
    ring: "ring-emerald-400/30",
    glow: "from-emerald-500/25",
    icon: "bg-emerald-400/15 text-emerald-300",
    bar: "bg-emerald-400",
    Icon: Wifi,
  },
} as const;

function Toast({ toast, onDismiss }: { toast: ToastItem; onDismiss: (id: string) => void }) {
  const [leaving, setLeaving] = useState(false);
  const t = THEME[toast.variant];
  const duration = toast.duration ?? 5000;

  const close = () => {
    setLeaving(true);
    setTimeout(() => onDismiss(toast.id), 220);
  };

  useEffect(() => {
    const timer = setTimeout(close, duration);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast.id, duration]);

  return (
    <div
      role={toast.variant === "offline" ? "alert" : "status"}
      className={`cm-toast pointer-events-auto relative w-full overflow-hidden rounded-2xl bg-neutral-950/90 shadow-[0_20px_60px_-10px_rgba(0,0,0,0.9)] ring-1 backdrop-blur-xl ${t.ring} ${
        leaving ? "cm-toast-out" : "cm-toast-in"
      }`}
    >
      <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${t.glow} to-transparent`} />

      <div className="relative flex items-start gap-3 p-3.5 pr-2.5">
        <span className={`relative grid h-10 w-10 shrink-0 place-items-center rounded-xl ${t.icon}`}>
          <t.Icon className="h-5 w-5" />
          <span className={`cm-ping absolute inset-0 rounded-xl ring-2 ${t.ring}`} />
        </span>

        <div className="min-w-0 flex-1 pt-0.5">
          <p className="text-sm font-bold text-white">{toast.title}</p>
          {toast.message && <p className="mt-0.5 text-xs leading-relaxed text-white/65">{toast.message}</p>}
          {toast.action && (
            <button
              onClick={() => {
                toast.action!.onClick();
                close();
              }}
              className="mt-2.5 inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-xs font-bold text-neutral-950 transition hover:scale-105 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              {toast.action.label}
            </button>
          )}
        </div>

        <button
          onClick={close}
          aria-label="Dismiss notification"
          className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-white/50 transition hover:bg-white/10 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* auto-dismiss countdown */}
      <div className="relative h-[3px] w-full bg-white/5">
        <div
          className={`cm-countdown h-full ${t.bar}`}
          style={{ animationDuration: `${duration}ms` }}
        />
      </div>
    </div>
  );
}

export function Toaster({
  toasts,
  onDismiss,
}: {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}) {
  return (
    <>
      <style>{`
        @keyframes cm-in{from{opacity:0;transform:translateY(-16px) scale(.96)}to{opacity:1;transform:none}}
        @keyframes cm-out{to{opacity:0;transform:translateY(-12px) scale(.96)}}
        @keyframes cm-bar{from{width:100%}to{width:0}}
        @keyframes cm-ping{0%{transform:scale(1);opacity:.8}100%{transform:scale(1.6);opacity:0}}
        .cm-toast-in{animation:cm-in .35s cubic-bezier(.2,.9,.3,1.2) both}
        .cm-toast-out{animation:cm-out .22s ease-in both}
        .cm-countdown{animation:cm-bar linear forwards}
        .cm-ping{animation:cm-ping 1.8s ease-out 2}
        .cm-toast:hover .cm-countdown{animation-play-state:paused}
        @media (prefers-reduced-motion:reduce){.cm-toast-in,.cm-toast-out,.cm-ping{animation-duration:.01s}}
      `}</style>
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 top-0 z-[100] flex flex-col items-center gap-2 px-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:items-end sm:px-6 sm:pt-6"
      >
        <div className="flex w-full max-w-sm flex-col gap-2">
          {toasts.map((t) => (
            <Toast key={t.id} toast={t} onDismiss={onDismiss} />
          ))}
        </div>
      </div>
    </>
  );
}

export default Toaster;
