import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "../../../lib/config/authOptions";
import { db, users } from "@repo/db";
import { eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.email) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
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
      .where(eq(users.email, session.user.email))
      .limit(1);

    if (existingUser.length === 0) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    const user = existingUser[0];
    if (!user) {
      return NextResponse.json(
        { success: false, error: "User Not Found" },
        { status: 501 }
      );
    }
    return NextResponse.json({
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
      .where(eq(users.email, session.user.email))
      .returning();

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
