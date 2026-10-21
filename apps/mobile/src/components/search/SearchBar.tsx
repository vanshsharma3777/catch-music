import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { colors, radius } from "../../constants/theme";

type Props = {
  value: string;
  onChangeText: (t: string) => void;
  onSubmit: () => void;
  busy?: boolean;
  autoFocus?: boolean;
};

export function SearchBar({ value, onChangeText, onSubmit, busy, autoFocus }: Props) {
  const [focused, setFocused] = useState(false);

  const edge = focused
    ? (["rgba(230,200,117,0.85)", "rgba(212,175,55,0.25)", "rgba(230,200,117,0.55)"] as const)
    : (["rgba(230,200,117,0.28)", "rgba(255,255,255,0.04)", "rgba(212,175,55,0.14)"] as const);

  return (
    <LinearGradient
      colors={edge}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.edge, focused && styles.glow]}
    >
      <View style={styles.inner}>
        <Feather name="search" size={19} color={focused ? colors.accent : colors.muted} />
       <TextInput
value={value}
onChangeText={onChangeText}
onSubmitEditing={onSubmit}
onFocus={() => {
  console.log("INPUT FOCUSED");
  setFocused(true);
}}
onBlur={() => {
  console.log("INPUT BLURRED");
  setFocused(false);
}}
placeholder="Songs, artists, albums..."
placeholderTextColor={colors.muted}
selectionColor={colors.primary}
returnKeyType="search"
autoCorrect={false}
autoCapitalize="none"
underlineColorAndroid="transparent"
blurOnSubmit={false}
showSoftInputOnFocus={true}
style={styles.input}
/>

        {busy ? (
          <ActivityIndicator size="small" color={colors.accent} />
        ) : value.length > 0 ? (
          <Pressable onPress={() => onChangeText("")} hitSlop={12} style={styles.clear}>
            <Feather name="x" size={14} color={colors.pri} />
          </Pressable>
        ) : null}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  edge: { borderRadius: radius.pill, padding: 1.2 },
  glow: {
    shadowColor: colors.primary,
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  inner: {
    height: 54,
    borderRadius: radius.pill,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.surface,
  },
  input: {
  flex: 1,
  color: colors.pri,
  fontSize: 15,
  borderWidth: 0,
  outlineWidth: 0,
  backgroundColor: "transparent",
},
  clear: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.12)",
  },
});