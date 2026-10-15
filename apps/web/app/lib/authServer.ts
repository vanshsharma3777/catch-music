import { getServerSession } from "next-auth";
import { authOptions } from "./config/authOptions";
import { db, users } from "@repo/db";
import { eq } from "drizzle-orm";

export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return null;
  }
  const found = await db
    .select()
    .from(users)
    .where(eq(users.email, session.user.email))
    .limit(1);

  if (found.length === 0) {
    return null;
  }
  return found[0];
}
