import { NextRequest, NextResponse } from "next/server";
import { getDeviceVote, getResults, storageBackend } from "@/lib/store";
import { COOKIE_NAME } from "@/lib/constants";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const headerId = request.headers.get("x-device-id");
  const cookieId = request.cookies.get(COOKIE_NAME)?.value;
  const deviceId = headerId || cookieId || null;

  const counts = await getResults();
  const backend = await storageBackend();

  if (!deviceId) {
    return NextResponse.json({
      hasVoted: false,
      counts,
      backend,
    });
  }

  const vote = await getDeviceVote(deviceId);
  return NextResponse.json({
    hasVoted: Boolean(vote),
    candidateId: vote?.candidateId ?? null,
    votedAt: vote?.votedAt ?? null,
    counts,
    backend,
  });
}
