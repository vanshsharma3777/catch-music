export const colors = {
  bg: "#030303",
  bgSec: "#0A0A0A",
  bgTer: "#121212",
  card: "#0D0D0D",
  surface: "#0F0F0F",
  pri: "#FDFDFD",
  sec: "#A3A3A3",
  muted: "#666666",
  primary: "#D4AF37",
  primaryHover: "#F3E5AB",
  accent: "#E6C875",
  secondary: "#AA7C11",
  border: "rgba(255,255,255,0.04)",
  borderLight: "rgba(255,255,255,0.08)",
  borderGlow: "rgba(212,175,55,0.25)",
  glowGold: "rgba(212,175,55,0.10)",
  success: "#10B981",
  error: "#EF4444",
  glass: "rgba(255,255,255,0.05)",
} as const;

export const gold = [colors.primary, colors.accent] as const;
export const goldSoft = [colors.accent, colors.primaryHover] as const;

export const radius = { sm: 10, md: 16, lg: 24, xl: 32, pill: 999 } as const;
export const space = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 } as const;