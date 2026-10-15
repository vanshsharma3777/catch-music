"use client";

import React from "react";
import { usePlayer } from "./PlayerContext";
import { FullScreenPlayer } from "./FullScreenPlayer";
import { MiniPlayer } from "./MiniPlayer";

export function GlobalPlayer() {
  const { currentSong, screenMode } = usePlayer();

  if (!currentSong || screenMode === "closed") {
    return null;
  }

  if (screenMode === "full") {
    return <FullScreenPlayer />;
  }

  if (screenMode === "mini") {
    return <MiniPlayer />;
  }

  return null;
}

export default GlobalPlayer;
