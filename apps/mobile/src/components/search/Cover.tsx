import { useState } from "react";
import { Image, StyleSheet, View, ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../constants/theme";

type Props = {
  uri?: string;
  size: number;
  round?: boolean;
  radius?: number;
  style?: ViewStyle;
};

/** Artwork with a gold hairline and a royal fallback when there is no image. */
export function Cover({ uri, size, round = false, radius = 14, style }: Props) {
  const [failed, setFailed] = useState(false);
  const r = round ? size / 2 : radius;
  const showImg = !!uri && !failed;

  return (
    <View
      style={[
        { width: size, height: size, borderRadius: r },
        styles.frame,
        style,
      ]}
    >
      {showImg ? (
        <Image
          source={{ uri }}
          onError={() => setFailed(true)}
          style={{ width: "100%", height: "100%", borderRadius: r }}
          resizeMode="cover"
        />
      ) : (
        <LinearGradient
          colors={[colors.bgTer, colors.surface]}
          style={[StyleSheet.absoluteFill, styles.center, { borderRadius: r }]}
        >
          <Ionicons name={round ? "person" : "musical-notes"} size={size * 0.38} color={colors.primary} />
        </LinearGradient>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    backgroundColor: colors.bgTer,
    
    overflow: "hidden",
  },
  center: { alignItems: "center", justifyContent: "center" },
});