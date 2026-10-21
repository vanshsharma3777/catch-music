import { StyleSheet, Text, View } from "react-native";
import { colors } from "../../constants/theme";
import { GoldButton } from "../ui/GoldButton";
import { GlowCard } from "../ui/GlowCard";
import Vinyl from "../Vinyl";

export function FinalCta({ onStart }: { onStart: () => void }) {
  return (
    <GlowCard strong corner={32} innerStyle={{ padding: 26, gap: 14, minHeight: 300 }}>
      <Vinyl size={230} duration={30000} opacity={0.35} style={{ top: -80, right: -90 }} />

      <Text style={styles.kicker}>READY WHEN YOU ARE</Text>
      <Text style={styles.title}>
        Your music,{"\n"}
        <Text style={{ color: colors.accent }}>always with you.</Text>
      </Text>
      <Text style={styles.text}>
        Join CatchMusic and never lose your vibe to a bad signal again.
      </Text>

      <GoldButton label="Sign In to Continue" icon="arrow-right" onPress={onStart} />

      <View style={styles.foot}>
        <Text style={styles.footText}>© 2026 CatchMusic · Built with ❤️ by Vansh</Text>
      </View>
    </GlowCard>
  );
}

const styles = StyleSheet.create({
  kicker: { color: colors.primary, fontSize: 11, fontWeight: "800", letterSpacing: 2.5, marginTop: 70 },
  title: { color: colors.pri, fontSize: 34, fontWeight: "900", letterSpacing: -1.1, lineHeight: 40 },
  text: { color: colors.sec, fontSize: 15, lineHeight: 22, marginBottom: 6 },
  foot: { alignItems: "center", marginTop: 8 },
  footText: { color: colors.muted, fontSize: 12 },
});