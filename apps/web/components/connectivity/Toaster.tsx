"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle, ArrowLeft, CheckCircle2, Info, Wifi, WifiOff, X, XCircle } from "lucide-react";

export type ToastVariant = "offline" | "online" | "success" | "error" | "warning" | "info";

export interface ToastItem {
  id: string;
  variant: ToastVariant;
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
  success: {
    ring: "ring-emerald-400/30",
    glow: "from-emerald-500/25",
    icon: "bg-emerald-400/15 text-emerald-300",
    bar: "bg-emerald-400",
    Icon: CheckCircle2,
  },
  error: {
    ring: "ring-red-400/30",
    glow: "from-red-500/25",
    icon: "bg-red-400/15 text-red-300",
    bar: "bg-red-400",
    Icon: XCircle,
  },
  warning: {
    ring: "ring-amber-400/30",
    glow: "from-amber-500/25",
    icon: "bg-amber-400/15 text-amber-300",
    bar: "bg-amber-400",
    Icon: AlertTriangle,
  },
  info: {
    ring: "ring-sky-400/30",
    glow: "from-sky-500/25",
    icon: "bg-sky-400/15 text-sky-300",
    bar: "bg-sky-400",
    Icon: Info,
  },
} as const;

export type ToastInput = Omit<ToastItem, "id">;

export function useToaster() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const counter = useRef(0);

  const dismiss = useCallback((id: string) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const push = useCallback((input: ToastInput) => {
    const id = `t${++counter.current}`;
    setToasts((list) => {
      if (list.some((t) => t.variant === input.variant && t.title === input.title && t.message === input.message)) {
        return list;
      }
      return [...list.slice(-3), { ...input, id }];
    });
    return id;
  }, []);

  return { toasts, push, dismiss };
}
function Toast({ toast, onDismiss }: { toast: ToastItem; onDismiss: (id: string) => void }) {
  const [leaving, setLeaving] = useState(false);
  const [paused, setPaused] = useState(false);
  const t = THEME[toast.variant];
  const duration = toast.duration ?? (toast.variant === "error" ? 6500 : 5000);
  const isNetwork = toast.variant === "offline" || toast.variant === "online";

  const remaining = useRef(duration);
  const startedAt = useRef(0);

  const close = useCallback(() => {
    setLeaving(true);
    setTimeout(() => onDismiss(toast.id), 220);
  }, [onDismiss, toast.id]);
  useEffect(() => {
    if (paused || leaving) return;
    startedAt.current = Date.now();
    const timer = setTimeout(close, Math.max(remaining.current, 0));
    return () => {
      clearTimeout(timer);
      remaining.current -= Date.now() - startedAt.current;
    };
  }, [paused, leaving, close]);

  return (
    <div
      role={toast.variant === "offline" || toast.variant === "error" ? "alert" : "status"}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
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
          {toast.message && (
            <p className="mt-0.5 break-words text-xs leading-relaxed text-white/65">{toast.message}</p>
          )}
          {toast.action && (
            <button
              onClick={() => {
                toast.action!.onClick();
                close();
              }}
              className="mt-2.5 inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-xs font-bold text-neutral-950 transition hover:scale-105 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              {isNetwork && <ArrowLeft className="h-3.5 w-3.5" />}
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

      <div className="relative h-[3px] w-full bg-white/5">
        <div
          className={`cm-countdown h-full ${t.bar}`}
          style={{
            animationDuration: `${duration}ms`,
            animationPlayState: paused ? "paused" : "running",
          }}
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
