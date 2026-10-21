import { useRef, useState } from "react";
import { LayoutChangeEvent, PanResponder, StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors, gold } from "../../constants/theme";

type Props = {
  /** 0..1 */
  value: number;
  /** Live updates while the finger is down. */
  onChange?: (v: number) => void;
  /** Fired once when the finger lifts. */
  onCommit?: (v: number) => void;
  trackHeight?: number;
  thumbSize?: number;
  hitHeight?: number;
  disabled?: boolean;
};

export function Slider({
  value,
  onChange,
  onCommit,
  trackHeight = 4,
  thumbSize = 14,
  hitHeight = 32,
  disabled,
}: Props) {
  const [width, setWidth] = useState(0);
  const [drag, setDrag] = useState<number | null>(null);

  const widthRef = useRef(0);
  const startX = useRef(0);
  const cb = useRef({ onChange, onCommit, disabled });
  cb.current = { onChange, onCommit, disabled };

  const toRatio = (x: number) =>
    widthRef.current > 0 ? Math.min(1, Math.max(0, x / widthRef.current)) : 0;

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !cb.current.disabled,
      onMoveShouldSetPanResponder: () => !cb.current.disabled,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (e) => {
        startX.current = e.nativeEvent.locationX;
        const r = toRatio(startX.current);
        setDrag(r);
        cb.current.onChange?.(r);
      },
      onPanResponderMove: (_, g) => {
        const r = toRatio(startX.current + g.dx);
        setDrag(r);
        cb.current.onChange?.(r);
      },
      onPanResponderRelease: (_, g) => {
        const r = toRatio(startX.current + g.dx);
        setDrag(null);
        cb.current.onCommit?.(r);
      },
      onPanResponderTerminate: () => setDrag(null),
    })
  ).current;

  const onLayout = (e: LayoutChangeEvent) => {
    widthRef.current = e.nativeEvent.layout.width;
    setWidth(e.nativeEvent.layout.width);
  };

  const shown = Math.min(1, Math.max(0, drag ?? value));
  const fillW = width * shown;
  const thumbLeft = Math.max(0, Math.min(width - thumbSize, fillW - thumbSize / 2));

  return (
    <View
      onLayout={onLayout}
      style={{ height: hitHeight, justifyContent: "center", opacity: disabled ? 0.4 : 1 }}
      {...pan.panHandlers}
    >
      {/* children ignore touches so locationX stays relative to this view */}
      <View
        pointerEvents="none"
        style={[
          styles.track,
          { height: trackHeight, borderRadius: trackHeight / 2 },
        ]}
      >
        <LinearGradient
          colors={gold}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ width: fillW, height: "100%" }}
        />
      </View>
      <View
        pointerEvents="none"
        style={[
          styles.thumb,
          {
            width: thumbSize,
            height: thumbSize,
            borderRadius: thumbSize / 2,
            left: thumbLeft,
            transform: [{ scale: drag !== null ? 1.35 : 1 }],
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { width: "100%", backgroundColor: "rgba(255,255,255,0.14)", overflow: "hidden" },
  thumb: {
    position: "absolute",
    backgroundColor: "#fff",
    shadowColor: colors.primary,
    shadowOpacity: 0.6,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
    elevation: 3,
  },
});

export default Slider;