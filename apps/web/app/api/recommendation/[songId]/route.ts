import { NextRequest, NextResponse } from "next/server";
import { getRecommendations } from "@repo/recommendation";
import { db, song } from "@repo/db";
import { inArray } from "drizzle-orm";
import { getUser } from "../../../lib/getUser";

export async function POST(req: NextRequest ,{ params }: { params: Promise<{ songId: string }> }) {
    try {
        const user = await getUser();

        if (!user) {
            return NextResponse.json(
                { success: false, message: "Unauthorized" },
                { status: 401 }
            );
        }

    const { songId } = await params;
    const { excludeIds = [], limit = 10 } = await req.json();
        if (!songId || typeof songId !== "string") {
            return NextResponse.json(
                { success: false, message: "Invalid song ID" },
                { status: 400 }
            );
        }

        const safeLimit = Math.min(Math.max(Number(limit) || 10, 1), 30);

        const recommendations = await getRecommendations({
            songId,
            limit: safeLimit,
            excludeIds
        });

        if (!recommendations.length) {
            return NextResponse.json({
                success: true,
                data: []
            });
        }

        const recommendedIds = recommendations.map(item => item.songId);

        const songs = await db
            .select()
            .from(song)
            .where(inArray(song.songId, recommendedIds));

        const songMap = new Map(
            songs.map(item => [item.songId, item])
        );

        const orderedSongs = recommendedIds
    .map(id => songMap.get(id))
    .filter(Boolean)
    .map(item => ({
        ...item!,
        id: item!.songId
    }));

        return NextResponse.json({
            success: true,
            data: orderedSongs
        });
    } catch (error) {
        console.error("Recommendation API error:", error);

        return NextResponse.json(
            {
                success: false,
                message: "Failed to fetch recommendations"
            },
            { status: 500 }
        );
    }
}