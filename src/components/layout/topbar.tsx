"use client";

import { useState } from "react";
import { Menu, Search } from "lucide-react";
import { NotificationsButton } from "@/components/layout/notifications";
import { SearchDialog } from "@/components/layout/search-dialog";
import { UserMenu } from "@/components/layout/user-menu";
import type { SessionUser } from "@/lib/auth";

export function Topbar({ session }: { session: SessionUser }) {
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center justify-between border-b border-slate-200 bg-white/80 px-4 backdrop-blur-md lg:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => document.dispatchEvent(new CustomEvent("ith:toggle-sidebar"))}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 lg:hidden"
        >
          <Menu className="h-4 w-4" />
        </button>
        <button
          onClick={() => setSearchOpen(true)}
          className="hidden h-9 w-72 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-400 transition-colors hover:bg-slate-100 md:flex"
        >
          <Search className="h-4 w-4" />
          <span>Search anything...</span>
          <kbd className="ml-auto rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] text-slate-400">⌘K</kbd>
        </button>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => setSearchOpen(true)}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 md:hidden"
        >
          <Search className="h-4 w-4" />
        </button>
        <NotificationsButton />
        <UserMenu session={session} />
      </div>

      <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />
    </header>
  );
}