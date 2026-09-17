"use server";

import { seedDatabase } from "@/lib/seed";
import { ok, handleActionError } from "@/lib/actions";

export async function seedDemoDataAction() {
  try {
    const existing = await (await import("@/lib/prisma")).prisma.user.count();
    if (existing > 0) {
      return ok({ skipped: true });
    }
    await seedDatabase();
    return ok({ seeded: true });
  } catch (e) {
    return handleActionError(e);
  }
}