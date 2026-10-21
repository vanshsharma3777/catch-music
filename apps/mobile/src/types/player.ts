export type RepeatMode = "off" | "all" | "one";

export type EngineStatus = {
  position: number; // seconds
  duration: number; // seconds
  playing: boolean;
  buffering: boolean;
  ended: boolean;
};