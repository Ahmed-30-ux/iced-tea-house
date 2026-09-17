import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/layout/app-shell";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");

  let businessName = "Iced Tea House";
  if (session.businessId) {
    const business = await prisma.business.findUnique({ where: { id: session.businessId } });
    if (business) businessName = business.name;
  }

  return <AppShell session={session} businessName={businessName}>{children}</AppShell>;
}