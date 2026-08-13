export function normalizeSongName(name: string) {
  return name
    .toLowerCase()
    .replace(/&quot;/g, '"')
    .replace(/\(from\s+["']?.*?["']?\)/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}
