import { useRef, useState } from "react";
import { ActivityIndicator, Modal, PanResponder, Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, gold } from "../../constants/theme";
import { usePlayer, usePlayerProgress } from "../../providers/PlayerProvider";
import { getArtist, getImage, getTitle } from "../../types/songMeta";
import { AmbientBackground } from "../ui/AmbientBackground";
import { Cover } from "../search/Cover";
import { SeekBar } from "./SeekBar";

const POPUP_W = 56;

function volumeIcon(volume: number, muted: boolean) {
  if (muted || volume === 0) return "volume-mute" as const;
  if (volume < 0.4) return "volume-low" as const;
  return "volume-high" as const;
}

function VerticalSlider({ value, onChange, height = 120 }: { value: number; onChange: (v: number) => void; height?: number }) {
  const start = useRef(0);
  const clamp = (n: number) => Math.max(0, Math.min(1, n));
  const pan = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderTerminationRequest: () => false,
    onPanResponderGrant: (e) => {
      const v = clamp(1 - e.nativeEvent.locationY / height);
      start.current = v;
      onChange(v);
    },
    onPanResponderMove: (_, g) => onChange(clamp(start.current - g.dy / height)),
  })).current;

  return (
    <View {...pan.panHandlers} style={{ width: 36, height, alignItems: "center" }}>
      <View pointerEvents="none" style={[styles.vTrack, { height }]}>
        <View style={[styles.vFill, { height: `${value * 100}%` }]} />
      </View>
      <View pointerEvents="none" style={[styles.vThumb, { bottom: value * (height - 14) }]} />
    </View>
  );
}

