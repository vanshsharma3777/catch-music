import { StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors } from "../../constants/theme";

/** Soft gold glows behind content (same feel as the web's AmbientBackground). */
export function AmbientBackground() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <LinearGradient
        colors={["rgba(212,175,55,0.22)", "transparent"]}
        style={[styles.blob, { top: -120, left: -140 }]}
      />
      <LinearGradient
        colors={["rgba(230,200,117,0.14)", "transparent"]}
        style={[styles.blob, { top: 360, right: -200 }]}
      />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: "transparent" }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  blob: { position: "absolute", width: 380, height: 380, borderRadius: 190, opacity: 0.9 },
});

export default AmbientBackground;