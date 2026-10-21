import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../constants/theme";

type IconName = keyof typeof Ionicons.glyphMap;

export function SectionHeader({
  icon,
  title,
  subtitle,
  onSeeAll,
}: {
  icon: IconName;
  title: string;
  subtitle?: string;
  onSeeAll?: () => void;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.iconBox}>
        <Ionicons name={icon} size={18} color={colors.accent} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{title}</Text>
        {!!subtitle && (
          <Text style={styles.sub} numberOfLines={1}>
            {subtitle}
          </Text>
        )}
      </View>
      {onSeeAll && (
        <Pressable onPress={onSeeAll} hitSlop={10} style={styles.see}>
          <Text style={styles.seeText}>See all</Text>
          <Ionicons name="chevron-forward" size={14} color={colors.accent} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 20 },
  iconBox: {
    width: 38, height: 38, borderRadius: 13, alignItems: "center", justifyContent: "center",
    backgroundColor: colors.glowGold, borderWidth: 1, borderColor: colors.borderGlow,
  },
  title: { color: colors.pri, fontSize: 20, fontWeight: "900", letterSpacing: -0.4 },
  sub: { color: colors.muted, fontSize: 12, marginTop: 1 },
  see: { flexDirection: "row", alignItems: "center", gap: 2 },
  seeText: { color: colors.accent, fontSize: 13, fontWeight: "800" },
});

export default SectionHeader;