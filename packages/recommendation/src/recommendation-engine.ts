import { generateCandidates } from "./candidate-generator";
import { rankCandidates } from "./ranking";

interface RecommendationOptions {
    songId: string;
    limit?: number;
    excludeIds?: string[];
}

export async function getRecommendations({
    songId,
    limit = 10,
    excludeIds = []
}: RecommendationOptions) {
    const candidates = await generateCandidates({
        songId,
        limit: Math.max(limit * 3, 30),
        excludeIds
    });

    return rankCandidates({
        candidates,
        limit,
        minSimilarity: 0
    });
}