"use client";

import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft } from "lucide-react";

export default function ModalLayer({
  onClose,
  children,
}: {
  onClose: () => void;
  children: ReactNode;
}) {
  // lock page scroll while the modal is open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // Escape closes the modal
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[100]">
      {children}

      {/* Back button: returns to the page behind */}
      <button
        type="button"
        onClick={onClose}
        className="fixed left-4 top-4 z-[110] inline-flex items-center gap-2 rounded-full bg-white/[0.08] px-3.5 py-2 text-xs font-semibold text-pri backdrop-blur-xl transition hover:bg-white/[0.16] sm:left-8 sm:top-6"
      >
        <ArrowLeft size={14} className="text-accent" /> Back
      </button>
    </div>,
    document.body
  );
}
