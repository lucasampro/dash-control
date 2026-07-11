import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { prisma } from "./db";

export const SESSION_COOKIE = "control_session";
const SESSION_DURATION = "7d";

function getSecretKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET não configurado.");
  }
  return new TextEncoder().encode(secret);
}

export async function verifyCredentials(username: string, password: string) {
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user || !user.ativo) return null;
  const ok = await bcrypt.compare(password, user.passwordHash);
  return ok ? user : null;
}

export async function createSessionToken(user: { username: string; isAdmin: boolean }) {
  return new SignJWT({ username: user.username, isAdmin: user.isAdmin })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(SESSION_DURATION)
    .sign(getSecretKey());
}

export async function verifySessionToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return payload as { username: string; isAdmin: boolean };
  } catch {
    return null;
  }
}

/** Lê a sessão a partir do cookie (server components/actions) e retorna null se não houver. */
export async function getSession() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  return token ? verifySessionToken(token) : null;
}

/** Usada no topo de Server Actions do painel admin — lança erro se o usuário
 * logado não for admin, independente do que o proxy já tenha checado. */
export async function requireAdmin() {
  const session = await getSession();
  if (!session?.isAdmin) {
    throw new Error("Acesso restrito ao admin.");
  }
  return session;
}
