"use client";

import {
  CheckSquare,
  Calendar,
  Target,
  DollarSign,
  Dumbbell,
  Mic,
  TrendingUp,
  Clock,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { useStore } from "@/store/useStore";

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
  href,
}: {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ElementType;
  color: string;
  href: string;
}) {
  return (
    <Link href={href} className="glass-card p-4 md:p-5 hover:border-zinc-600 transition-all group active:scale-[0.98]">
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] md:text-xs text-zinc-500 uppercase tracking-wider">{title}</p>
          <p className="text-xl md:text-2xl font-bold mt-1">{value}</p>
          <p className="text-[11px] md:text-xs text-zinc-400 mt-1 truncate">{subtitle}</p>
        </div>
        <div className={`p-2 md:p-2.5 rounded-lg ${color} bg-opacity-15 shrink-0 ml-2`}>
          <Icon size={18} className={`md:w-5 md:h-5 ${color.replace("bg-", "text-")}`} />
        </div>
      </div>
    </Link>
  );
}

export default function Dashboard() {
  const { tasks, events, habits, habitLogs, transactions, workouts } = useStore();

  const today = new Date().toISOString().split("T")[0];
  const openTasks = tasks.filter((t) => t.status !== "done" && t.status !== "cancelled");
  const todayTasks = tasks.filter((t) => t.due_date === today && t.status !== "done");
  const overdueTasks = tasks.filter(
    (t) => t.due_date && t.due_date < today && t.status !== "done" && t.status !== "cancelled"
  );
  const todayEvents = events.filter((e) => e.start_time.startsWith(today));
  const todayHabitLogs = habitLogs.filter((l) => l.date === today);
  const monthTransactions = transactions.filter((t) =>
    t.date.startsWith(today.substring(0, 7))
  );
  const monthIncome = monthTransactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);
  const monthExpenses = monthTransactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);
  const weekWorkouts = workouts.filter((w) => {
    const d = new Date(w.date);
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return d >= weekAgo;
  });

  return (
    <div className="max-w-7xl mx-auto">
      {/* Greeting */}
      <div className="mb-6 md:mb-8">
        <h1 className="text-xl md:text-2xl font-bold">
          Good {getGreeting()} 👋
        </h1>
        <p className="text-sm md:text-base text-zinc-400 mt-1">
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric",
          })}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
        <StatCard
          title="Open Tasks"
          value={openTasks.length}
          subtitle={`${todayTasks.length} due today`}
          icon={CheckSquare}
          color="bg-blue-500"
          href="/tasks"
        />
        <StatCard
          title="Events"
          value={todayEvents.length}
          subtitle="today"
          icon={Calendar}
          color="bg-purple-500"
          href="/calendar"
        />
        <StatCard
          title="Habits"
          value={`${todayHabitLogs.length}/${habits.filter((h) => h.active).length}`}
          subtitle="completed today"
          icon={Target}
          color="bg-green-500"
          href="/habits"
        />
        <StatCard
          title="This Month"
          value={`\u20ac${(monthIncome - monthExpenses).toFixed(0)}`}
          subtitle={`\u20ac${monthIncome.toFixed(0)} in \u00b7 \u20ac${monthExpenses.toFixed(0)} out`}
          icon={DollarSign}
          color="bg-yellow-500"
          href="/finances"
        />
      </div>

      {/* Quick Actions & Overdue */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Overdue Tasks */}
        <div className="glass-card p-4 md:p-5">
          <div className="flex items-center gap-2 mb-3 md:mb-4">
            <AlertCircle size={18} className="text-red-400" />
            <h2 className="font-semibold text-sm md:text-base">Overdue Tasks</h2>
            <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full ml-auto">
              {overdueTasks.length}
            </span>
          </div>
          {overdueTasks.length === 0 ? (
            <p className="text-sm text-zinc-500">No overdue tasks! 🎉</p>
          ) : (
            <div className="space-y-2">
              {overdueTasks.slice(0, 5).map((task) => (
                <div key={task.id} className="flex items-center gap-3 p-2 rounded-lg bg-zinc-900/50">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${getPriorityColor(task.priority)}`} />
                  <span className="text-sm flex-1 truncate">{task.title}</span>
                  <span className="text-xs text-red-400 shrink-0">{task.due_date}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Today's Schedule */}
        <div className="glass-card p-4 md:p-5">
          <div className="flex items-center gap-2 mb-3 md:mb-4">
            <Clock size={18} className="text-blue-400" />
            <h2 className="font-semibold text-sm md:text-base">Today&apos;s Schedule</h2>
          </div>
          {todayEvents.length === 0 && todayTasks.length === 0 ? (
            <p className="text-sm text-zinc-500">Nothing scheduled for today</p>
          ) : (
            <div className="space-y-2">
              {todayEvents.map((event) => (
                <div key={event.id} className="flex items-center gap-3 p-2 rounded-lg bg-zinc-900/50">
                  <div className="w-2 h-2 rounded-full bg-purple-400 shrink-0" />
                  <span className="text-sm flex-1 truncate">{event.title}</span>
                  <span className="text-xs text-zinc-400 shrink-0">
                    {new Date(event.start_time).toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              ))}
              {todayTasks.map((task) => (
                <div key={task.id} className="flex items-center gap-3 p-2 rounded-lg bg-zinc-900/50">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${getPriorityColor(task.priority)}`} />
                  <span className="text-sm flex-1 truncate">{task.title}</span>
                  {task.due_time && (
                    <span className="text-xs text-zinc-400 shrink-0">{task.due_time}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Stats Row */}
        <div className="glass-card p-4 md:p-5">
          <div className="flex items-center gap-2 mb-3 md:mb-4">
            <Dumbbell size={18} className="text-orange-400" />
            <h2 className="font-semibold text-sm md:text-base">Gym This Week</h2>
          </div>
          <p className="text-2xl md:text-3xl font-bold">{weekWorkouts.length}</p>
          <p className="text-[11px] md:text-xs text-zinc-500 mt-1">workouts completed</p>
        </div>

        <div className="glass-card p-4 md:p-5">
          <div className="flex items-center gap-2 mb-3 md:mb-4">
            <TrendingUp size={18} className="text-emerald-400" />
            <h2 className="font-semibold text-sm md:text-base">Quick Actions</h2>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Link
              href="/tasks"
              className="p-3 rounded-lg bg-zinc-900 hover:bg-zinc-800 active:bg-zinc-700 text-sm text-center transition-colors"
            >
              + New Task
            </Link>
            <Link
              href="/voice-notes"
              className="p-3 rounded-lg bg-zinc-900 hover:bg-zinc-800 active:bg-zinc-700 text-sm text-center transition-colors"
            >
              🎙 Voice Note
            </Link>
            <Link
              href="/chat"
              className="p-3 rounded-lg bg-zinc-900 hover:bg-zinc-800 active:bg-zinc-700 text-sm text-center transition-colors"
            >
              💬 AI Chat
            </Link>
            <Link
              href="/finances"
              className="p-3 rounded-lg bg-zinc-900 hover:bg-zinc-800 active:bg-zinc-700 text-sm text-center transition-colors"
            >
              💰 Add Expense
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "morning";
  if (hour < 18) return "afternoon";
  return "evening";
}

function getPriorityColor(priority: string) {
  switch (priority) {
    case "urgent": return "bg-red-500";
    case "high": return "bg-orange-500";
    case "medium": return "bg-yellow-500";
    case "low": return "bg-green-500";
    default: return "bg-zinc-500";
  }
}
