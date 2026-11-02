import { NextResponse } from "next/server";
import { getCandidates } from "@/lib/candidates";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ candidates: getCandidates() });
}
