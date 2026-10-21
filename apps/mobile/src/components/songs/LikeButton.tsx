import { Pressable, StyleProp, ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../constants/theme";
import { toggleLike, useIsLiked } from "../../lib/likedStore";
import type { Song } from "../../types/song";

type Props = { song: Song; size?: number; style?: StyleProp<ViewStyle> };

export function LikeButton({ song, size = 18, style }: Props) {
  const liked = useIsLiked(song.id);
  return (
    <Pressable
      hitSlop={10}
      onPress={() => {
        toggleLike(song).catch(() => {});
      }}
      style={({ pressed }) => [{ alignItems: "center", justifyContent: "center" }, pressed && { transform: [{ scale: 0.88 }] }, style]}
    >
      <Ionicons name={liked ? "heart" : "heart-outline"} size={size} color={liked ? colors.accent : colors.pri} />
    </Pressable>
  );
}