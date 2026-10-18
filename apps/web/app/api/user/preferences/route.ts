import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "../../../lib/config/authOptions";
import { redis } from "../../../lib/config/redis";
import { db, users } from "@repo/db";
import { eq } from "drizzle-orm";

const USER_PREFS_TTL_SECONDS = 60 * 5;
const userPrefsKey = (email: string) => `user:prefs:${email.toLowerCase()}`;

type FavoriteSingers = NonNullable<typeof users.$inferSelect["favoriteSingers"]>;

type PrefsPayload = {
  success: true;
  hasCompletedOnboarding: boolean;
  favoriteSingers: FavoriteSingers;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
};

async function readCache(key: string): Promise<PrefsPayload | null> {
  try {
    return await redis.get<PrefsPayload>(key);
  } catch (err) {
    console.error("Redis read failed:", err);
    return null;
  }
}

async function writeCache(key: string, payload: PrefsPayload) {
  try {
    await redis.set(key, payload, { ex: USER_PREFS_TTL_SECONDS });
    console.log("Written on redis (preferences)")
  } catch (err) {
    console.error("Redis write failed:", err);
  }
}

async function invalidateCache(key: string) {
  try {
    await redis.del(key);
  } catch (err) {
    console.error("Redis delete failed:", err);
  }
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.email) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const email = session.user.email;
  const cacheKey = userPrefsKey(email);

  try {
    const cached = await readCache(cacheKey);
    if (cached) {
      return NextResponse.json(cached, {
        headers: { "X-Cache": "HIT" },
      });
    }

    const existingUser = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        image: users.image,
        favoriteSingers: users.favoriteSingers,
        hasCompletedOnboarding: users.hasCompletedOnboarding,
      })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    const user = existingUser[0];
    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    const payload: PrefsPayload = {
      success: true,
      hasCompletedOnboarding: Boolean(
        user.hasCompletedOnboarding ||
          (user.favoriteSingers && user.favoriteSingers.length > 0)
      ),
      favoriteSingers: user.favoriteSingers || [],
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
      },
    };

    await writeCache(cacheKey, payload);

    return NextResponse.json(payload, {
      headers: { "X-Cache": "MISS" },
    });
  } catch (error: any) {
    console.error("Error fetching user preferences:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.email) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const email = session.user.email;
  const cacheKey = userPrefsKey(email);

  try {
    const body = await request.json();
    const { favoriteSingers } = body;

    if (!Array.isArray(favoriteSingers)) {
      return NextResponse.json(
        { success: false, error: "favoriteSingers must be an array" },
        { status: 400 }
      );
    }

    const updatedUsers = await db
      .update(users)
      .set({
        favoriteSingers,
        hasCompletedOnboarding: true,
        updatedAt: new Date(),
      })
      .where(eq(users.email, email))
      .returning();
    await invalidateCache(cacheKey);

    return NextResponse.json({
      success: true,
      hasCompletedOnboarding: true,
      favoriteSingers,
      user: updatedUsers[0],
    });
  } catch (error: any) {
    console.error("Error updating user preferences:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
