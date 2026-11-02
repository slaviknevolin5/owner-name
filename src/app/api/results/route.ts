import { NextResponse } from "next/server";
import { getResults, storageBackend } from "@/lib/store";
import { getCandidates } from "@/lib/candidates";

export const dynamic = "force-dynamic";

export async function GET() {
  const counts = await getResults();
  const candidates = getCandidates().map((c) => ({
    ...c,
    votes: counts[c.id] ?? 0,
  }));
  const total = candidates.reduce((sum, c) => sum + c.votes, 0);

  return NextResponse.json({
    candidates,
    total,
    backend: await storageBackend(),
  });
}
