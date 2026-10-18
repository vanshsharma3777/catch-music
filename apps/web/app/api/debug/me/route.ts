import { NextResponse } from "next/server";
import { getUser } from "../../../lib/getUser";

export async function GET(req: Request) {
  const user = await getUser(req);
  console.log("getUser result:", user); // terminal mein dikhega
  return NextResponse.json({ user });
}
