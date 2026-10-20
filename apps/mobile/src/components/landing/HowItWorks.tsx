import { StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { colors } from "../../constants/theme";
import { SectionHeading } from "../ui/SectionHeading";

const STEPS: { icon: keyof typeof Feather.glyphMap; title: string; text: string }[] = [
  { icon: "play", title: "Play a song", text: "Stream anything you love from the catalog." },
  { icon: "download", title: "Save it", text: "Tap the bookmark to store it on your device." },
  { icon: "shield", title: "Stored securely", text: "Files stay private, on your phone only." },
  { icon: "headphones", title: "Listen offline", text: "Press play anywhere, no network needed." },
];

export function HowItWorks() {
  return (
    <View style={styles.wrap}>
      <SectionHeading tag="How it works" title="Simple Steps." highlight="Powerful Experience." />
      <View style={styles.steps}>
        {STEPS.map((s, i) => (
          <View key={s.title} style={styles.row}>
            <View style={styles.rail}>
              <View style={styles.dot}>
                <Feather name={s.icon} size={18} color={colors.accent} />
              </View>
              {i < STEPS.length - 1 && <View style={styles.line} />}
            </View>
            <View style={styles.copy}>
              <Text style={styles.stepNo}>STEP {i + 1}</Text>
              <Text style={styles.title}>{s.title}</Text>
              <Text style={styles.text}>{s.text}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 28 },
  steps: { paddingLeft: 4 },
  row: { flexDirection: "row", gap: 16 },
  rail: { alignItems: "center" },
  dot: {
    width: 48, height: 48, borderRadius: 16, alignItems: "center", justifyContent: "center",
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderGlow,
  },
  line: { width: 1, flex: 1, backgroundColor: colors.borderLight, marginVertical: 4 },
  copy: { flex: 1, paddingBottom: 26, gap: 2 },
  stepNo: { color: colors.primary, fontSize: 10, fontWeight: "800", letterSpacing: 2 },
  title: { color: colors.pri, fontSize: 17, fontWeight: "700" },
  text: { color: colors.sec, fontSize: 14, lineHeight: 20 },
});