export interface Song {
  id: string;
  name: string;
  title?: string;
  type?: string;
  year?: string;
  duration?: number | string;
  label?: string;
  language?: string;
  url?: string;
  image?: { quality: string; url: string }[] | string;
  downloadUrl?: { quality: string; url: string }[] | string;
  primaryArtists?: string;
  artists?: { primary?: { name: string }[] };
  artistName?: string;
  album?: string | { name?: string };
}


export interface HomeUser {
  id?: string;
  name: string | null;
  image: string | null;
}

export type EntityType = "album" | "artist" | "playlist";
export type MiniType = "song" | EntityType;

/** Light card model used by every search row / tile. */
export interface Mini {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  type: MiniType;
  duration?: number;
}

export interface SuggestResult {
  songs: Mini[];
  albums: Mini[];
  artists: Mini[];
  playlists: Mini[];
}

export type SearchTab = "all" | "songs" | "artists" | "albums" | "playlists";