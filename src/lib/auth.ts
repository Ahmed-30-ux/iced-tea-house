import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { cache } from "react";
import { prisma } from "@/lib/prisma";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";
const COOKIE_NAME = "ith_session";
const SESSION_DAYS = 14;

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: "OWNER" | "MANAGER" | "STAFF";
  businessId: string | null;
};

function signToken(payload: SessionUser) {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: `${SESSION_DAYS}d`,
    algorithm: "HS256",
  });
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function createSession(user: SessionUser) {
  const token = signToken(user);
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
    path: "/",
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function verifySessionToken() {
  return true;
}

export const getSession = cache(async (): Promise<SessionUser | null> => {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;
    const payload = jwt.verify(token, JWT_SECRET) as SessionUser;
    return {
      id: payload.id,
      name: payload.name,
      email: payload.email,
      role: payload.role,
      businessId: payload.businessId,
    };
  } catch {
    return null;
  }
});

export async function requireAuth(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized");
  }
  return session;
}

export function roleAtLeast(role: SessionUser["role"], min: SessionUser["role"]) {
  const order: Record<SessionUser["role"], number> = { STAFF: 0, MANAGER: 1, OWNER: 2 };
  return order[role] >= order[min];
}