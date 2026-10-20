import { useEffect, useRef, useState } from "react";
import { Animated, Easing, Pressable, StyleSheet, Text, View } from "react-native";
import { Redirect, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, gold, radius } from "../constants/theme";
import { AmbientBackground } from "../components/ui/AmbientBackground";
import { FadeIn } from "../components/ui/FadeIn";
import { GlowCard } from "../components/ui/GlowCard";
import { Logo } from "../components/ui/Logo";
import { useAuth } from "../providers/AuthProvider";

function Ring({ delay, size }: { delay: number; size: number }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(v, { toValue: 1, duration: 3200, delay, easing: Easing.out(Easing.ease), useNativeDriver: true })
    );
    loop.start();
    return () => loop.stop();
  }, [v, delay]);
  return (
    <Animated.View
      style={[
        styles.ring,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          opacity: v.interpolate({ inputRange: [0, 1], outputRange: [0.55, 0] }),
          transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1.7] }) }],
        },
      ]}
    />
  );
}

function Emblem() {
  return (
    <View style={styles.emblem}>
      <Ring size={110} delay={0} />
      <Ring size={110} delay={1050} />
      <Ring size={110} delay={2100} />
      <LinearGradient colors={gold} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.emblemCore}>
        <Ionicons name="musical-notes" size={42} color="#000" />
      </LinearGradient>
    </View>
  );
}

export default function SignInScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { status, signIn } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (status === "signedIn") return <Redirect href={"/home" as never} />;

  const onPress = async () => {
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      await signIn();
      router.replace("/home" as never);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Try again.");
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <AmbientBackground />

      <View style={[styles.top, { paddingTop: insets.top + 12 }]}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.back}>
          <Feather name="arrow-left" size={18} color={colors.pri} />
        </Pressable>
      </View>

      <View style={styles.center}>
        <FadeIn>
          <Emblem />
        </FadeIn>

        <FadeIn delay={150} style={{ alignItems: "center", gap: 10 }}>
          <Text style={styles.title}>
            Welcome to <Text style={{ color: colors.accent }}>CatchMusic</Text>
          </Text>
          <Text style={styles.sub}>
            Sign in to sync your library and unlock offline caching for every song you love.
          </Text>
        </FadeIn>

        <FadeIn delay={300} style={{ width: "100%" }}>
          <GlowCard strong corner={28} innerStyle={{ padding: 22, gap: 14 }}>
            <Pressable
              onPress={onPress}
              disabled={loading}
              style={({ pressed }) => [styles.google, pressed && { transform: [{ scale: 0.98 }] }, loading && { opacity: 0.7 }]}
            >
              <Ionicons name="logo-google" size={20} color="#111" />
              <Text style={styles.googleText}>{loading ? "Connecting..." : "Continue with Google"}</Text>
            </Pressable>

            {error ? (
              <View style={styles.errBox}>
                <Feather name="alert-circle" size={15} color={colors.error} />
                <Text style={styles.errText}>{error}</Text>
              </View>
            ) : null}

            <View style={styles.divider}>
              <View style={styles.line} />
              <Feather name="lock" size={12} color={colors.muted} />
              <View style={styles.line} />
            </View>

            <Text style={styles.devNote}>
              Dev mode: signing in with your test token. Real Google sign-in comes later.
            </Text>
          </GlowCard>
        </FadeIn>
      </View>

      <FadeIn delay={450} style={[styles.bottom, { paddingBottom: insets.bottom + 20 }]}>
        <Logo size={26} />
        <Text style={styles.foot}>Your music. Always with you.</Text>
      </FadeIn>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  top: { paddingHorizontal: 24 },
  back: {
    width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center",
    backgroundColor: colors.glass, borderWidth: 1, borderColor: colors.borderLight,
  },
  center: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24, gap: 28 },
  emblem: { width: 180, height: 180, alignItems: "center", justifyContent: "center" },
  ring: { position: "absolute", borderWidth: 1.5, borderColor: colors.primary },
  emblemCore: {
    width: 104, height: 104, borderRadius: 52, alignItems: "center", justifyContent: "center",
    shadowColor: colors.primary, shadowOpacity: 0.5, shadowRadius: 28, shadowOffset: { width: 0, height: 10 }, elevation: 12,
  },
  title: { color: colors.pri, fontSize: 32, fontWeight: "900", letterSpacing: -1, textAlign: "center" },
  sub: { color: colors.sec, fontSize: 15, lineHeight: 22, textAlign: "center", maxWidth: 320 },
  google: {
    height: 56, borderRadius: radius.pill, backgroundColor: "#FDFDFD",
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 12,
  },
  googleText: { color: "#111", fontSize: 16, fontWeight: "800", letterSpacing: 0.2 },
  errBox: {
    flexDirection: "row", gap: 8, alignItems: "center", padding: 12, borderRadius: radius.sm,
    backgroundColor: "rgba(239,68,68,0.10)", borderWidth: 1, borderColor: "rgba(239,68,68,0.3)",
  },
  errText: { color: colors.error, fontSize: 12, flex: 1 },
  divider: { flexDirection: "row", alignItems: "center", gap: 10 },
  line: { flex: 1, height: 1, backgroundColor: colors.borderLight },
  devNote: { color: colors.muted, fontSize: 12, lineHeight: 18, textAlign: "center" },
  bottom: { alignItems: "center", gap: 6 },
  foot: { color: colors.muted, fontSize: 12 },
});