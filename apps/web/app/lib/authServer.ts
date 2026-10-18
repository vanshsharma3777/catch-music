
import { db, users } from "@repo/db";
import { eq } from "drizzle-orm";
import { getUser } from "./getUser";
export async function getCurrentUser(req : Request) {
  const session = await  getUser(req)
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
  return found[0] ?? null;
}
