"use client";

import { Bell, User } from "lucide-react";
import { useStore } from "@/store/useStore";
import { cn } from "@/lib/utils";

export function Header() {
  const { sidebarOpen } = useStore();

  return (
    <header
      className={cn(
        "fixed top-0 right-0 z-30 h-14 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800 flex items-center justify-between px-4 md:px-6 transition-all duration-300",
        // Mobile: full width
        "left-0",
        // Desktop: offset by sidebar
        sidebarOpen ? "md:left-64" : "md:left-16"
      )}
    >
      {/* Left spacer for hamburger on mobile */}
      <div className="w-10 md:hidden" />

      {/* Title area - mobile only */}
      <h1 className="text-sm font-semibold md:hidden">Productivity Hub</h1>

      {/* Desktop spacer */}
      <div className="hidden md:block" />

      {/* Right side */}
      <div className="flex items-center gap-1 md:gap-3">
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
