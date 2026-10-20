import { StyleSheet, Text, View } from "react-native";
import { colors, radius } from "../../constants/theme";

export function SectionHeading({
  tag,
  title,
  highlight,
  subtitle,
}: {
  tag: string;
  title: string;
  highlight: string;
  subtitle?: string;
}) {
  return (
    <View style={styles.wrap}>
      <View style={styles.pill}>
        <Text style={styles.pillText}>{tag.toUpperCase()}</Text>
      </View>
      <Text style={styles.title}>
        {title} <Text style={styles.highlight}>{highlight}</Text>
      </Text>
      {subtitle ? <Text style={styles.sub}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 12, alignItems: "flex-start" },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  pillText: { color: colors.primary, fontSize: 11, fontWeight: "700", letterSpacing: 2 },
  title: { color: colors.pri, fontSize: 32, fontWeight: "800", letterSpacing: -0.8, lineHeight: 38 },
  highlight: { color: colors.accent },
  sub: { color: colors.sec, fontSize: 15, lineHeight: 22 },
});