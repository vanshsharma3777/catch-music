import type { SimilarSong } from "./similarity";

interface RankingOptions {
    candidates: SimilarSong[];
    limit?: number;
    minSimilarity?: number;
}

export function rankCandidates({
    candidates,
    limit = 10,
    minSimilarity = 0
}: RankingOptions): SimilarSong[] {
    return candidates
        .filter(candidate => candidate.similarity >= minSimilarity)
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, limit);
}