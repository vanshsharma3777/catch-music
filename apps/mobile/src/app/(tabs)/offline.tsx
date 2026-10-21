import { StyleSheet, Text, View } from "react-native";
import { colors } from "../../constants/theme";

export default function OfflineTab() {
  return (
    <View style={styles.root}>
      <Text style={styles.t}>Offline</Text>
      <Text style={styles.s}>Coming in Step 6</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center", gap: 6 },
  t: { color: colors.pri, fontSize: 22, fontWeight: "800" },
  s: { color: colors.muted, fontSize: 13 },
});