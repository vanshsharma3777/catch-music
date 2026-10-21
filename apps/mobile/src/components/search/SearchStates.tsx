import { useEffect, useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather, Ionicons } from "@expo/vector-icons";
import { colors, gold, radius } from "../../constants/theme";
import { FadeIn } from "../ui/FadeIn";
import { GoldButton } from "../ui/GoldButton";

const TRY = ["Arijit Singh", "Badshah", "Shreya Ghoshal", "Jubin Nautiyal", "Honey Singh", "Atif Aslam"];

export function SectionTitle({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <View style={styles.sectionRow}>
      <View style={styles.sectionLeft}>
        <View style={styles.bar} />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {action && onAction ? (
        <Pressable onPress={onAction} hitSlop={10}>
          <Text style={styles.action}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function IdleState({
  recents,
  onPick,
  onRemove,
  onClear,
}: {
  recents: string[];
  onPick: (q: string) => void;
  onRemove: (q: string) => void;
  onClear: () => void;
}) {
  return (
    <View style={{ gap: 30 }}>
      <FadeIn style={styles.hero}>
        <LinearGradient colors={gold} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.heroIcon}>
          <Ionicons name="musical-notes" size={34} color="#000" />
        </LinearGradient>
        <Text style={styles.heroTitle}>
          Find your <Text style={{ color: colors.accent }}>next favourite.</Text>
        </Text>
        <Text style={styles.heroSub}>Search millions of songs, artists, albums and playlists.</Text>
      </FadeIn>

      {recents.length > 0 && (
        <FadeIn delay={120}>
          <SectionTitle title="Recent" action="Clear" onAction={onClear} />
          <View style={{ gap: 4 }}>
            {recents.map((r) => (
              <Pressable key={r} onPress={() => onPick(r)} style={styles.recent}>
                <Feather name="clock" size={16} color={colors.muted} />
                <Text style={styles.recentText} numberOfLines={1}>{r}</Text>
                <Pressable onPress={() => onRemove(r)} hitSlop={12}>
                  <Feather name="x" size={16} color={colors.muted} />
                </Pressable>
              </Pressable>
            ))}
          </View>
        </FadeIn>
      )}

      <FadeIn delay={220}>
        <SectionTitle title="Try searching" />
        <View style={styles.chips}>
          {TRY.map((t) => (
            <Pressable key={t} onPress={() => onPick(t)} style={({ pressed }) => [styles.tryChip, pressed && { opacity: 0.8 }]}>
              <Feather name="trending-up" size={13} color={colors.primary} />
              <Text style={styles.tryText}>{t}</Text>
            </Pressable>
          ))}
        </View>
      </FadeIn>
    </View>
  );
}

function Pulse({ children }: { children: React.ReactNode }) {
  const v = useRef(new Animated.Value(0.45)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(v, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(v, { toValue: 0.45, duration: 800, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [v]);
  return <Animated.View style={{ opacity: v }}>{children}</Animated.View>;
}

export function SearchSkeleton() {
  return (
    <Pulse>
      <View style={{ gap: 12 }}>
        {Array.from({ length: 7 }).map((_, i) => (
          <View key={i} style={styles.skRow}>
            <View style={styles.skCover} />
            <View style={{ flex: 1, gap: 8 }}>
              <View style={[styles.skLine, { width: "62%" }]} />
              <View style={[styles.skLine, { width: "38%", height: 10 }]} />
            </View>
          </View>
        ))}
      </View>
    </Pulse>
  );
}

export function EmptyState({ query }: { query: string }) {
  return (
    <FadeIn style={styles.center}>
      <View style={styles.stateIcon}>
        <Feather name="search" size={26} color={colors.accent} />
      </View>
      <Text style={styles.stateTitle}>No results for “{query}”</Text>
      <Text style={styles.stateSub}>Check the spelling or try a different artist, song or album.</Text>
    </FadeIn>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <FadeIn style={styles.center}>
      <View style={[styles.stateIcon, { borderColor: "rgba(239,68,68,0.35)" }]}>
        <Feather name="wifi-off" size={26} color={colors.error} />
      </View>
      <Text style={styles.stateTitle}>Couldn't search</Text>
      <Text style={styles.stateSub}>{message}</Text>
      <View style={{ marginTop: 18 }}>
        <GoldButton label="Try again" icon="refresh-cw" onPress={onRetry} />
      </View>
    </FadeIn>
  );
}

const styles = StyleSheet.create({
  sectionRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 },
  sectionLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  bar: { width: 3, height: 16, borderRadius: 2, backgroundColor: colors.primary },
  sectionTitle: { color: colors.pri, fontSize: 18, fontWeight: "800", letterSpacing: -0.3 },
  action: { color: colors.accent, fontSize: 13, fontWeight: "700" },

  hero: { alignItems: "center", gap: 12, paddingTop: 18 },
  heroIcon: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.primary,
    shadowOpacity: 0.5,
    shadowRadius: 26,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  heroTitle: { color: colors.pri, fontSize: 26, fontWeight: "900", letterSpacing: -0.8, textAlign: "center" },
  heroSub: { color: colors.sec, fontSize: 14, lineHeight: 20, textAlign: "center", maxWidth: 280 },

  recent: { flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 12 },
  recentText: { flex: 1, color: colors.pri, fontSize: 15, fontWeight: "500" },

  chips: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  tryChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderColor: colors.borderGlow,
  },
  tryText: { color: colors.pri, fontSize: 13, fontWeight: "600" },

  skRow: { flexDirection: "row", alignItems: "center", gap: 14, padding: 10 },
  skCover: { width: 54, height: 54, borderRadius: 14, backgroundColor: colors.bgTer },
  skLine: { height: 13, borderRadius: 6, backgroundColor: colors.bgTer },

  center: { alignItems: "center", paddingTop: 64, paddingHorizontal: 20, gap: 8 },
  stateIcon: {
    width: 64,
    height: 64,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    borderColor: colors.borderGlow,
    marginBottom: 8,
  },
  stateTitle: { color: colors.pri, fontSize: 18, fontWeight: "800", textAlign: "center" },
  stateSub: { color: colors.sec, fontSize: 14, lineHeight: 20, textAlign: "center", maxWidth: 280 },
});