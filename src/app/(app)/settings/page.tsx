import nextDynamic from "next/dynamic";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";

const SettingsClient = nextDynamic(
  () => import("./settings-client").then((m) => ({ default: m.SettingsClient })),
  { loading: () => <div className="h-[400px] animate-pulse rounded-xl bg-slate-100" /> }
);

export const dynamic = "force-dynamic";

export const metadata = { title: "Settings - Iced Tea House" };

export default async function SettingsPage() {
  const session = await getSession();
  if (!session?.businessId) return null;

  const [business, users, categories, locations, recentAudit] = await Promise.all([
    prisma.business.findUnique({ where: { id: session.businessId } }),
    prisma.user.findMany({ where: { businessId: session.businessId }, orderBy: { createdAt: "asc" } }),
    prisma.category.findMany({ where: { businessId: session.businessId }, orderBy: { name: "asc" }, include: { _count: { select: { products: true } } } }),
    prisma.location.findMany({ where: { businessId: session.businessId }, orderBy: { name: "asc" } }),
    prisma.auditLog.findMany({
      where: { businessId: session.businessId },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  return (
    <div>
      <PageHeader title="Settings" description="Configure your business" />
      <SettingsClient
        business={{
          name: business?.name ?? "",
          tagline: business?.tagline ?? "",
          instagram: business?.instagram ?? "",
          currency: business?.currency ?? "PKR",
          isDemo: business?.isDemo ?? false,
        }}
        users={users.map((u) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role,
          active: u.active,
          createdAt: u.createdAt.toISOString(),
        }))}
        categories={categories.map((c) => ({
          id: c.id,
          name: c.name,
          description: c.description,
          productCount: c._count.products,
        }))}
        locations={locations.map((l) => ({
          id: l.id,
          name: l.name,
          address: l.address,
          phone: l.phone,
          isActive: l.isActive,
        }))}
        audit={recentAudit.map((a) => ({
          id: a.id,
          userName: a.userName ?? "system",
          action: a.action,
          entityType: a.entityType,
          details: a.details,
          createdAt: a.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}