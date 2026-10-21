import { useEffect, useRef, useState , type ElementRef } from "react";
import {
  Animated, Easing, Image, Modal, PanResponder, Pressable, ScrollView, StyleSheet, Text, View,
  useWindowDimensions, type StyleProp, type TextStyle,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, gold } from "../../constants/theme";
import { usePlayer } from "../../providers/PlayerProvider";
import { formatTime, getArtistName, getSongImage, getSongTitle } from "../../lib/songHelpers";
import { Cover } from "../ui/Cover";
import { Slider } from "../ui/Slider";
import { volumeIcon } from "./MiniPlayer";

const POPUP_W = 52;

/* ---------- Marquee: chhota text normal, bada text loop me scroll ---------- */
function MarqueeText({ text, style }: { text: string; style: StyleProp<TextStyle> }) {
  const [cw, setCw] = useState(0); // container width
  const [tw, setTw] = useState(0); // text natural width
  const x = useRef(new Animated.Value(0)).current;
  const GAP = 48;
  const overflow = cw > 0 && tw > cw;

  useEffect(() => {
    x.setValue(0);
    if (!overflow) return;
    const dist = tw + GAP;
    const anim = Animated.loop(
      Animated.sequence([
        Animated.delay(1500),
        Animated.timing(x, {
          toValue: -dist,
          duration: dist * 28,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [overflow, tw, cw, text, x]);

  return (
    <View style={{ overflow: "hidden" }} onLayout={(e) => setCw(e.nativeEvent.layout.width)}>
      {/* hidden: text ki asli width naapne ke liye */}
      <View pointerEvents="none" style={styles.measure}>
        <Text
          style={[style, { alignSelf: "flex-start" }]}
          onLayout={(e) => setTw(Math.ceil(e.nativeEvent.layout.width))}
        >
          {text}
        </Text>
      </View>

      {overflow ? (
        <Animated.View
          style={{
            flexDirection: "row",
            alignSelf: "flex-start",
            transform: [{ translateX: x }],
          }}
        >
          <Text style={[style, { width: tw + 2, marginRight: GAP }]} numberOfLines={1}>{text}</Text>
          <Text style={[style, { width: tw + 2, marginRight: GAP }]} numberOfLines={1}>{text}</Text>
        </Animated.View>
      ) : (
        <Text style={style} numberOfLines={1}>{text}</Text>
      )}
    </View>
  );
}

function VerticalSlider({
  value,
  onChange,
  height = 120,
}: {
  value: number;
  onChange: (v: number) => void;
  height?: number;
}) {
  const start = useRef(0);
  const clamp = (n: number) => Math.max(0, Math.min(1, n));

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (e) => {
        const v = clamp(1 - e.nativeEvent.locationY / height);
        start.current = v;
        onChange(v);
      },
      onPanResponderMove: (_, g) => onChange(clamp(start.current - g.dy / height)),
    })
  ).current;

  return (
    <View {...pan.panHandlers} style={{ width: 36, height, alignItems: "center" }}>
      <View pointerEvents="none" style={[styles.vTrack, { height }]}>
        <View style={[styles.vFill, { height: `${value * 100}%` }]} />
      </View>
      <View pointerEvents="none" style={[styles.vThumb, { bottom: value * (height - 14) }]} />
    </View>
  );
}

/* ---------- Full player ---------- */
export function FullPlayer() {
  const p = usePlayer();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [scrub, setScrub] = useState<number | null>(null);
  const [volPos, setVolPos] = useState<{ bottom: number; left: number } | null>(null);
  const volBtnRef = useRef<ElementRef<typeof View>>(null);

  const song = p.currentSong;
  const visible = p.fullOpen && !!song;
  const art = Math.min(width - 56, height * 0.36, 380);
  const progress = p.duration > 0 ? Math.min(1, p.currentTime / p.duration) : 0;
  const shownTime = scrub !== null ? scrub * p.duration : p.currentTime;
  const image = getSongImage(song);
  const vol = p.isMuted ? 0 : p.volume;

  const queue: any[] = (p as any).queue ?? [];
  const idx: number = (p as any).currentIndex ?? -1;
  const nextUp = idx >= 0 && queue.length ? queue[(idx + 1) % queue.length] : null;

  const toggleVolume = () => {
    if (volPos) {
      setVolPos(null);
      return;
    }
    volBtnRef.current?.measureInWindow((x, y, w) => {
  const left = Math.min(Math.max(8, x + w / 2 - POPUP_W / 2), width - POPUP_W - 8);
  const bottom = height - y + 6; // button ke theek upar, 6px gap
  setVolPos({ bottom, left });
});
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={p.closeFull}
      statusBarTranslucent
    >
      <View style={styles.root}>
        {!!image && (
          <Image source={{ uri: image }} blurRadius={50} style={[StyleSheet.absoluteFill, { opacity: 0.55 }]} />
        )}
        <LinearGradient
          colors={["rgba(3,3,3,0.35)", "rgba(3,3,3,0.8)", colors.bg]}
          style={StyleSheet.absoluteFill}
        />

        <ScrollView
          showsVerticalScrollIndicator={false}
          scrollEnabled={scrub === null && !volPos}
          contentContainerStyle={{
            flexGrow: 1,
            paddingTop: insets.top + 10,
            paddingBottom: insets.bottom + 24,
            paddingHorizontal: 28,
          }}
        >
          {/* top bar */}
          <View style={styles.top}>
            <Pressable onPress={p.closeFull} hitSlop={12} style={styles.topBtn}>
              <Ionicons name="chevron-down" size={22} color={colors.pri} />
            </Pressable>
            <Text style={styles.now}>NOW PLAYING</Text>
            <Pressable onPress={p.closePlayer} hitSlop={12} style={styles.topBtn}>
              <Ionicons name="close" size={20} color={colors.pri} />
            </Pressable>
          </View>

          {/* artwork */}
          <View style={styles.artWrap}>
            <View style={[styles.artShadow, { width: art, height: art }]}>
              <Cover
                uri={image}
                iconSize={64}
                style={{
                  width: art,
                  height: art,
                  borderRadius: 28,
                  borderWidth: 1,
                  borderColor: colors.borderGlow,
                  transform: [{ scale: p.isPlaying ? 1 : 0.93 }],
                }}
              />
            </View>
          </View>

          {/* title row: left = song info (marquee), right = volume button */}
          <View style={styles.titleRow}>
            <View style={styles.titleCol}>
              <MarqueeText text={getSongTitle(song)} style={styles.title} />
              <Text style={styles.artist} numberOfLines={1}>{getArtistName(song)}</Text>
            </View>

            <View ref={volBtnRef} collapsable={false}>
              <Pressable onPress={toggleVolume} style={styles.volBtn}>
                <Ionicons name={volumeIcon(p.volume, p.isMuted)} size={24} color="#000" />
              </Pressable>
            </View>
          </View>

          {/* seek */}
          <View style={{ marginTop: 18 }}>
            <Slider
              value={progress}
              onChange={setScrub}
              onCommit={(r) => {
                p.seek(r * p.duration);
                setScrub(null);
              }}
              disabled={p.duration <= 0}
              trackHeight={5}
              thumbSize={16}
            />
            <View style={styles.times}>
              <Text style={styles.time}>{formatTime(shownTime)}</Text>
              <Text style={styles.time}>{formatTime(p.duration)}</Text>
            </View>
          </View>

          {/* transport */}
          <View style={styles.controls}>
            <Pressable onPress={p.toggleShuffle} hitSlop={10} style={styles.sideBtn}>
              <Ionicons name="shuffle" size={22} color={p.isShuffle ? colors.accent : colors.muted} />
              {p.isShuffle && <View style={styles.dot} />}
            </Pressable>

            <Pressable onPress={p.previousSong} hitSlop={10}>
              <Ionicons name="play-skip-back" size={32} color={colors.pri} />
            </Pressable>

            <Pressable onPress={p.togglePlay} style={({ pressed }) => pressed && { transform: [{ scale: 0.95 }] }}>
              <LinearGradient colors={gold} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.play}>
                <Ionicons
                  name={p.isBuffering && !p.isPlaying ? "hourglass" : p.isPlaying ? "pause" : "play"}
                  size={34}
                  color="#000"
                  style={!p.isPlaying && !p.isBuffering ? { marginLeft: 3 } : undefined}
                />
              </LinearGradient>
            </Pressable>

            <Pressable onPress={p.nextSong} hitSlop={10}>
              <Ionicons name="play-skip-forward" size={32} color={colors.pri} />
            </Pressable>

            <Pressable onPress={p.cycleRepeat} hitSlop={10} style={styles.sideBtn}>
              <Ionicons name="repeat" size={22} color={p.repeatMode === "off" ? colors.muted : colors.accent} />
              {p.repeatMode === "one" && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>1</Text>
                </View>
              )}
              {p.repeatMode === "all" && <View style={styles.dot} />}
            </Pressable>
          </View>

          {/* up next */}
          <View style={styles.upNext}>
            {nextUp ? (
              <>
                <Cover uri={getSongImage(nextUp)} iconSize={18} style={styles.upNextArt} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.upNextLabel}>Up next</Text>
                  <Text style={styles.upNextTitle} numberOfLines={1}>{getSongTitle(nextUp)}</Text>
                </View>
              </>
            ) : (
              <Text style={styles.upNextLabel}>Nothing up next</Text>
            )}
          </View>
        </ScrollView>

        {/* vertical volume popup (button ke upar anchor hota hai) */}
        {volPos && (
          <>
            <Pressable style={StyleSheet.absoluteFill} onPress={() => setVolPos(null)} />
            <View style={[styles.volPopup, { bottom: volPos.bottom, left: volPos.left }]}>
  <Text style={styles.volNum}>{Math.round(vol * 100)}</Text>
  <VerticalSlider value={vol} onChange={p.setVolume} />
  <Pressable onPress={p.toggleMute} hitSlop={10}>
    <Ionicons name={volumeIcon(p.volume, p.isMuted)} size={18} color={colors.pri} />
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
  top: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  topBtn: {
    width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center",
    backgroundColor: colors.glass, borderWidth: 1, borderColor: colors.borderLight,
  },
  now: { color: colors.sec, fontSize: 11, fontWeight: "800", letterSpacing: 2.5 },
  artWrap: { alignItems: "center", justifyContent: "center", flexGrow: 1, paddingVertical: 22 },
  artShadow: {
    shadowColor: colors.primary,
    shadowOpacity: 0.35,
    shadowRadius: 40,
    shadowOffset: { width: 0, height: 18 },
    elevation: 16,
  },

  /* title row */
  titleRow: { flexDirection: "row", alignItems: "center", marginTop: 8 },
  titleCol: { flex: 1, minWidth: 0, marginRight: 14, overflow: "hidden" },
  measure: { position: "absolute", left: 0, top: 0, width: 5000, opacity: 0 },
  title: { color: colors.pri, fontSize: 26, fontWeight: "900", letterSpacing: -0.6 },
  artist: { color: colors.sec, fontSize: 16, marginTop: 4, fontWeight: "600" },
  volBtn: {
    width: 52, height: 52, borderRadius: 26, alignItems: "center", justifyContent: "center",
    backgroundColor: "#fff", // gold theme chahiye to colors.accent kar do
  },

  times: { flexDirection: "row", justifyContent: "space-between", marginTop: -2 },
  time: { color: colors.muted, fontSize: 12, fontWeight: "600" },
  controls: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 14,
  },
  sideBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  dot: { position: "absolute", bottom: 2, width: 4, height: 4, borderRadius: 2, backgroundColor: colors.accent },
  badge: {
    position: "absolute", top: 2, right: 0, width: 14, height: 14, borderRadius: 7,
    backgroundColor: colors.accent, alignItems: "center", justifyContent: "center",
  },
  badgeText: { color: "#000", fontSize: 9, fontWeight: "900" },
  play: {
    width: 78, height: 78, borderRadius: 39, alignItems: "center", justifyContent: "center",
    shadowColor: colors.primary, shadowOpacity: 0.5, shadowRadius: 22,
    shadowOffset: { width: 0, height: 10 }, elevation: 12,
  },

  /* up next */
  upNext: {
    height: 64, flexDirection: "row", alignItems: "center", gap: 12, marginTop: 22,
    paddingHorizontal: 10, borderRadius: 20, backgroundColor: colors.glass,
    borderWidth: 1, borderColor: colors.border,
  },
  upNextArt: { width: 44, height: 44, borderRadius: 12 },
  upNextLabel: { color: colors.muted, fontSize: 11, fontWeight: "700" },
  upNextTitle: { color: colors.pri, fontSize: 15, fontWeight: "800", marginTop: 2 },

volPopup: {
  position: "absolute", width: POPUP_W, paddingVertical: 10, gap: 8,
  alignItems: "center", borderRadius: 26, backgroundColor: "rgba(20,20,20,0.95)",
  borderWidth: 1, borderColor: colors.borderLight,
},
volNum: { color: colors.pri, fontSize: 12, fontWeight: "800" },
vTrack: {
  width: 5, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.18)",
  justifyContent: "flex-end", overflow: "hidden",
},
vFill: { width: "100%", backgroundColor: "#fff" },
vThumb: { position: "absolute", width: 14, height: 14, borderRadius: 7, backgroundColor: "#fff" },
});

export default FullPlayer;