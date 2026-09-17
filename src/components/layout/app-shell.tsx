"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import type { SessionUser } from "@/lib/auth";

export function AppShell({ children, session, businessName }: { children: React.ReactNode; session: SessionUser; businessName: string }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const toggle = () => setSidebarOpen((o) => !o);
    document.addEventListener("ith:toggle-sidebar", toggle);
    return () => document.removeEventListener("ith:toggle-sidebar", toggle);
  }, []);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  return (
    <div className="min-h-screen bg-[#f7f8fa]">
      <Sidebar
        session={session}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        businessName={businessName}
      />
      <div className="flex min-h-screen flex-col lg:pl-[15.5rem]">
        <Topbar session={session} />
        <main className="flex-1 pb-20 lg:pb-8">
          <div className="mx-auto max-w-7xl px-4 py-6 lg:px-8">{children}</div>
        </main>
      </div>
    </div>
  );
}