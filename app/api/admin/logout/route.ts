import { NextResponse } from "next/server";

import { clearAdminSession } from "@/lib/security";

export const runtime = "nodejs";

export async function POST() {
  await clearAdminSession();
  return NextResponse.json({ ok: true });
}
