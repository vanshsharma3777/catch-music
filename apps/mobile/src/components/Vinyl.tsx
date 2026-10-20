import { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, View, ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors } from "../constants/theme";

type Props = {
  size: number;
  /** ms for one full turn. Bigger = slower. */
  duration?: number;
  reverse?: boolean;
  opacity?: number;
  style?: ViewStyle;
  
};

const GROOVES = [0.97, 0.91, 0.85, 0.79, 0.73, 0.67, 0.61, 0.55];

export function Vinyl({ size, duration = 45000, reverse = false, opacity = 0.5, style }: Props) {
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(spin, { toValue: 1, duration, easing: Easing.linear, useNativeDriver: true })
    );
    loop.start();
    return () => loop.stop();
  }, [spin, duration]);

  const rotate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: reverse ? ["360deg", "0deg"] : ["0deg", "360deg"],
  });

  const label = size * 0.34;
  const hole = size * 0.035;
  const arcA = size * 0.88;
  const arcB = size * 0.7;

  return (
    <View pointerEvents="none" style={[{ position: "absolute", width: size, height: size, opacity }, style]}>
      <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ rotate }] }]}>
        <LinearGradient
          colors={["#1c1c1c", "#080808", "#171717"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[StyleSheet.absoluteFill, { borderRadius: size / 2 }]}
        />

        {GROOVES.map((r, i) => {
          const d = size * r;
          return (
            <View
              key={r}
              style={{
                position: "absolute",
                width: d,
                height: d,
                borderRadius: d / 2,
                top: (size - d) / 2,
                left: (size - d) / 2,
                borderWidth: StyleSheet.hairlineWidth,
                borderColor: i % 2 ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.035)",
              }}
            />
          );
        })}

        {/* Gold arcs: these make the rotation easy to see */}
        <View
          style={{
            position: "absolute",
            width: arcA,
            height: arcA,
            borderRadius: arcA / 2,
            top: (size - arcA) / 2,
            left: (size - arcA) / 2,
            borderWidth: 2,
            borderColor: "transparent",
            borderTopColor: "rgba(230,200,117,0.55)",
          }}
        />
        <View
          style={{
            position: "absolute",
            width: arcB,
            height: arcB,
            borderRadius: arcB / 2,
            top: (size - arcB) / 2,
            left: (size - arcB) / 2,
            borderWidth: 1.5,
            borderColor: "transparent",
            borderBottomColor: "rgba(212,175,55,0.4)",
          }}
        />

        {/* Centre label */}
        <LinearGradient
          colors={[colors.accent, colors.primary, colors.secondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            position: "absolute",
            width: label,
            height: label,
            borderRadius: label / 2,
            top: (size - label) / 2,
            left: (size - label) / 2,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <View
            style={{
              position: "absolute",
              width: label * 0.74,
              height: label * 0.74,
              borderRadius: label,
              borderWidth: 1,
              borderColor: "rgba(0,0,0,0.25)",
            }}
          />
          {/* little dot so you can see the label turning */}
          <View
            style={{
              position: "absolute",
              top: label * 0.1,
              width: label * 0.1,
              height: label * 0.1,
              borderRadius: label,
              backgroundColor: "rgba(0,0,0,0.45)",
            }}
          />
          <View
            style={{
              width: hole * 2,
              height: hole * 2,
              borderRadius: hole,
              backgroundColor: colors.bg,
              borderWidth: 1,
              borderColor: "rgba(0,0,0,0.4)",
            }}
          />
        </LinearGradient>
      </Animated.View>

      {/* Fixed light reflection + rim (does not rotate) */}
      <View
        style={[
          StyleSheet.absoluteFill,
          { borderRadius: size / 2, overflow: "hidden", borderWidth: 1, borderColor: "rgba(230,200,117,0.2)" },
        ]}
      >
        <LinearGradient
          colors={["rgba(255,255,255,0)", "rgba(255,255,255,0.12)", "rgba(255,255,255,0)"]}
          locations={[0.32, 0.5, 0.68]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </View>
    </View>
  );
}

export default Vinyl;