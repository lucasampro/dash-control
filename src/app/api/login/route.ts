import { NextRequest, NextResponse } from "next/server";
import { createSessionToken, SESSION_COOKIE, verifyCredentials } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { username, password } = await req.json();

  if (typeof username !== "string" || typeof password !== "string") {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }

  const user = await verifyCredentials(username.trim(), password);
  if (!user) {
    return NextResponse.json({ error: "Usuário ou senha incorretos." }, { status: 401 });
  }

  const token = await createSessionToken(user);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}
