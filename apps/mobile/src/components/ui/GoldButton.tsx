import { Pressable, StyleSheet, Text, ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { colors, gold, radius } from "../../constants/theme";

type Props = {
  label: string;
  onPress?: () => void;
  variant?: "gold" | "ghost";
  icon?: keyof typeof Feather.glyphMap;
  style?: ViewStyle;
};

export function GoldButton({ label, onPress, variant = "gold", icon, style }: Props) {
  const isGold = variant === "gold";
  const content = (
    <>
      <Text style={[styles.label, { color: isGold ? "#000" : colors.pri }]}>{label}</Text>
      {icon && <Feather name={icon} size={16} color={isGold ? "#000" : colors.accent} />}
    </>
  );

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.wrap, pressed && { transform: [{ scale: 0.97 }], opacity: 0.92 }, style]}
    >
      {isGold ? (
        <LinearGradient colors={gold} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.inner, styles.shadow]}>
          {content}
        </LinearGradient>
      ) : (
        <Pressable style={[styles.inner, styles.ghost]} onPress={onPress}>
          {content}
        </Pressable>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { borderRadius: radius.pill },
  inner: {
    height: 54,
    paddingHorizontal: 28,
    borderRadius: radius.pill,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  ghost: { backgroundColor: colors.glass, borderWidth: 1, borderColor: colors.borderLight },
  shadow: {
    shadowColor: colors.primary,
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  label: { fontSize: 15, fontWeight: "700", letterSpacing: 0.3 },
});