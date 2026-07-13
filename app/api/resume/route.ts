import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const expected = (process.env.RESUME_PASSWORD || "").trim();
  const privateUrl = (process.env.PRIVATE_RESUME_URL || "").trim();

  if (!expected || !privateUrl) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  let password = "";
  try {
    const body = await request.json();
    password = typeof body?.password === "string" ? body.password.trim() : "";
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  if (!password || password !== expected) {
    // slow down brute-force attempts
    await new Promise((resolve) => setTimeout(resolve, 800));
    return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
  }

  const upstream = await fetch(privateUrl, { cache: "no-store" });
  if (!upstream.ok) {
    return NextResponse.json({ error: "Resume source unavailable" }, { status: 502 });
  }
  const pdf = await upstream.arrayBuffer();

  return new NextResponse(pdf, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="John_K_Ryu_Resume.pdf"',
      "Cache-Control": "no-store",
    },
  });
}
