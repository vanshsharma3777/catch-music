export type ImageSet = { quality: string; url: string }[] | string;

export interface Song {
  id: string;
  name: string;
  title?: string;
  singerId?: string;
  type?: string;
  year?: string;
  duration?: number | string;
  label?: string;
  explicitContent?: boolean;
  playCount?: number;
  language?: string;
  hasLyrics?: boolean;
  url?: string;
  image?: { quality: string; url: string }[] | string;
  downloadUrl?: { quality: string; url: string }[] | string;
  primaryArtists?: string;
  artists?: { primary?: { name: string }[] };
  artistName?: string;
}

export interface Singer {
  id: string;
  name: string;
  image?: string;
  genre?: string;
}

export interface HomeUser {
  id?: string;
  name: string | null;
  image: string | null;
}