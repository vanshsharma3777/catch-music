// Put this file at: app/lib/decodeHtml.ts
// The music API returns titles like: Tera Mera Rishta (From &quot;Awarapan 2&quot;)
// React doesn't decode entities in strings, so we do it here.

const NAMED: Record<string, string> = {
  quot: '"',
  amp: "&",
  apos: "'",
  lt: "<",
  gt: ">",
  nbsp: " ",
};

export function decodeHtml(input?: string | null): string {
  if (!input) return "";
  return input.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (match, entity: string) => {
    if (entity[0] === "#") {
      const isHex = entity[1]?.toLowerCase() === "x";
      const code = isHex ? parseInt(entity.slice(2), 16) : parseInt(entity.slice(1), 10);
      try {
        return Number.isFinite(code) ? String.fromCodePoint(code) : match;
      } catch {
        return match;
      }
    }
    return NAMED[entity.toLowerCase()] ?? match;
  });
}
