import { useRef, useState, type ElementRef } from "react";
import {
  Modal, PanResponder, Pressable, StyleSheet, Text, View, useWindowDimensions,
  type StyleProp, type ViewStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../constants/theme";

const POPUP_W = 52;
const SLIDER_H = 120;

function iconFor(volume: number, muted: boolean) {
  if (muted || volume === 0) return "volume-mute" as const;
  if (volume < 0.4) return "volume-low" as const;
  return "volume-high" as const;
}

/* ---------- Vertical slider ---------- */
export function VerticalSlider({
  value,
  onChange,
  height = SLIDER_H,
}: {
  value: number;
  onChange: (v: number) => void;
  height?: number;
}) {
  const start = useRef(0);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const clamp = (n: number) => Math.max(0, Math.min(1, n));

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (e) => {
        const v = clamp(1 - e.nativeEvent.locationY / height);
        start.current = v;
        onChangeRef.current(v);
      },
      onPanResponderMove: (_, g) => onChangeRef.current(clamp(start.current - g.dy / height)),
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

/* ---------- Button + popup ---------- */
export function VolumePopup({
  volume,
  isMuted,
  onChange,
  onToggleMute,
  iconSize = 20,
  style,
}: {
  volume: number;
  isMuted: boolean;
  onChange: (v: number) => void;
  onToggleMute: () => void;
  iconSize?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const { width, height } = useWindowDimensions();
  const btnRef = useRef<ElementRef<typeof View>>(null);
  const [anchor, setAnchor] = useState<{ x: number; y: number; w: number; h: number } | null>(null);

  const vol = isMuted ? 0 : volume;
  const close = () => setAnchor(null);

  const open = () => {
    btnRef.current?.measureInWindow((x, y, w, h) => setAnchor({ x, y, w, h }));
  };

  let pos: ViewStyle = {};
  if (anchor) {
    const left = Math.min(Math.max(8, anchor.x + anchor.w / 2 - POPUP_W / 2), width - POPUP_W - 8);
    pos =
      anchor.y > height / 2
        ? { left, bottom: height - anchor.y + 6 } // button neeche => upar khulega
        : { left, top: anchor.y + anchor.h + 6 };
  }

  return (
    <>
      <View ref={btnRef} collapsable={false} style={style}>
        <Pressable onPress={anchor ? close : open} hitSlop={8} style={styles.btn}>
          <Ionicons name={iconFor(volume, isMuted)} size={iconSize} color={anchor ? colors.accent : colors.sec} />
        </Pressable>
      </View>

      <Modal visible={!!anchor} transparent animationType="fade" statusBarTranslucent onRequestClose={close}>
        {/* kahin bhi bahar touch karo => band */}
        <Pressable style={StyleSheet.absoluteFill} onPress={close} />
        {anchor && (
          <View style={[styles.popup, pos]}>
            <Text style={styles.num}>{Math.round(vol * 100)}</Text>
            <VerticalSlider value={vol} onChange={onChange} />
            <Pressable onPress={onToggleMute} hitSlop={10}>
              <Ionicons name={iconFor(volume, isMuted)} size={18} color={colors.pri} />
            </Pressable>
          </View>
        )}
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  btn: { width: 32, height: 34, alignItems: "center", justifyContent: "center" },
  popup: {
    position: "absolute", width: POPUP_W, paddingVertical: 10, gap: 8,
    alignItems: "center", borderRadius: 26, backgroundColor: "rgba(20,20,20,0.97)",
    borderWidth: 1, borderColor: colors.borderLight,
    shadowColor: "#000", shadowOpacity: 0.4, shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 }, elevation: 20,
  },
  num: { color: colors.pri, fontSize: 12, fontWeight: "800" },
  vTrack: {
    width: 5, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.18)",
    justifyContent: "flex-end", overflow: "hidden",
  },
  vFill: { width: "100%", backgroundColor: "#fff" },
  vThumb: { position: "absolute", width: 14, height: 14, borderRadius: 7, backgroundColor: "#fff" },
});

export default VolumePopup;