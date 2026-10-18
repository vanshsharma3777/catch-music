import jwt, { JwtPayload } from "jsonwebtoken";
import { getServerSession } from "next-auth";
import { headers } from "next/headers";
import { authOptions } from "./config/authOptions";

export type AuthSession = {
  user: {
    id: string;
    email: string | null;
    name: string | null;
    image: string | null;
  };
};

export async function getUser(req?: Request): Promise<AuthSession | null> {
  const session = await getServerSession(authOptions);
  if (session?.user?.email) {
    return {
      user: {
        id: (session.user as any).id as string,
        email: session.user.email ?? null,
        name: session.user.name ?? null,
        image: session.user.image ?? null,
      },
    };
  }
  let header: string | null = null;
  if (req) {
    header = req.headers.get("authorization");
  } else {
    try {
      const h = await headers();
      header = h.get("authorization");
    } catch {
      header = null;
    }
  }

  if (header?.startsWith("Bearer ")) {
    try {
      const payload = jwt.verify(header.slice(7), process.env.MOBILE_JWT_SECRET!, {
        algorithms: ["HS256"],
      }) as JwtPayload;

      const email = payload.email as string | undefined;
      if (!email) return null;

      return {
        user: {
          id: (payload.sub as string) ?? "",
          email,
          name: (payload.name as string) ?? null,
          image: (payload.picture as string) ?? null,
        },
      };
    } catch (e) {
      console.log("JWT verify failed:", e);
      return null;
    }
  }

  return null;
}
