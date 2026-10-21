import { useEffect, useState } from "react";
import { Image, StyleProp, StyleSheet, Text, View, ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { colors } from "../../constants/theme";

type Props = {
  uri?: string;
  style?: StyleProp<ViewStyle>;
  radius?: number;
  /** Shows the first letter instead of a music note when there is no image. */
  label?: string;
};

export function CoverImage({ uri, style, radius = 16, label }: Props) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [uri]);
  const show = !!uri && !failed;

  return (
    <View style={[{ borderRadius: radius, overflow: "hidden", backgroundColor: colors.bgTer }, style]}>
      {show ? (
        <Image source={{ uri }} style={StyleSheet.absoluteFill} resizeMode="cover" onError={() => setFailed(true)} />
      ) : (
        <LinearGradient colors={[colors.bgTer, colors.surface]} style={[StyleSheet.absoluteFill, styles.fallback]}>
          {label ? (
            <Text style={styles.letter}>{label.trim().charAt(0).toUpperCase() || "?"}</Text>
          ) : (
            <Feather name="music" size={22} color={colors.muted} />
          )}
        </LinearGradient>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: { alignItems: "center", justifyContent: "center" },
  letter: { color: colors.primary, fontSize: 20, fontWeight: "800" },
});