import { StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { colors, radius } from "../../constants/theme";
import { Logo } from "../ui/Logo";
import { FadeIn } from "../ui/FadeIn";
import { GoldButton } from "../ui/GoldButton";
import { PlayerPreview } from "./PlayerPreview";
import { PERKS } from "./landingData";

type Props = { onStart: () => void; onExplore: () => void };

export function Hero({ onStart, onExplore }: Props) {
  return (
    <View style={styles.wrap}>
      <FadeIn>
        <Logo />
      </FadeIn>

      <FadeIn delay={120} style={{ alignItems: "flex-start" }}>
        <View style={styles.badge}>
          <View style={styles.dot} />
          <Text style={styles.badgeText}>Your music. Always with you.</Text>
        </View>
      </FadeIn>

      <FadeIn delay={220}>
        <Text style={styles.h1}>
          Save it once.{"\n"}Play it <Text style={styles.gold}>anywhere.</Text>
        </Text>
        <Text style={styles.p}>
          Cache the songs you love and listen with zero signal. No ads, no premium, no excuses.
        </Text>
      </FadeIn>

      <FadeIn delay={320} style={styles.actions}>
        <GoldButton label="Get Started" icon="arrow-right" onPress={onStart} />
        <GoldButton label="Explore Features" variant="ghost" onPress={onExplore} />
      </FadeIn>

      <FadeIn delay={420}>
        <View style={styles.perks}>
          {PERKS.map((p) => (
            <View key={p.label} style={styles.perk}>
              <View style={styles.perkIcon}>
                <Feather name={p.icon} size={16} color={colors.accent} />
              </View>
              <Text style={styles.perkText}>{p.label}</Text>
            </View>
          ))}
        </View>
      </FadeIn>

      <FadeIn delay={560} distance={40} style={{ marginTop: 8 }}>
        <PlayerPreview />
      </FadeIn>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 26, paddingTop: 12 },
  badge: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.pill,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderGlow,
  },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primary },
  badgeText: { color: colors.sec, fontSize: 12, fontWeight: "600", letterSpacing: 0.3 },
  h1: { color: colors.pri, fontSize: 48, fontWeight: "900", letterSpacing: -2, lineHeight: 54 },
  gold: { color: colors.accent },
  p: { color: colors.sec, fontSize: 16, lineHeight: 24, marginTop: 14, maxWidth: 360 },
  actions: { gap: 12 },
  perks: { flexDirection: "row", gap: 10 },
  perk: {
    flex: 1, alignItems: "center", gap: 8, paddingVertical: 14, borderRadius: radius.md,
    backgroundColor: colors.glass, borderWidth: 1, borderColor: colors.border,
  },
  perkIcon: {
    width: 34, height: 34, borderRadius: 12, alignItems: "center", justifyContent: "center",
    backgroundColor: colors.glowGold, borderWidth: 1, borderColor: colors.borderGlow,
  },
  perkText: { color: colors.sec, fontSize: 11, fontWeight: "700", textAlign: "center", lineHeight: 15 },
});