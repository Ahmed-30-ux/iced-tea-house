"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { hashPassword } from "@/lib/auth";
import { ok, fail, handleActionError } from "@/lib/actions";

export async function updateBusinessInfoAction(prevState: any, formData: FormData) {
  try {
    const session = await requireAuth();
    if (!session.businessId) return fail("No business");
    const business = await prisma.business.update({
      where: { id: session.businessId },
      data: {
        name: String(formData.get("name")),
        tagline: String(formData.get("tagline") ?? "") || null,
        instagram: String(formData.get("instagram") ?? "") || null,
        currency: String(formData.get("currency") ?? "PKR"),
      },
    });
    return ok(business);
  } catch (e) {
    return handleActionError(e);
  }
}

export async function updateProfileAction(prevState: any, formData: FormData) {
  try {
    const session = await requireAuth();
    await prisma.user.update({
      where: { id: session.id },
      data: {
        name: String(formData.get("name")),
        email: String(formData.get("email")).toLowerCase().trim(),
      },
    });
    return ok({ success: true });
  } catch (e) {
    return handleActionError(e);
  }
}

export async function changePasswordAction(prevState: any, formData: FormData) {
  try {
    const session = await requireAuth();
    const current = String(formData.get("currentPassword"));
    const newPass = String(formData.get("newPassword"));
    if (newPass.length < 6) return fail("Password must be at least 6 characters");
    const user = await prisma.user.findUnique({ where: { id: session.id } });
    if (!user) return fail("User not found");
    const bcrypt = await import("bcryptjs");
    const valid = await bcrypt.compare(current, user.passwordHash);
    if (!valid) return fail("Current password is incorrect");
    const hashed = await bcrypt.hash(newPass, 10);
    await prisma.user.update({ where: { id: session.id }, data: { passwordHash: hashed } });
    return ok({ success: true });
  } catch (e) {
    return handleActionError(e);
  }
}

export async function updateCardFeeAction(cardFeePercent: number): Promise<{ ok: boolean; error?: string }> {
  try {
    const session = await requireAuth();
    if (!session.businessId) return { ok: false, error: "No business" };
    const business = await prisma.business.findUnique({ where: { id: session.businessId } });
    if (!business) return { ok: false, error: "Business not found" };
    const settings = business.settings ? JSON.parse(business.settings) : {};
    settings.cardFeePercent = cardFeePercent;
    await prisma.business.update({
      where: { id: session.businessId },
      data: { settings: JSON.stringify(settings) },
    });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to save" };
  }
}

export async function getCardFeeAction(): Promise<{ ok: boolean; cardFeePercent?: number; error?: string }> {
  try {
    const session = await requireAuth();
    if (!session.businessId) return { ok: false, error: "No business" };
    const business = await prisma.business.findUnique({ where: { id: session.businessId } });
    if (!business) return { ok: false, error: "Business not found" };
    const settings = business.settings ? JSON.parse(business.settings) : {};
    return { ok: true, cardFeePercent: settings.cardFeePercent ?? 2.5 };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to load" };
  }
}