export function FullPlayer() {
  const p = usePlayer();
  const { position, duration } = usePlayerProgress();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [volPos, setVolPos] = useState<{ bottom: number; left: number } | null>(null);
  const volBtnRef = useRef<any>(null);
  const song = p.currentSong;

  if (!song) return null;

  const art = Math.min(width - 64, 340);
  const progress = duration > 0 ? Math.min(1, Math.max(0, position / duration)) : 0;
  const volume = p.isMuted ? 0 : p.volume;

  const toggleVolumePopup = () => {
    if (volPos) {
      setVolPos(null);
      return;
    }
    volBtnRef.current?.measureInWindow((x:any, y:any, w :any) => {
      const left = Math.min(Math.max(8, x + w / 2 - POPUP_W / 2), width - POPUP_W - 8);
      setVolPos({ bottom: Math.max(8, height - y + 6), left });
    });
  };

  return (
    <Modal visible={p.expanded} animationType="slide" onRequestClose={p.close} statusBarTranslucent>
      <View style={styles.root}>
        <AmbientBackground />
        <View style={[styles.body, { paddingTop: insets.top + 10, paddingBottom: insets.bottom + 22 }]}>
         <View style={styles.header}>
  <Pressable onPress={() => { setVolPos(null); p.close(); }} hitSlop={12} style={styles.roundBtn}>
    <Feather name="chevron-down" size={22} color={colors.pri} />
  </Pressable>

  <Text style={styles.now}>NOW PLAYING</Text>

  <Pressable onPress={() => { setVolPos(null); p.close(); }} hitSlop={12} style={styles.roundBtn}>
    <Feather name="x" size={20} color={colors.pri} />
  </Pressable>
</View>

          <View style={styles.artWrap}>
            <View style={[styles.glow, { width: art, height: art, borderRadius: 36 }]} />
            <Cover uri={getImage(song)} size={art} radius={34} style={styles.art} />
          </View>

          <View style={styles.titleRow}>
            <View style={styles.titleCol}>
              <Text style={styles.title} numberOfLines={2}>{getTitle(song)}</Text>
              <Text style={styles.artist} numberOfLines={1}>{getArtist(song)}</Text>
            </View>
            <View ref={volBtnRef} collapsable={false}>
              <Pressable onPress={toggleVolumePopup} hitSlop={8} style={styles.volBtn}>
                <Ionicons name={volumeIcon(p.volume, p.isMuted)} size={24} color="#000" />
              </Pressable>
            </View>
          </View>

          <View style={styles.seekContainer}>
            <SeekBar position={position} duration={duration} onSeek={p.seek} />
          </View>

          <View style={styles.controls}>
            <Pressable onPress={p.toggleShuffle} hitSlop={10} style={styles.side}>
              <Ionicons name="shuffle" size={22} color={p.isShuffle ? colors.accent : colors.muted} />
              {p.isShuffle && <View style={styles.dot} />}
            </Pressable>
            <Pressable onPress={p.prev} disabled={!p.hasPrev} hitSlop={10} style={!p.hasPrev && styles.disabled}>
              <Ionicons name="play-skip-back" size={30} color={colors.pri} />
            </Pressable>
            <Pressable onPress={p.toggle}>
              <LinearGradient colors={gold} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.play}>
                {p.isBuffering && !p.isPlaying
                  ? <ActivityIndicator color="#000" />
                  : <Ionicons name={p.isPlaying ? "pause" : "play"} size={34} color="#000" style={!p.isPlaying ? { marginLeft: 4 } : undefined} />}
              </LinearGradient>
            </Pressable>
            <Pressable onPress={p.next} disabled={!p.hasNext} hitSlop={10} style={!p.hasNext && styles.disabled}>
              <Ionicons name="play-skip-forward" size={30} color={colors.pri} />
            </Pressable>
            <Pressable onPress={p.cycleRepeat} hitSlop={10} style={styles.side}>
              <Ionicons name="repeat" size={22} color={p.repeat === "off" ? colors.muted : colors.accent} />
              {p.repeat === "one" && <Text style={styles.one}>1</Text>}
              {p.repeat !== "off" && <View style={styles.dot} />}
            </Pressable>
          </View>

          {p.upNext.length > 0 && (
            <View style={styles.upNext}>
              <Text style={styles.upLabel}>UP NEXT</Text>
              <Text style={styles.upSong} numberOfLines={1}>
                {getTitle(p.upNext[0])}
                <Text style={styles.upArtist}> · {getArtist(p.upNext[0])}</Text>
              </Text>
            </View>
          )}
        </View>

        {volPos && (
          <>
            <Pressable style={StyleSheet.absoluteFill} onPress={() => setVolPos(null)} />
            <View style={[styles.volPopup, { bottom: volPos.bottom, left: volPos.left }]}>
              <Text style={styles.volNum}>{Math.round(volume * 100)}%</Text>
              <VerticalSlider value={volume} onChange={p.setVolume} />
              <Pressable onPress={p.toggleMute} hitSlop={10} style={styles.muteBtn}>
                <Ionicons name={volumeIcon(p.volume, p.isMuted)} size={20} color={colors.pri} />
              </Pressable>
            </View>
          </>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  body: { flex: 1, paddingHorizontal: 28, justifyContent: "space-between" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  roundBtn: {
  width: 42,
  height: 42,
  borderRadius: 21,
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: colors.glass,
  borderWidth: 1,
  borderColor: colors.borderLight,
},
  now: { color: colors.muted, fontSize: 11, fontWeight: "800", letterSpacing: 3 },
  artWrap: { alignItems: "center", justifyContent: "center" },
  glow: { position: "absolute", backgroundColor: colors.primary, opacity: 0.22, shadowColor: colors.primary, shadowOpacity: 1, shadowRadius: 50, shadowOffset: { width: 0, height: 20 }, elevation: 24 },
  art: { borderColor: "rgba(230,200,117,0.45)", borderWidth: 1.5, shadowColor: "#000", shadowOpacity: 0.8, shadowRadius: 30, shadowOffset: { width: 0, height: 20 }, elevation: 16 },
  titleRow: { flexDirection: "row", alignItems: "center", marginTop: 8, gap: 12 },
  titleCol: { flex: 1, minWidth: 0 },
  title: { color: colors.pri, fontSize: 26, fontWeight: "900", letterSpacing: -0.7 },
  artist: { color: colors.accent, fontSize: 15, fontWeight: "600", marginTop: 4 },
  volBtn: { width: 52, height: 52, borderRadius: 26, alignItems: "center", justifyContent: "center", backgroundColor: colors.accent },
  seekContainer: { marginTop: 12 },
  controls: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  side: { width: 32, alignItems: "center", justifyContent: "center", gap: 4 },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.accent },
  one: { position: "absolute", top: 5, fontSize: 8, fontWeight: "900", color: colors.accent },
  disabled: { opacity: 0.35 },
  play: { width: 76, height: 76, borderRadius: 38, alignItems: "center", justifyContent: "center", shadowColor: colors.primary, shadowOpacity: 0.55, shadowRadius: 24, shadowOffset: { width: 0, height: 10 }, elevation: 12 },
  upNext: { padding: 14, borderRadius: 18, backgroundColor: colors.glass, borderWidth: 1, borderColor: colors.borderLight, gap: 4 },
  upLabel: { color: colors.primary, fontSize: 10, fontWeight: "800", letterSpacing: 2 },
  upSong: { color: colors.pri, fontSize: 14, fontWeight: "700" },
  upArtist: { color: colors.muted, fontWeight: "500" },
  volPopup: { position: "absolute", width: POPUP_W, paddingVertical: 12, gap: 10, alignItems: "center", borderRadius: 26, backgroundColor: "rgba(20,20,20,0.96)", borderWidth: 1, borderColor: colors.borderLight, zIndex: 20, elevation: 20 },
  volNum: { color: colors.pri, fontSize: 12, fontWeight: "800" },
  vTrack: { width: 5, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.18)", justifyContent: "flex-end", overflow: "hidden" },
  vFill: { width: "100%", backgroundColor: colors.accent },
  vThumb: { position: "absolute", width: 14, height: 14, borderRadius: 7, backgroundColor: colors.accent },
  muteBtn: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  
});

export default FullPlayer;

