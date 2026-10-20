import { NextResponse } from "next/server";
import { getUser } from "../../../lib/getUser";

export async function GET(req: Request) {
  const user = await getUser(req);
  return NextResponse.json({ user });
}
