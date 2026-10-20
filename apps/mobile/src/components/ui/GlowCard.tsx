import { StyleSheet, View, ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors, radius } from "../../constants/theme";

/** Card with a thin gold-lit edge. `strong` makes the edge brighter. */
export function GlowCard({
  children,
  style,
  innerStyle,
  strong = false,
  corner = radius.lg,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
  innerStyle?: ViewStyle;
  strong?: boolean;
  corner?: number;
}) {
  const edge = strong
    ? (["rgba(230,200,117,0.60)", "rgba(212,175,55,0.06)", "rgba(230,200,117,0.30)"] as const)
    : (["rgba(230,200,117,0.30)", "rgba(255,255,255,0.03)", "rgba(212,175,55,0.14)"] as const);

  return (
    <LinearGradient
      colors={edge}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[{ borderRadius: corner, padding: 1 }, style]}
    >
      <LinearGradient
        colors={[colors.surface, colors.card]}
        style={[styles.inner, { borderRadius: corner - 1 }, innerStyle]}
      >
        {children}
      </LinearGradient>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  inner: { padding: 20, overflow: "hidden" },
});

export default GlowCard;