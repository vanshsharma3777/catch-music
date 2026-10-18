"use client";

import { useEffect, useRef, useState } from "react";
import { UserRound, ChevronDown, Mail, ExternalLink } from "lucide-react";

const GithubIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.1.79-.25.79-.56v-2c-3.2.7-3.87-1.54-3.87-1.54-.52-1.33-1.28-1.69-1.28-1.69-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.03 1.76 2.69 1.25 3.35.96.1-.74.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.7 0-1.26.45-2.29 1.18-3.1-.12-.29-.51-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.62 1.59.23 2.76.11 3.05.74.81 1.18 1.84 1.18 3.1 0 4.43-2.7 5.4-5.27 5.69.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z" />
  </svg>
);

const LinkedinIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12ZM7.12 20.45H3.56V9h3.56v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0Z" />
  </svg>
);

const XIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77Z" />
  </svg>
);

export const CONTACTS = [
  {
    label: "GitHub",

    href: "https://github.com/vanshsharma3777",
    icon: <GithubIcon />,
    external: true,
  },
  {
    label: "LinkedIn",

    href: "https://www.linkedin.com/in/vansh-sharma-812199316/?isSelfProfile=true",
    icon: <LinkedinIcon />,
    external: true,
  },
  {
    label: "X",

    href: "https://x.com/itz_sharmaji001",
    icon: <XIcon />,
    external: true,
  },
  {
    label: "Email",

    href: "mailto:sharmavansh.3777@gmail.com",
    icon: <Mail size={16} />,
    external: false,
  },
];

/* Desktop-only: the header shows this from the `lg` breakpoint up.
   On smaller screens the hamburger menu in the home page is used instead. */
export default function ContactDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex cursor-pointer items-center gap-1.5 rounded-full bg-white/[0.06] px-3.5 py-1.5 text-xs backdrop-blur-xl transition hover:bg-white/[0.12] hover:text-white"
      >
        <UserRound size={14} className="text-accent" />
        <strong className="font-bold">Contact</strong>
        <ChevronDown
          size={14}
          className={`text-muted transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div
          role="menu"
          /* left-0: opens toward the right, so it never spills off the left edge */
          className="absolute left-0 top-full z-50 mt-2 w-64 origin-top-left animate-[contactIn_0.16s_ease-out] overflow-hidden rounded-2xl border border-white/10 bg-[#14141a]/90 p-1.5 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.9)] backdrop-blur-2xl"
        >
          <style>{`
            @keyframes contactIn{
              from{opacity:0;transform:translateY(-6px) scale(.97)}
              to{opacity:1;transform:translateY(0) scale(1)}
            }
          `}</style>

          <p className="px-3 pb-1.5 pt-2 text-[10px] font-semibold uppercase tracking-widest text-muted">
            Get in touch
          </p>

          {CONTACTS.map((c) => (
            <a
              key={c.label}
              role="menuitem"
              href={c.href}
              target={c.external ? "_blank" : undefined}
              rel={c.external ? "noopener noreferrer" : undefined}
              onClick={() => setOpen(false)}
              className="group flex items-center gap-3 rounded-xl px-2.5 py-2 transition hover:bg-white/[0.08]"
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-accent/15 text-accent transition-transform group-hover:scale-105">
                {c.icon}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold text-pri">{c.label}</span>
              </span>
              {c.external && (
                <ExternalLink
                  size={13}
                  className="text-muted opacity-0 transition group-hover:text-accent group-hover:opacity-100"
                />
              )}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
