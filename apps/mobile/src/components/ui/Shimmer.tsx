import { useEffect, useRef } from "react";
import { Animated, Easing, StyleProp, ViewStyle } from "react-native";

export function Shimmer({ style }: { style?: StyleProp<ViewStyle> }) {
  const v = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(v, { toValue: 0.9, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(v, { toValue: 0.35, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [v]);

  return (
    <Animated.View
      style={[
        { backgroundColor: "#1b1708", borderRadius: 14, borderWidth: 1, borderColor: "rgba(212,175,55,0.12)", opacity: v },
        style,
      ]}
    />
  );
}

export default Shimmer;