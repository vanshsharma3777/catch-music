"use client"

import { useState } from "react"
import { Music4, ArrowRight } from "lucide-react"
import { signIn } from "next-auth/react"

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
    const handleLogin = async () => {
    try {
      setIsLoading(true)
      await signIn("google", { callbackUrl: "/" })
    } catch (error) {
      console.error("Authentication trigger failed:", error)
      setIsLoading(false)
    }
  }
  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center px-6">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--glow-gold),transparent_60%)] pointer-events-none" />
      <div className="w-full max-w-md hover:scale-105 duration-300 rounded-3xl border border-[var(--border-light)] bg-gradient-to-b from-[var(--surface)] to-[var(--card)] p-8 lg:p-10 shadow-[var(--shadow-lg)] relative z-10 overflow-hidden">
        <div className="absolute  inset-0 bg-gradient-to-tr  from-[var(--glow-warm)] to-transparent opacity-40 pointer-events-none" />
        <div className="relative z-10 flex flex-col items-center text-center space-y-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--primary)] via-[var(--secondary)] to-[var(--background-secondary)] p-[1px]">
            <div className="flex h-full w-full items-center justify-center rounded-[11px] bg-[var(--background-secondary)]">
              <Music4 size={22} className="text-[var(--primary)]" />
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-[var(--text-primary)]">
              Welcome to <span className="bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] text-transparent bg-clip-text">CatchMusic</span>
            </h1>
            <p className="text-sm text-[var(--text-secondary)] max-w-xs mx-auto">
              Sign in to sync your local storage configuration and unlock secure background caching.
            </p>
          </div>

          <button
            onClick={handleLogin}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 rounded-xl border border-[var(--border-light)] bg-[var(--input-bg)] px-5 py-3.5 text-[var(--text-primary)] font-medium text-sm tracking-wide transition-all duration-300 hover:bg-[var(--card-hover)] hover:border-[var(--text-muted)] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none group shadow-[var(--shadow-sm)]"
          >
            <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#EA4335"
                d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3A11.97 11.97 0 0 0 12 0C7.305 0 3.28 2.745 1.345 6.755l3.92 3.01z"
              />
              <path
                fill="#4285F4"
                d="M23.49 12.275c0-.868-.078-1.705-.222-2.518H12v4.773h6.445a5.508 5.508 0 0 1-2.39 3.615l3.737 2.895c2.186-2.014 3.708-4.977 3.708-8.765z"
              />
              <path
                fill="#FBBC05"
                d="M5.266 14.235A7.087 7.087 0 0 1 4.909 12c0-.79.132-1.55.357-2.265L1.345 6.727A11.973 11.973 0 0 0 0 12c0 1.927.457 3.745 1.264 5.364l4.002-3.13z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.955-1.077 7.94-2.918l-3.737-2.895c-1.036.696-2.364 1.105-4.203 1.105-3.232 0-5.968-2.186-6.946-5.127L1.05 17.3A11.972 11.972 0 0 0 12 24z"
              />
            </svg>
            <span>{isLoading ? "Connecting..." : "Continue with Google"}</span>
          </button>

          <div className="w-full border-t border-[var(--border)] pt-5">
            <a
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-medium tracking-wide text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors group"
            >
              <span>Back to platform overview</span>
              <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}