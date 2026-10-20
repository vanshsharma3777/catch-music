import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors, gold, radius } from "../../constants/theme";
import { Logo } from "../ui/Logo";

/** Appears (fades in) once the page is scrolled a little. */
export function StickyHeader({
  scrollY,
  top,
  onStart,
}: {
  scrollY: Animated.Value;
  top: number;
  onStart: () => void;
}) {
  const opacity = scrollY.interpolate({ inputRange: [40, 140], outputRange: [0, 1], extrapolate: "clamp" });
  const shift = scrollY.interpolate({ inputRange: [40, 140], outputRange: [-12, 0], extrapolate: "clamp" });

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[styles.bar, { paddingTop: top + 8, opacity, transform: [{ translateY: shift }] }]}
    >
      <View style={styles.row}>
        <Logo size={34} />
        <Pressable onPress={onStart} style={({ pressed }) => pressed && { opacity: 0.85 }}>
          <LinearGradient colors={gold} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.btn}>
            <Text style={styles.btnText}>Sign in</Text>
          </LinearGradient>
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    paddingBottom: 10,
    paddingHorizontal: 24,
    backgroundColor: "rgba(3,3,3,0.94)",
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  btn: { paddingHorizontal: 18, paddingVertical: 9, borderRadius: radius.pill },
  btnText: { color: "#000", fontWeight: "800", fontSize: 13, letterSpacing: 0.3 },
});