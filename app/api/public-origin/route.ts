import { NextResponse } from "next/server";
import { resolvePublicOrigin } from "@/lib/public-origin";

export async function GET(request: Request) {
  const origin = await resolvePublicOrigin(request);
  return NextResponse.json({ origin });
}
