"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { ok, fail, handleActionError } from "@/lib/actions";

export async function getLocationsAction() {
  try {
    const session = await requireAuth();
    if (!session.businessId) return fail("No business");
    const locations = await prisma.location.findMany({
      where: { businessId: session.businessId, isActive: true },
      orderBy: { name: "asc" },
    });
    return ok(locations);
  } catch (e) {
    return handleActionError(e);
  }
}

export async function createLocationAction(prevState: any, formData: FormData) {
  try {
    const session = await requireAuth();
    if (!session.businessId) return fail("No business");
    const name = String(formData.get("name") ?? "").trim();
    if (!name) return fail("Location name is required");
    const location = await prisma.location.create({
      data: {
        businessId: session.businessId,
        name,
        address: String(formData.get("address") ?? "").trim() || null,
        phone: String(formData.get("phone") ?? "").trim() || null,
      },
    });
    return ok(location);
  } catch (e) {
    return handleActionError(e);
  }
}

export async function updateLocationAction(id: string, data: { name?: string; address?: string; phone?: string }) {
  try {
    const session = await requireAuth();
    if (!session.businessId) return fail("No business");
    const location = await prisma.location.findFirst({ where: { id, businessId: session.businessId } });
    if (!location) return fail("Location not found");
    const updated = await prisma.location.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.address !== undefined && { address: data.address || null }),
        ...(data.phone !== undefined && { phone: data.phone || null }),
      },
    });
    return ok(updated);
  } catch (e) {
    return handleActionError(e);
  }
}

export async function deleteLocationAction(id: string) {
  try {
    const session = await requireAuth();
    if (!session.businessId) return fail("No business");
    const location = await prisma.location.findFirst({ where: { id, businessId: session.businessId } });
    if (!location) return fail("Location not found");
    await prisma.location.update({ where: { id }, data: { isActive: false } });
    return ok({ success: true });
  } catch (e) {
    return handleActionError(e);
  }
}
