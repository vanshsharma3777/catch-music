import { useEffect, useState } from "react";
import { Image, StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../constants/theme";

type Props = {
  uri?: string;
  style?: StyleProp<ViewStyle>;
  iconSize?: number;
};

export function Cover({ uri, style, iconSize = 22 }: Props) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [uri]);

  if (!uri || failed) {
    return (
      <LinearGradient
        colors={["#2a2208", "#14110a", "#2a2208"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.fallback, style]}
      >
        <Ionicons name="musical-notes" size={iconSize} color={colors.primary} />
      </LinearGradient>
    );
  }

  return (
    <View style={[{ overflow: "hidden", backgroundColor: colors.bgTer }, style]}>
      <Image
        source={{ uri }}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
        onError={() => setFailed(true)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: { alignItems: "center", justifyContent: "center", overflow: "hidden" },
});

export default Cover;