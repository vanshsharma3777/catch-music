import { useRef, useState, type ElementRef } from "react";
import {
  ActivityIndicator, Keyboard, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View,
  useWindowDimensions, type StyleProp, type ViewStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { colors } from "../../constants/theme";
import {
  addSongToPlaylist, createPlaylist, ensureLikesLoaded, fetchMyPlaylists, toggleLike, useIsLiked,
  type PlaylistLite,
} from "../../lib/libraryApi";
import { ensureOfflineLoaded, toggleOffline, useIsCached } from "../../lib/offlineStore";

const PANEL_W = 236;

type Anchor = { x: number; y: number; w: number; h: number };
type View_ = "main" | "playlists" | "create";
type Ico = React.ComponentProps<typeof Ionicons>["name"];

export type SongMenuProps = {
  song: any;
  /** Sirf playlist screen me: "Remove from this playlist" dikhane ke liye */
  onRemoveFromPlaylist?: () => Promise<void> | void;
  onLikeChange?: (liked: boolean) => void;
  iconSize?: number;
  iconColor?: string;
  style?: StyleProp<ViewStyle>;
};

function Item({
  icon, label, onPress, danger, disabled, loading, right, iconColor,
}: {
  icon: Ico;
  label: string;
  onPress: () => void;
  danger?: boolean;
  disabled?: boolean;
  loading?: boolean;
  right?: string;
  iconColor?: string;
}) {
  const tint = danger ? "#f87171" : iconColor ?? colors.accent;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.item,
        pressed && { backgroundColor: "rgba(255,255,255,0.08)" },
        (disabled || loading) && { opacity: 0.5 },
      ]}
    >
      {loading ? <ActivityIndicator size="small" color={colors.accent} /> : <Ionicons name={icon} size={18} color={tint} />}
      <Text style={[styles.itemText, danger && { color: "#f87171" }]} numberOfLines={1}>{label}</Text>
      {right !== undefined && <Text style={styles.itemRight}>{right}</Text>}
    </Pressable>
  );
}

