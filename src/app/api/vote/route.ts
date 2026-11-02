import { NextRequest, NextResponse } from "next/server";
import { castVote } from "@/lib/store";
import { COOKIE_MAX_AGE, COOKIE_NAME } from "@/lib/constants";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  let body: { deviceId?: string; candidateId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const cookieId = request.cookies.get(COOKIE_NAME)?.value;
  const deviceId = (body.deviceId || cookieId || "").trim();
  const candidateId = (body.candidateId || "").trim();

  if (!deviceId || deviceId.length < 8 || deviceId.length > 128) {
    return NextResponse.json({ error: "invalid_device" }, { status: 400 });
  }
  if (!candidateId) {
    return NextResponse.json({ error: "invalid_candidate" }, { status: 400 });
  }

  const result = await castVote(deviceId, candidateId);

  const response = NextResponse.json(result, {
    status: result.ok ? 200 : result.reason === "invalid_candidate" ? 400 : 409,
  });

  response.cookies.set({
    name: COOKIE_NAME,
    value: deviceId,
    httpOnly: false,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });

  return response;
}
