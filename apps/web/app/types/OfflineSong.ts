
export interface OfflineSong {
  songId: string;
  id: string;

  name: string;
  artistName?: string;

  image?: string;

  duration?: number | string;
  label?: string;

  cacheKey: string;
  imageCacheKey?: string;
}
