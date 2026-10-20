import {  StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { colors, radius } from "../../constants/theme";
import { Logo } from "../ui/Logo";
import { FadeIn } from "../ui/FadeIn";
import { GoldButton } from "../ui/GoldButton";
import { PlayerPreview } from "./PlayerPreview";

const PERKS: { icon: keyof typeof Feather.glyphMap; label: string }[] = [
  { icon: "wifi-off", label: "Offline\nready" },
  { icon: "slash", label: "Zero\nads" },
  { icon: "unlock", label: "No premium\nneeded" },
];



export function Hero({ onStart, onExplore }: { onStart: () => void; onExplore: () => void }) {
  return (
    <View style={styles.wrap}>
      <FadeIn>
        <Logo />
      </FadeIn>

      <FadeIn delay={120} style={styles.badgeWrap}>
        <View style={styles.badge}>
          <Feather name="headphones" size={13} color={colors.primary} />
          <Text style={styles.badgeText}>Your music. Always with you.</Text>
        </View>
      </FadeIn>

      <FadeIn delay={220}>
        <Text style={styles.h1}>
          Save Your Music.{"\n"}Listen <Text style={styles.gold}>Offline.</Text>
        </Text>
        <Text style={styles.p}>
          Cache your favorite songs and listen anytime, anywhere. No internet? No problem.
        </Text>
      </FadeIn>

      <FadeIn delay={320} style={styles.actions}>
        <GoldButton label="Get Started" icon="arrow-right" onPress={onStart} />
        <GoldButton label="Explore Features" variant="ghost" onPress={onExplore} />
      </FadeIn>

      <FadeIn delay={400}>
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

      <FadeIn delay={520} distance={34}>
        <View>
          <PlayerPreview />
        </View>
      </FadeIn>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 24, paddingTop: 12 },
  badgeWrap: { alignItems: "flex-start" },
  badge: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.pill,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderGlow,
  },
  badgeText: { color: colors.sec, fontSize: 12, fontWeight: "600" },
  h1: { color: colors.pri, fontSize: 46, fontWeight: "900", letterSpacing: -1.8, lineHeight: 52 },
  gold: { color: colors.accent },
  p: { color: colors.sec, fontSize: 16, lineHeight: 24, marginTop: 14 },
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