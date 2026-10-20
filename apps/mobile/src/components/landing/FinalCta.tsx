import { StyleSheet, Text, View } from "react-native";
import { colors } from "../../constants/theme";
import { GoldButton } from "../ui/GoldButton";
import { GlowCard } from "../ui/GlowCard";

export function FinalCta({ onStart }: { onStart: () => void }) {
  return (
    <GlowCard strong corner={32} innerStyle={{ padding: 26, gap: 14 }}>
      <Text style={styles.title}>
        Your music, <Text style={{ color: colors.accent }}>always with you.</Text>
      </Text>
      <Text style={styles.text}>Join CatchMusic and never lose your vibe to a bad signal again.</Text>
      <GoldButton label="Sign In to Continue" icon="arrow-right" onPress={onStart} />
      <View style={styles.foot}>
        <Text style={styles.footText}>© 2026 CatchMusic · Built with ❤️ by Vansh</Text>
      </View>
    </GlowCard>
  );
}

const styles = StyleSheet.create({
  title: { color: colors.pri, fontSize: 30, fontWeight: "900", letterSpacing: -0.9, lineHeight: 36 },
  text: { color: colors.sec, fontSize: 15, lineHeight: 22, marginBottom: 6 },
  foot: { alignItems: "center", marginTop: 8 },
  footText: { color: colors.muted, fontSize: 12 },
});