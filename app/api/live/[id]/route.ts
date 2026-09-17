import { NextResponse } from "next/server";
import { applyLiveAction, deleteLiveSession, getLiveSession } from "@/lib/live/store";
import { resolvePublicOrigin } from "@/lib/public-origin";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await resolvePublicOrigin(request);
  const { id } = await params;
  const session = await getLiveSession(id);
  if (!session) {
    return NextResponse.json({ error: "Стол не найден" }, { status: 404 });
  }
  return NextResponse.json({ session });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = (await request.json()) as {
    type: "hand" | "bust" | "stack" | "close";
    playerId?: string;
    pot?: number;
    stack?: number;
  };
  const session = await applyLiveAction(id, body);
  if (!session) {
    return NextResponse.json({ error: "Стол не найден" }, { status: 404 });
  }
  return NextResponse.json({ session });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await deleteLiveSession(id);
  return NextResponse.json({ ok: true });
}
