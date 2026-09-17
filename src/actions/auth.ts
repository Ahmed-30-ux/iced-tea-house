"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { loginSchema, parseForm } from "@/lib/validations";
import { createSession, destroySession, hashPassword, requireAuth } from "@/lib/auth";
import { ok, fail, handleActionError, type ActionResult } from "@/lib/actions";

export async function loginAction(prevState: any, formData: FormData): Promise<ActionResult> {
  const parsed = loginSchema.safeParse(parseForm(formData));
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Invalid input");
  }

  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });

  if (!user || !user.active) {
    return fail("Invalid email or password.");
  }

  const bcrypt = await import("bcryptjs");
  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) {
    return fail("Invalid email or password.");
  }

  await createSession({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    businessId: user.businessId,
  });

  return ok({ redirect: "/dashboard" });
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}

export async function registerUserAction(prevState: any, formData: FormData) {
  try {
    const session = await requireAuth();
    const data = parseForm(formData);
    const password = String(data.password || "password123");
    const hashed = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        businessId: session.businessId,
        name: String(data.name),
        email: String(data.email).toLowerCase().trim(),
        passwordHash: hashed,
        role: (data.role as any) ?? "STAFF",
      },
    });
    return ok(user);
  } catch (e) {
    return handleActionError(e);
  }
}