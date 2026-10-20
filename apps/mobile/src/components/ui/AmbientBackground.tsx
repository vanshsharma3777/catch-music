import { StyleSheet, View } from "react-native";
import Vinyl from "../Vinyl";

export function AmbientBackground() {
  return (
    <View pointerEvents="none" style={styles.wrap}>
       <Vinyl size={340} duration={45000} opacity={0.3} style={{ top: -120, left: -150 }} />
      <Vinyl size={400} duration={60000} reverse opacity={0.35} style={{ bottom: -150, right: -170 }} />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: "transparent" }]} />
    </View>
  );
}

const styles = StyleSheet.create({
   wrap: { ...StyleSheet.absoluteFill, overflow: "hidden" },
});

export default AmbientBackground;