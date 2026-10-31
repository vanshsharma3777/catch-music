import axios from "axios";
import { Song } from "../types/songs";

export async function fetchRecommendations(
    songId: string,
    excludeIds: string[] = [],
    limit = 10
): Promise<Song[]> {
    try {
        console.log("Calling recommendation API:", songId);

        const res = await axios.post(
            `/api/recommendation/${encodeURIComponent(songId)}`,
            {
                excludeIds,
                limit
            }
        );

        if (!res.data?.success || !Array.isArray(res.data.data)) {
            return [];
        }

        return res.data.data as Song[];
    } catch (error) {
        console.error("Recommendation request failed:", error);
        return [];
    }
}