import { NextRequest, NextResponse } from "next/server";
import { clearTokenCookie } from "@/lib/auth";

export async function POST(_req: NextRequest) {
  clearTokenCookie();
  return NextResponse.json({ success: true });
}
