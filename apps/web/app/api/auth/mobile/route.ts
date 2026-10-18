import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import { NextResponse } from "next/server";
import { db } from "@repo/db";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { randomUUID } from "crypto";
import { AdapterUser } from "next-auth/adapters";

const client = new OAuth2Client();
const adapter = DrizzleAdapter(db);

export async function POST(req: Request) {
  const { idToken } = await req.json();

  let payload;
  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_WEB_CLIENT_ID!,
    });
    payload = ticket.getPayload();
  } catch {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  if (!payload?.email || !payload.sub) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  let user = await adapter.getUserByAccount!({
    provider: "google",
    providerAccountId: payload.sub,
  });

  if (!user) {
    user = await adapter.getUserByEmail!(payload.email);
  }


  if (!user) {
    user = await adapter.createUser!({
      id: randomUUID(),
      email: payload.email,
      name: payload.name ?? null,
      image: payload.picture ?? null,
      emailVerified: new Date(),
    } as AdapterUser);

    await adapter.linkAccount!({
      userId: user.id,
      type: "oidc",
      provider: "google",
      providerAccountId: payload.sub,
    });
  }

  const token = jwt.sign(
    {
      sub: user.id,
      email: user.email,
      name: user.name,
      picture: user.image,
    },
    process.env.MOBILE_JWT_SECRET!,
    { expiresIn: "30d", algorithm: "HS256" }
  );

  return NextResponse.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, image: user.image },
  });
}
