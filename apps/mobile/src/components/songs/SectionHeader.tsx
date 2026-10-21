import { Pressable, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { colors } from "../../constants/theme";

type Props = {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  subtitle?: string;
  action?: { label: string; onPress: () => void };
};

export function SectionHeader({ icon, title, subtitle, action }: Props) {
  return (
    <View style={styles.row}>
      <View style={styles.icon}>
        <Feather name={icon} size={18} color={colors.accent} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        {subtitle ? <Text style={styles.sub} numberOfLines={1}>{subtitle}</Text> : null}
      </View>
      {action && (
        <Pressable onPress={action.onPress} hitSlop={8}>
          <Text style={styles.action}>{action.label}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  icon: {
    width: 40, height: 40, borderRadius: 14, alignItems: "center", justifyContent: "center",
    backgroundColor: colors.glowGold, borderWidth: 1, borderColor: colors.borderGlow,
  },
  title: { color: colors.pri, fontSize: 20, fontWeight: "800", letterSpacing: -0.4 },
  sub: { color: colors.muted, fontSize: 12, marginTop: 1 },
  action: { color: colors.accent, fontSize: 13, fontWeight: "700" },
});