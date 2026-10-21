import { StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { colors, gold } from "../../constants/theme";
import { SectionHeading } from "../ui/SectionHeading";
import { STEPS } from "./landingData";

export function HowItWorks() {
  return (
    <View style={{ gap: 30 }}>
      <SectionHeading tag="How it works" title="Four steps." highlight="Zero effort." />

      <View>
        {STEPS.map((s, i) => (
          <View key={s.title} style={styles.row}>
            <View style={styles.rail}>
              <LinearGradient colors={gold} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.badge}>
                <Feather name={s.icon} size={18} color="#000" />
              </LinearGradient>
              {i < STEPS.length - 1 && (
                <LinearGradient
                  colors={["rgba(212,175,55,0.6)", "rgba(212,175,55,0.05)"]}
                  style={styles.line}
                />
              )}
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
  row: { flexDirection: "row", gap: 18 },
  rail: { alignItems: "center" },
  badge: {
    width: 48, height: 48, borderRadius: 16, alignItems: "center", justifyContent: "center",
    shadowColor: colors.primary, shadowOpacity: 0.35, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 6,
  },
  line: { width: 2, flex: 1, marginVertical: 6, borderRadius: 1 },
  copy: { flex: 1, paddingBottom: 28, gap: 2, paddingTop: 2 },
  stepNo: { color: colors.primary, fontSize: 10, fontWeight: "800", letterSpacing: 2 },
  title: { color: colors.pri, fontSize: 18, fontWeight: "800", letterSpacing: -0.3 },
  text: { color: colors.sec, fontSize: 14, lineHeight: 21 },
});