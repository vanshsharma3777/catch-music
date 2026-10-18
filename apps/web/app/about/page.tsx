"use client"

import { Copyright, Globe, ShieldCheck, Volume2 } from "lucide-react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import MainSection from "../../components/landing/main_section";
import HeaderSection from "../../components/landing/Header_section";
import FeaturesSection from "../../components/landing/features_section";
import ProblemSection from "../../components/landing/problems";
import WorkingSection from "../../components/landing/working";
import MomentsSection from "../../components/landing/moments";
import AboutSection from "../../components/landing/about";
import { FaLinkedin } from "react-icons/fa";
import { SiGithub, SiX } from "react-icons/si";
import ScrollButtons from "../../components/scrollButton";
import { useSession } from "next-auth/react";

export default function ThemePreview() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      const checkUserStatus = async () => {
        try {
          const res = await fetch("/api/user/preferences");
          const data = await res.json();

          if (data.success && data.hasCompletedOnboarding) {
            if (data.favoriteSingers && data.favoriteSingers.length > 0) {
              localStorage.setItem(
                "catchmusic_preferences",
                JSON.stringify(data.favoriteSingers)
              );
            }
            router.replace("/");
            return;
          }
          const localPrefs = localStorage.getItem("catchmusic_preferences");
          if (localPrefs) {
            try {
              const parsed = JSON.parse(localPrefs);
              if (Array.isArray(parsed) && parsed.length > 0) {
                fetch("/api/user/preferences", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ favoriteSingers: parsed }),
                }).catch(() => {});

                router.replace("/");
                return;
              }
            } catch (e) {}
          }

          router.replace("/singer-setup");
        } catch (err) {
          console.error("Failed to check onboarding state:", err);
          const localPrefs = localStorage.getItem("catchmusic_preferences");
          if (localPrefs) {
            router.replace("/");
          } else {
            router.replace("/singer-setup");
          }
        }
      };

      checkUserStatus();
    }
  }, [status, router]);

  return (
    <div className="">
      <div className={`absolute top-12 left-20 h-[100px] w-[100px] -z-10 bg-glow-gold blur-[80px]`}></div>
      <HeaderSection />

      <MainSection />
      <section className="py-12 bg-bg">
        <div className="max-w-7xl mx-auto px-6 lg:px-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 rounded-2xl border border-border bg-gradient-to-b from-surface to-card p-6 lg:p-8 shadow-md">
            <div className="flex items-start gap-4 p-2 group">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-bg-ter border border-border-light text-accent shadow-sm group-hover:border-accent/35 transition-colors duration-300">
                <Globe size={22} strokeWidth={1.75} />
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-base text-pri tracking-wide">Works Everywhere</h3>
                <p className="text-xs lg:text-sm text-sec leading-relaxed">
                  Cross-platform support optimized seamlessly for all your active ecosystems.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-2 border-y md:border-y-0 md:border-x border-border/60 group px-2 md:px-6">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-bg-ter border border-border-light text-accent shadow-sm group-hover:border-accent/35 transition-colors duration-300">
                <Volume2 size={22} strokeWidth={1.75} />
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-base text-pri tracking-wide">High Quality Audio</h3>
                <p className="text-xs lg:text-sm text-sec leading-relaxed">
                  Experience loss-free acoustics delivered directly through localized spatial channels.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-2 group md:pl-6">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-bg-ter border border-border-light text-accent shadow-sm group-hover:border-accent/35 transition-colors duration-300">
                <ShieldCheck size={22} strokeWidth={1.75} />
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-base text-pri tracking-wide">Private & Secure</h3>
                <p className="text-xs lg:text-sm text-sec leading-relaxed">
                  Isolated sandbox caching means your analytical data logs remain entirely your own.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
      <FeaturesSection />
      <ProblemSection />
      <WorkingSection />
      <MomentsSection />
      <AboutSection />

      <ScrollButtons />

      <footer className="w-full bg-bg py-10">
        <div className="max-w-7xl mx-auto px-6 lg:px-16">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 rounded-2xl border border-border bg-gradient-to-b from-surface to-card px-6 py-5 shadow-md">
            <div className="flex items-center gap-2 text-xs md:text-sm text-sec font-medium tracking-wide">
              <Copyright size={16} className="text-secondary" />
              <span>2026 CatchMusic. All rights reserved.</span>
            </div>

            <div className="flex items-center justify-center gap-6">
              <a
                href="https://github.com/vanshsharma3777"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 text-xs md:text-sm text-sec hover:text-pri font-medium tracking-wide transition-colors duration-300 group"
              >
                <SiGithub size={16} className="text-secondary group-hover:text-primary transition-colors" />
                <span>Github</span>
              </a>

              <a
                href="https://x.com/itz_sharmaji001"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 text-xs md:text-sm text-sec hover:text-pri font-medium tracking-wide transition-colors duration-300 group"
              >
                <SiX size={14} className="text-secondary group-hover:text-primary transition-colors" />
                <span>X</span>
              </a>

              <a
                href="https://www.linkedin.com/in/vansh-sharma-812199316/"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 text-xs md:text-sm text-sec hover:text-pri font-medium tracking-wide transition-colors duration-300 group"
              >
                <FaLinkedin size={16} className="text-secondary group-hover:text-primary transition-colors" />
                <span>LinkedIn</span>
              </a>
            </div>

            <div className="text-xs md:text-sm text-muted font-medium tracking-wide">
              Built with <span className="text-error/80 px-0.5">❤️</span> by <span className="text-pri font-semibold">Vansh</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
