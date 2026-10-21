import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors, gold } from "../../constants/theme";

import {
  usePlayer,
  usePlayerProgress,
} from "../../providers/PlayerProvider";

import {
  getArtistName,
  getSongImage,
  getSongTitle,
} from "../../lib/songHelpers";

import { Cover } from "../ui/Cover";
import { VolumePopup } from "../ui/VolumePopup";
import { SongMenu } from "../ui/SongMenu";

export function volumeIcon(volume: number, muted: boolean) {
  if (muted || volume === 0) return "volume-mute" as const;
  if (volume < 0.4) return "volume-low" as const;
  return "volume-high" as const;
}

export function MiniPlayer() {
  const insets = useSafeAreaInsets();

  const {
    currentSong,
    isPlaying,
    isBuffering,
    volume,
    isMuted,
    toggle,
    next,
    prev,
    open,
    setVolume,
    toggleMute,
    expanded,
    hasNext,
    hasPrev,
  } = usePlayer();

  const { position, duration } = usePlayerProgress();

  if (!currentSong || expanded) return null;

  const progress =
    duration > 0
      ? Math.min(1, Math.max(0, position / duration))
      : 0;

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.outer,
        { bottom: insets.bottom + 72 },
      ]}
    >
      <LinearGradient
        colors={[
          "rgba(230,200,117,0.55)",
          "rgba(255,255,255,0.04)",
          "rgba(212,175,55,0.3)",
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.edge}
      >
        <View style={styles.card}>
          <View style={styles.row}>        
                        <Pressable
              onPress={open}
              style={styles.info}
            >
              <Cover
                uri={getSongImage(currentSong, "thumb")}
                style={styles.cover}
                iconSize={18}
              />

              <View style={styles.meta}>
                <Text
                  style={styles.title}
                  numberOfLines={1}
                >
                  {getSongTitle(currentSong)}
                </Text>

                <Text
                  style={styles.artist}
                  numberOfLines={1}
                >
                  {getArtistName(currentSong)}
                </Text>
              </View>
            </Pressable>

            <SongMenu song={currentSong} />

            {/* Previous song */}
            <Pressable
              onPress={prev}
              disabled={!hasPrev}
              hitSlop={8}
              style={[
                styles.iconBtn,
                !hasPrev && styles.disabled,
              ]}
            >
              <Ionicons
                name="play-skip-back"
                size={22}
                color={colors.pri}
              />
            </Pressable>

            <Pressable
              onPress={toggle}
              hitSlop={8}
              style={({ pressed }) =>
                pressed ? { opacity: 0.85 } : undefined
              }
            >
              <LinearGradient
                colors={gold}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.play}
              >
                {isBuffering && !isPlaying ? (
                  <ActivityIndicator
                    size="small"
                    color="#000"
                  />
                ) : (
                  <Ionicons
                    name={isPlaying ? "pause" : "play"}
                    size={20}
                    color="#000"
                    style={
                      !isPlaying
                        ? { marginLeft: 2 }
                        : undefined
                    }
                  />
                )}
              </LinearGradient>
            </Pressable>

            <Pressable
              onPress={next}
              disabled={!hasNext}
              hitSlop={8}
              style={[
                styles.iconBtn,
                !hasNext && styles.disabled,
              ]}
            >
              <Ionicons
                name="play-skip-forward"
                size={22}
                color={colors.pri}
              />
            </Pressable>

            <VolumePopup
              volume={volume}
              isMuted={isMuted}
              onChange={setVolume}
              onToggleMute={toggleMute}
            />
          </View>

          <View style={styles.progressTrack}>
            <LinearGradient
              colors={gold}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[
                styles.progressFill,
                { width: `${progress * 100}%` },
              ]}
            />
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}

export default MiniPlayer;

const styles = StyleSheet.create({
  outer: {
    position: "absolute",
    left: 12,
    right: 12,
    zIndex: 50,
  },

  edge: {
    borderRadius: 26,
    padding: 1,
    shadowColor: "#000",
    shadowOpacity: 0.7,
    shadowRadius: 22,
    shadowOffset: {
      width: 0,
      height: 10,
    },
    elevation: 14,
  },

  card: {
    borderRadius: 25,
    backgroundColor: "#0C0C0C",
    overflow: "hidden",
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    padding: 8,
    paddingRight: 6,
  },

  info: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginRight: 4,
  },

  cover: {
    width: 44,
    height: 44,
    borderRadius: 12,
  },

  meta: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },

  title: {
    color: colors.pri,
    fontSize: 14,
    fontWeight: "800",
  },

  artist: {
    color: colors.sec,
    fontSize: 12,
  },

  iconBtn: {
    width: 32,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },

  disabled: {
    opacity: 0.35,
  },

  play: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 2,
  },

  progressTrack: {
    height: 2.5,
    backgroundColor: "rgba(255,255,255,0.06)",
    overflow: "hidden",
  },

  progressFill: {
    height: "100%",
  },
});