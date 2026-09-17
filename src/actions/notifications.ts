"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { ok, fail, handleActionError } from "@/lib/actions";

export async function getNotifications() {
  try {
    const session = await requireAuth();
    const notifications = await prisma.notification.findMany({
      where: { businessId: session.businessId! },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    return ok(notifications);
  } catch (e) {
    return handleActionError(e);
  }
}

export async function markNotificationRead(id: string) {
  await prisma.notification.update({ where: { id }, data: { read: true } });
  return ok({ success: true });
}

export async function markAllNotificationsRead() {
  try {
    const session = await requireAuth();
    await prisma.notification.updateMany({
      where: { businessId: session.businessId!, read: false },
      data: { read: true },
    });
    return ok({ success: true });
  } catch (e) {
    return handleActionError(e);
  }
}