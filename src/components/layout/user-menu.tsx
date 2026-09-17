"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, ChevronDown, Shield, User } from "lucide-react";
import { initials, cn } from "@/lib/utils";
import { logoutAction } from "@/actions/auth";
import type { SessionUser } from "@/lib/auth";

const roleLabel: Record<string, string> = {
  OWNER: "Owner",
  MANAGER: "Manager",
  STAFF: "Staff",
};

const roleColor: Record<string, string> = {
  OWNER: "bg-violet-100 text-violet-700",
  MANAGER: "bg-sky-100 text-sky-700",
  STAFF: "bg-slate-100 text-slate-600",
};

export function UserMenu({ session }: { session: SessionUser }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-lg px-1.5 py-1 transition-colors hover:bg-slate-100"
      >
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-amber-600 to-amber-700 text-[10px] font-bold text-white">
          {initials(session.name)}
        </div>
        <div className="hidden text-left md:block">
          <p className="text-xs font-semibold leading-tight text-slate-800">{session.name}</p>
          <p className="text-[10px] leading-tight text-slate-400">{roleLabel[session.role] ?? session.role}</p>
        </div>
        <ChevronDown className={cn("h-3.5 w-3.5 text-slate-400 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-40 mt-2 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white py-1.5 shadow-xl animate-in zoom-in-95">
            <div className="border-b border-slate-100 px-4 pb-2.5 pt-1.5">
              <p className="text-sm font-semibold text-slate-900">{session.name}</p>
              <p className="text-xs text-slate-400">{session.email}</p>
              <span className={cn("mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium", roleColor[session.role] ?? roleColor.STAFF)}>
                <Shield className="h-3 w-3" />
                {roleLabel[session.role] ?? session.role}
              </span>
            </div>
            <div
              className="mt-1 flex w-full items-center gap-2 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
            >
              <User className="h-4 w-4 text-slate-400" />
              <span className="text-xs font-medium">Signed in to Iced Tea House</span>
            </div>
            <button
              onClick={async () => {
                await logoutAction();
                router.push("/login");
                router.refresh();
              }}
              className="flex w-full items-center gap-2 px-4 py-2 text-sm text-rose-600 hover:bg-rose-50"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </>
      )}
    </div>
  );
}