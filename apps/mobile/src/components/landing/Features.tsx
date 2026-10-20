import { StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { colors } from "../../constants/theme";
import { SectionHeading } from "../ui/SectionHeading";
import { GlowCard } from "../ui/GlowCard";

type Item = { icon: keyof typeof Feather.glyphMap; title: string; tag: string; text: string };

const ITEMS: Item[] = [
  { icon: "zap", title: "Instant Caching", tag: "One tap. Done forever.", text: "Save any song you play for offline listening. No re-downloading until you choose to delete it." },
  { icon: "wifi-off", title: "Works Without Internet", tag: "Metro, flights, treks.", text: "Your saved songs play straight from your device, even with zero signal." },
  { icon: "heart", title: "Likes & Playlists", tag: "Your library, your way.", text: "Like songs, build playlists, and save public playlists from other listeners." },
  { icon: "hard-drive", title: "Smart Storage", tag: "We've got your back.", text: "We check your free space before saving, so your device never runs out unexpectedly." },
];

export function Features() {
  return (
    <View style={styles.wrap}>
      <SectionHeading tag="Features" title="Powerful Features." highlight="Built for Music Lovers." />
      <View style={styles.list}>
        {ITEMS.map((it, i) => (
          <GlowCard key={it.title} innerStyle={{ gap: 6 }}>
            <View style={styles.top}>
              <View style={styles.icon}>
                <Feather name={it.icon} size={20} color={colors.accent} />
              </View>
              <Text style={styles.num}>{String(i + 1).padStart(2, "0")}</Text>
            </View>
            <Text style={styles.title}>{it.title}</Text>
            <Text style={styles.tag}>{it.tag.toUpperCase()}</Text>
            <Text style={styles.text}>{it.text}</Text>
          </GlowCard>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 24 },
  list: { gap: 14 },
  top: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  icon: {
    width: 46, height: 46, borderRadius: 15, alignItems: "center", justifyContent: "center",
    backgroundColor: colors.glowGold, borderWidth: 1, borderColor: colors.borderGlow,
  },
  num: { color: colors.muted, fontSize: 12, fontWeight: "800", letterSpacing: 2 },
  title: { color: colors.pri, fontSize: 20, fontWeight: "800", letterSpacing: -0.3 },
  tag: { color: colors.primary, fontSize: 10, fontWeight: "700", letterSpacing: 1.5 },
  text: { color: colors.sec, fontSize: 14, lineHeight: 21, marginTop: 6 },
});