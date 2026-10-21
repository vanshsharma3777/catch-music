import { Pressable, StyleSheet, View } from "react-native";
import { colors } from "../../constants/theme";
import { Logo } from "../ui/Logo";
import { CoverImage } from "../songs/CoverImage";

type Props = { name?: string | null; image?: string | null; onAvatarPress: () => void };

export function HomeHeader({ name, image, onAvatarPress }: Props) {
  return (
    <View style={styles.row}>
      <Logo size={40} />
      <Pressable onPress={onAvatarPress} hitSlop={8} style={styles.ring}>
        <CoverImage uri={image ?? undefined} label={name ?? "M"} radius={20} style={{ width: 38, height: 38 }} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  ring: { padding: 2, borderRadius: 24, borderWidth: 1.5, borderColor: colors.borderGlow },
});