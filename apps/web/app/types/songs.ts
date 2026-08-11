export interface Song {
  id: string;
  name: string;
  title?: string;
  singerId: string;
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