export function SongMenu({
  song, onRemoveFromPlaylist, onLikeChange, iconSize = 20, iconColor = colors.sec, style,
}: SongMenuProps) {
  const { width, height } = useWindowDimensions();
  const btnRef = useRef<ElementRef<typeof View>>(null);

  const [anchor, setAnchor] = useState<Anchor | null>(null);
  const [view, setView] = useState<View_>("main");
  const [busy, setBusy] = useState<string | null>(null);
  const [status, setStatus] = useState<{ text: string; error?: boolean } | null>(null);
  const [playlists, setPlaylists] = useState<PlaylistLite[] | null>(null);
  const [newName, setNewName] = useState("");
  const [newPublic, setNewPublic] = useState(false);

  const liked = useIsLiked(song?.id);
  const cached = useIsCached(song?.id);

  const url: string | undefined = song?.url;
  const canLink = typeof url === "string" && /^https?:\/\//i.test(url);

  const close = () => {
    Keyboard.dismiss();
    setAnchor(null);
    setView("main");
    setStatus(null);
    setNewName("");
    setNewPublic(false);
  };

  const open = () => {
    btnRef.current?.measureInWindow((x, y, w, h) => {
      setView("main");
      setStatus(null);
      setAnchor({ x, y, w, h });
      void ensureLikesLoaded();
      void ensureOfflineLoaded();
    });
  };

  const flash = (text: string, error = false, closeAfter = false) => {
    setStatus({ text, error });
    if (closeAfter) setTimeout(close, 900);
  };
  const errMsg = (e: any, fallback: string) => (e?.message && typeof e.message === "string" ? e.message : fallback);

  /* ---------- actions ---------- */
  const handleLike = async () => {
    setBusy("like");
    try {
      const next = await toggleLike(song);
      onLikeChange?.(next);
      flash(next ? "Added to liked songs" : "Removed from liked songs", false, true);
    } catch {
      flash("Couldn't update liked songs", true);
    } finally {
      setBusy(null);
    }
  };

  const handleCache = async () => {
    setBusy("cache");
    try {
      const now = await toggleOffline(song);
      flash(now ? "Saved for offline" : "Removed from offline", false, true);
    } catch (e) {
      flash(errMsg(e, "Couldn't save offline"), true);
    } finally {
      setBusy(null);
    }
  };

  const copyLink = async () => {
    try {
      await Clipboard.setStringAsync(url!);
      flash("Link copied", false, true);
    } catch {
      flash("Couldn't copy link", true);
    }
  };

  const handleRemove = async () => {
    setBusy("remove");
    try {
      await onRemoveFromPlaylist?.();
      close();
    } catch {
      flash("Couldn't remove song", true);
    } finally {
      setBusy(null);
    }
  };

  const openPlaylists = async () => {
    setView("playlists");
    setStatus(null);
    if (playlists) return;
    try {
      setPlaylists(await fetchMyPlaylists());
    } catch (e) {
      setPlaylists([]);
      flash(errMsg(e, "Couldn't load your playlists"), true);
    }
  };

  const addToPlaylist = async (pl: { id: string; name: string }) => {
    setBusy(pl.id);
    try {
      const r = await addSongToPlaylist(pl.id, song);
      if (r === "added") {
        setPlaylists((list) =>
          list ? list.map((p) => (p.id === pl.id ? { ...p, songCount: p.songCount + 1 } : p)) : list
        );
        flash(`Added to ${pl.name}`, false, true);
      } else {
        flash(`Already in ${pl.name}`, true);
      }
    } catch (e) {
      flash(errMsg(e, "Couldn't add song"), true);
    } finally {
      setBusy(null);
    }
  };

  const handleCreate = async () => {
    const name = newName.trim();
    if (!name) return flash("Playlist ka naam likho", true);
    setBusy("create");
    try {
      const created = await createPlaylist(name, newPublic);
      setPlaylists(null); // next time dobara fetch hoga
      try {
        const r = await addSongToPlaylist(created.id, song);
        flash(r === "added" ? `Created "${created.name}" & song added` : `Created "${created.name}"`, false, true);
      } catch (e) {
        flash(`Created "${created.name}", par song add nahi hua`, true);
      }
    } catch (e) {
      flash(errMsg(e, "Couldn't create playlist"), true);
    } finally {
      setBusy(null);
    }
  };

  /* ---------- panel position ---------- */
  let panelPos: ViewStyle = {};
  if (anchor) {
    const left = Math.min(Math.max(8, anchor.x + anchor.w - PANEL_W), width - PANEL_W - 8);
    if (view === "create") {
      // keyboard ke liye upar rakho
      panelPos = { left: Math.max(8, (width - PANEL_W) / 2), top: Math.max(60, height * 0.18) };
    } else if (anchor.y > height / 2) {
      panelPos = { left, bottom: height - anchor.y + 6 }; // drop-up
    } else {
      panelPos = { left, top: anchor.y + anchor.h + 6 }; // drop-down
    }
  }

  return (
    <>
      <View ref={btnRef} collapsable={false} style={style}>
        <Pressable onPress={open} hitSlop={8} style={styles.trigger}>
          <Ionicons name="ellipsis-vertical" size={iconSize} color={anchor ? colors.accent : iconColor} />
        </Pressable>
      </View>

      <Modal visible={!!anchor} transparent animationType="fade" statusBarTranslucent onRequestClose={close}>
        <Pressable style={StyleSheet.absoluteFill} onPress={close} />
        {anchor && (
          <View style={[styles.panel, { maxHeight: Math.min(380, height * 0.65) }, panelPos]}>
            {view === "main" && (
              <>
                <Item icon="list-outline" label="Add to playlist" onPress={openPlaylists} />
                <Item
                  icon={liked ? "heart" : "heart-outline"}
                  label={liked ? "Remove from liked songs" : "Add to liked songs"}
                  onPress={handleLike}
                  loading={busy === "like"}
                />
                <Item
                  icon={cached ? "bookmark" : "bookmark-outline"}
                  label={cached ? "Remove from offline" : "Save offline"}
                  onPress={handleCache}
                  loading={busy === "cache"}
                />
                {canLink && <Item icon="link-outline" label="Copy link" onPress={copyLink} />}
                {onRemoveFromPlaylist && (
                  <Item
                    icon="trash-outline"
                    label="Remove from this playlist"
                    onPress={handleRemove}
                    loading={busy === "remove"}
                    danger
                  />
                )}
              </>
            )}

            {view === "playlists" && (
              <>
                <Item icon="arrow-back" label="Back" iconColor={colors.sec} onPress={() => { setView("main"); setStatus(null); }} />
                <Item icon="add" label="New playlist" onPress={() => { setView("create"); setStatus(null); }} />
                <View style={styles.divider} />
                {playlists === null ? (
                  <View style={styles.center}>
                    <ActivityIndicator color={colors.accent} />
                  </View>
                ) : playlists.length === 0 ? (
                  <Text style={styles.empty}>Abhi koi playlist nahi hai. "New playlist" se banao.</Text>
                ) : (
                  <ScrollView showsVerticalScrollIndicator={false}>
                    {playlists.map((pl) => (
                      <Item
                        key={pl.id}
                        icon={pl.isPublic ? "globe-outline" : "lock-closed-outline"}
                        iconColor={colors.muted}
                        label={pl.name}
                        right={String(pl.songCount)}
                        loading={busy === pl.id}
                        onPress={() => addToPlaylist(pl)}
                      />
                    ))}
                  </ScrollView>
                )}
              </>
            )}

            {view === "create" && (
              <View style={{ padding: 6 }}>
                <Text style={styles.createTitle}>New playlist</Text>
                <TextInput
                  value={newName}
                  onChangeText={setNewName}
                  placeholder="Playlist name"
                  placeholderTextColor={colors.muted}
                  autoFocus
                  maxLength={60}
                  returnKeyType="done"
                  onSubmitEditing={handleCreate}
                  style={styles.input}
                />
                <View style={styles.pills}>
                  <Pressable onPress={() => setNewPublic(false)} style={[styles.pill, !newPublic && styles.pillOn]}>
                    <Ionicons name="lock-closed-outline" size={14} color={!newPublic ? "#000" : colors.sec} />
                    <Text style={[styles.pillText, !newPublic && { color: "#000" }]}>Private</Text>
                  </Pressable>
                  <Pressable onPress={() => setNewPublic(true)} style={[styles.pill, newPublic && styles.pillOn]}>
                    <Ionicons name="globe-outline" size={14} color={newPublic ? "#000" : colors.sec} />
                    <Text style={[styles.pillText, newPublic && { color: "#000" }]}>Public</Text>
                  </Pressable>
                </View>
                <View style={styles.createRow}>
                  <Pressable onPress={() => { setView("playlists"); setStatus(null); }} style={styles.cancelBtn}>
                    <Text style={styles.cancelText}>Back</Text>
                  </Pressable>
                  <Pressable onPress={handleCreate} disabled={busy === "create"} style={styles.createBtn}>
                    {busy === "create" ? (
                      <ActivityIndicator size="small" color="#000" />
                    ) : (
                      <Text style={styles.createText}>Create & add</Text>
                    )}
                  </Pressable>
                </View>
              </View>
            )}

            {status && (
              <Text
                style={[
                  styles.status,
                  status.error
                    ? { color: "#f87171", backgroundColor: "rgba(248,113,113,0.1)" }
                    : { color: "#4ade80", backgroundColor: "rgba(74,222,128,0.1)" },
                ]}
              >
                {status.text}
              </Text>
            )}
          </View>
        )}
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: { width: 30, height: 34, alignItems: "center", justifyContent: "center" },
  panel: {
    position: "absolute", width: PANEL_W, padding: 6, borderRadius: 18,
    backgroundColor: "rgba(20,20,20,0.98)", borderWidth: 1, borderColor: colors.borderLight,
    shadowColor: "#000", shadowOpacity: 0.4, shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 }, elevation: 20,
  },
  item: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingVertical: 11, paddingHorizontal: 12, borderRadius: 12, minHeight: 42,
  },
  itemText: { color: colors.pri, fontSize: 13, fontWeight: "600", flex: 1 },
  itemRight: { color: colors.muted, fontSize: 11, fontWeight: "600" },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 4 },
  center: { paddingVertical: 16, alignItems: "center" },
  empty: { color: colors.muted, fontSize: 12, paddingHorizontal: 12, paddingVertical: 12, lineHeight: 17 },
  status: {
    fontSize: 12, fontWeight: "700", marginTop: 4, borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 8, overflow: "hidden",
  },
  createTitle: { color: colors.pri, fontSize: 15, fontWeight: "800", marginBottom: 10, marginLeft: 2 },
  input: {
    color: colors.pri, fontSize: 14, fontWeight: "600", paddingHorizontal: 12, paddingVertical: 10,
    borderRadius: 12, backgroundColor: colors.glass, borderWidth: 1, borderColor: colors.border,
  },
  pills: { flexDirection: "row", gap: 8, marginTop: 10 },
  pill: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    paddingVertical: 9, borderRadius: 12, backgroundColor: colors.glass,
    borderWidth: 1, borderColor: colors.border,
  },
  pillOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  pillText: { color: colors.sec, fontSize: 12, fontWeight: "700" },
  createRow: { flexDirection: "row", gap: 8, marginTop: 12 },
  cancelBtn: {
    flex: 1, paddingVertical: 11, borderRadius: 12, alignItems: "center",
    backgroundColor: colors.glass, borderWidth: 1, borderColor: colors.border,
  },
  cancelText: { color: colors.sec, fontSize: 13, fontWeight: "700" },
  createBtn: {
    flex: 1.5, paddingVertical: 11, borderRadius: 12, alignItems: "center", justifyContent: "center",
    backgroundColor: colors.accent,
  },
  createText: { color: "#000", fontSize: 13, fontWeight: "800" },
});

export default SongMenu;