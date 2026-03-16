"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CheckSquare,
  Calendar,
  Target,
  DollarSign,
  Dumbbell,
  MessageSquare,
  Mic,
  Settings,
  Plug,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useStore } from "@/store/useStore";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/calendar", label: "Calendar", icon: Calendar },
  { href: "/habits", label: "Habits", icon: Target },
  { href: "/finances", label: "Finances", icon: DollarSign },
  { href: "/gym", label: "Gym", icon: Dumbbell },
  { href: "/chat", label: "AI Chat", icon: MessageSquare },
  { href: "/voice-notes", label: "Voice Notes", icon: Mic },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen, toggleSidebar } = useStore();

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-zinc-950 border-r border-zinc-800 transition-all duration-300 flex flex-col",
        sidebarOpen ? "w-64" : "w-16"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-zinc-800">
        {sidebarOpen && (
          <h1 className="text-lg font-bold text-white tracking-tight">
            ⚡ Hub
          </h1>
        )}
        <button
          onClick={toggleSidebar}
          className="p-1.5 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
        >
          {sidebarOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-blue-600/20 text-blue-400"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800/60"
              )}
            >
              <item.icon size={20} />
              {sidebarOpen && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      {sidebarOpen && (
        <div className="p-4 border-t border-zinc-800">
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <Plug size={14} />
            <span>Integrations</span>
          </div>
        </div>
      )}
    </aside>
  );
}
