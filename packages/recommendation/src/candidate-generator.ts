import { getSimilarSongs } from "./similarity";

interface CandidateOptions {
    songId: string;
    limit?: number;
    excludeIds?: string[];
}

export async function generateCandidates({
    songId,
    limit = 30,
    excludeIds = []
}: CandidateOptions) {
    const candidates = await getSimilarSongs(songId, limit);

    const excluded = new Set([songId, ...excludeIds]);

    return candidates.filter(
        candidate => !excluded.has(candidate.songId)
    );
}