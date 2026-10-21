import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { usePathname } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../../constants/theme";
import { useProfile } from "../../hooks/useProfile";
import { Logo } from "../ui/Logo";
import { Avatar, ProfileDrawer } from "./ProfileDrawer";

/* ---- Glow settings (yahan se size/brightness badlo) ---- */
const GLOW_RADIUS = 280; // kitna phailega
const GLOW_RINGS = 24; // zyada = smooth
const GLOW_RING_OPACITY = 0.0075; // 0.0075 * 24 ~ center par 17% brightness
const GLOW_CENTER_X = 70; // logo ke aas-paas (left se)

/** radial blob jaisi light: bade se chhote gol ek ke upar ek, har ek bahut halka */
const RINGS = Array.from({ length: GLOW_RINGS }, (_, i) => GLOW_RADIUS * (1 - i / GLOW_RINGS));

function LogoGlow({ centerY }: { centerY: number }) {
  return (
    <View pointerEvents="none" style={{ position: "absolute", left: GLOW_CENTER_X, top: centerY }}>
      {RINGS.map((r, i) => (
        <View
          key={i}
          style={{
            position: "absolute",
            left: -r,
            top: -r,
            width: r * 2,
            height: r * 2,
            borderRadius: r,
            backgroundColor: colors.accent,
            opacity: GLOW_RING_OPACITY,
          }}
        />
      ))}
    </View>
  );
}

export function AppHeader() {
  const insets = useSafeAreaInsets();
  const profile = useProfile();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // glow sirf home par; welcome/landing/login par nahi
  const isHome = pathname === "/home" || pathname.endsWith("/home");

  return (
    <>
      <View style={[styles.bar, isHome && styles.barHome, { paddingTop: insets.top + 8 }]}>
        {isHome && <LogoGlow centerY={insets.top + 8 + 19} />}
        <Logo size={38} />
        <Pressable
          onPress={() => setOpen(true)}
          hitSlop={8}
          style={({ pressed }) => pressed && { opacity: 0.8, transform: [{ scale: 0.96 }] }}
        >
          <Avatar profile={profile} size={42} />
        </Pressable>
      </View>

      <ProfileDrawer visible={open} onClose={() => setOpen(false)} profile={profile} />
    </>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: "rgba(3,3,3,0.96)",
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    zIndex: 10, // glow neeche ke content par bhi phail sake
  },
  // home par: transparent header, koi line nahi (web jaisa)
  barHome: {
    backgroundColor: "transparent",
    borderBottomColor: "transparent",
  },
});

export default AppHeader;