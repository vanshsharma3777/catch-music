import { Image, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors, gold } from "../../constants/theme";


export function Logo({ size = 44, withText = true }: { size?: number; withText?: boolean }) {
  return (
    <View style={styles.row}>
      <LinearGradient
        colors={gold}
        style={{ width: size, height: size, borderRadius: size * 0.34, padding: 1.5 }}
      >
        <Image
          source={require("../../../assets/cm circular.png")}
          style={{ flex: 1, borderRadius: size * 0.3 }}
        />
      </LinearGradient>
      {withText && <Text style={styles.text}>CatchMusic</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  text: { color: colors.pri, fontSize: 24, fontWeight: "800", letterSpacing: -0.5 },
});