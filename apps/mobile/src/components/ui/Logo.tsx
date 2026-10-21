import { Image, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors, gold } from "../../constants/theme";

export function Logo({ size = 44, withText = true }: { size?: number; withText?: boolean }) {
  const inner = size - 3; // 1.5px gradient border dono side

  return (
    <View style={styles.row}>
      <LinearGradient
        colors={gold}
        style={{
          width: size,
          height: size,
          borderRadius: size * 0.34,
          padding: 1.5,
          overflow: "hidden", // image bahar nikle to bhi clip ho jaye
          flexShrink: 0,
        }}
      >
        <Image
          source={require("../../../assets/cm circular.png")}
          resizeMode="cover"
          style={{ width: inner, height: inner, borderRadius: size * 0.3 }}
        />
      </LinearGradient>
      {withText && (
        <Text style={styles.text} numberOfLines={1}>
          CatchMusic
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 12, flexShrink: 1 },
  text: { color: colors.pri, fontSize: 24, fontWeight: "800", letterSpacing: -0.5 },
});