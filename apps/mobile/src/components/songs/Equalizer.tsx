import { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";
import { colors } from "../../constants/theme";

function Bar({ index, playing, height, color }: { index: number; playing: boolean; height: number; color: string }) {
  const v = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    if (!playing) {
      v.setValue(0.35);
      return;
    }
    const d = 360 + index * 90;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(v, { toValue: 1, duration: d, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(v, { toValue: 0.25, duration: d, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [playing, index, v]);

  return <Animated.View style={{ width: 3, height, borderRadius: 2, backgroundColor: color, transform: [{ scaleY: v }] }} />;
}

export function Equalizer({ playing, height = 14, color = colors.accent }: { playing: boolean; height?: number; color?: string }) {
  return (
    <View style={[styles.row, { height }]}>
      {[0, 1, 2, 3].map((i) => (
        <Bar key={i} index={i} playing={playing} height={height} color={color} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({ row: { flexDirection: "row", alignItems: "flex-end", gap: 2 } });