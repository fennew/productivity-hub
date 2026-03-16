import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  const cookieStore = await cookies();
  const hasAccess = cookieStore.has("google_access_token");
  const hasRefresh = cookieStore.has("google_refresh_token");
  return NextResponse.json({ connected: hasAccess || hasRefresh });
}
