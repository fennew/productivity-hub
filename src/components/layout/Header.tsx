"use client";

import { Bell, Search, User } from "lucide-react";
import { useStore } from "@/store/useStore";
import { cn } from "@/lib/utils";

export function Header() {
  const { sidebarOpen } = useStore();

  return (
    <header
      className={cn(
        "fixed top-0 right-0 z-30 h-14 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800 flex items-center justify-between px-4 md:px-6 transition-all duration-300",
        // Mobile: full width, with space for hamburger
        "left-0 pl-14",
        // Desktop: offset by sidebar
        sidebarOpen ? "md:left-64 md:pl-6" : "md:left-16 md:pl-6"
      )}
    >
      {/* Search */}
      <div className="flex items-center gap-2 bg-zinc-900 rounded-lg px-3 py-2 flex-1 max-w-xs md:max-w-sm lg:max-w-md border border-zinc-800 focus-within:border-zinc-600">
        <Search size={16} className="text-zinc-500 shrink-0" />
        <input
          type="text"
          placeholder="Search..."
          className="bg-transparent text-sm text-white placeholder:text-zinc-500 outline-none w-full min-w-0"
        />
        <kbd className="hidden lg:inline text-[10px] text-zinc-600 bg-zinc-800 px-1.5 py-0.5 rounded whitespace-nowrap">
          ⌘K
        </kbd>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-1 md:gap-3 ml-2">
        <button className="relative p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-500 rounded-full" />
        </button>
        <button className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors">
          <User size={18} />
        </button>
      </div>
    </header>
  );
}
