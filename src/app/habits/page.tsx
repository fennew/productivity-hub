"use client";

import { useState } from "react";
import { Plus, Check, Flame } from "lucide-react";
import { useStore } from "@/store/useStore";
import { cn } from "@/lib/utils";
import type { RecurrenceType } from "@/types";

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4"];

export default function HabitsPage() {
  const { habits, habitLogs, addHabit, logHabit } = useStore();
  const [showForm, setShowForm] = useState(false);
  const [newHabit, setNewHabit] = useState({
    name: "",
    description: "",
    frequency: "daily" as RecurrenceType,
    target_count: 1,
    color: COLORS[0],
    icon: "",
    active: true,
  });

  const today = new Date().toISOString().split("T")[0];

  // Last 7 days
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split("T")[0];
  });

  function getStreak(habitId: string): number {
    let streak = 0;
    const d = new Date();
    while (true) {
      const dateStr = d.toISOString().split("T")[0];
      const log = habitLogs.find((l) => l.habit_id === habitId && l.date === dateStr);
      if (!log) break;
      streak++;
      d.setDate(d.getDate() - 1);
    }
    return streak;
  }

  function isCompleted(habitId: string, date: string): boolean {
    const habit = habits.find((h) => h.id === habitId);
    const log = habitLogs.find((l) => l.habit_id === habitId && l.date === date);
    return (log?.count ?? 0) >= (habit?.target_count ?? 1);
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Habits</h1>
          <p className="text-sm text-zinc-400 mt-1">Track your daily habits and build streaks</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={16} />
          New Habit
        </button>
      </div>

      {showForm && (
        <div className="glass-card p-5 mb-6">
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Habit name..."
              value={newHabit.name}
              onChange={(e) => setNewHabit({ ...newHabit, name: e.target.value })}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-green-500"
              autoFocus
            />
            <div className="flex gap-3">
              <select
                value={newHabit.frequency}
                onChange={(e) => setNewHabit({ ...newHabit, frequency: e.target.value as RecurrenceType })}
                className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm outline-none"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
              </select>
              <input
                type="number"
                min={1}
                value={newHabit.target_count}
                onChange={(e) => setNewHabit({ ...newHabit, target_count: parseInt(e.target.value) || 1 })}
                className="w-20 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm outline-none"
                placeholder="Goal"
              />
              <div className="flex gap-1 items-center">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setNewHabit({ ...newHabit, color: c })}
                    className={cn(
                      "w-6 h-6 rounded-full border-2 transition-all",
                      newHabit.color === c ? "border-white scale-110" : "border-transparent"
                    )}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-zinc-400 hover:text-white">
                Cancel
              </button>
              <button
                onClick={() => {
                  if (newHabit.name.trim()) {
                    addHabit(newHabit);
                    setNewHabit({ name: "", description: "", frequency: "daily", target_count: 1, color: COLORS[0], icon: "", active: true });
                    setShowForm(false);
                  }
                }}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm font-medium"
              >
                Create Habit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Habits List */}
      {habits.length === 0 ? (
        <div className="glass-card p-8 text-center">
          <p className="text-zinc-500">No habits yet. Start building good habits!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {habits.filter((h) => h.active).map((habit) => {
            const streak = getStreak(habit.id);
            const todayLog = habitLogs.find((l) => l.habit_id === habit.id && l.date === today);
            const todayDone = isCompleted(habit.id, today);

            return (
              <div key={habit.id} className="glass-card p-5">
                <div className="flex items-center gap-4">
                  {/* Check button */}
                  <button
                    onClick={() => logHabit(habit.id, today)}
                    className={cn(
                      "w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all shrink-0",
                      todayDone
                        ? "border-transparent"
                        : "border-zinc-700 hover:border-zinc-500"
                    )}
                    style={todayDone ? { backgroundColor: habit.color } : {}}
                  >
                    {todayDone && <Check size={18} className="text-white" />}
                  </button>

                  {/* Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{habit.name}</span>
                      {streak > 0 && (
                        <span className="flex items-center gap-1 text-xs text-orange-400">
                          <Flame size={12} />
                          {streak} day streak
                        </span>
                      )}
                    </div>
                    {habit.target_count > 1 && (
                      <p className="text-xs text-zinc-500 mt-0.5">
                        {todayLog?.count ?? 0} / {habit.target_count} today
                      </p>
                    )}
                  </div>

                  {/* Week grid */}
                  <div className="flex gap-1.5">
                    {last7Days.map((date) => {
                      const done = isCompleted(habit.id, date);
                      return (
                        <div
                          key={date}
                          className={cn(
                            "w-7 h-7 rounded-md flex items-center justify-center text-[10px]",
                            done ? "text-white" : "bg-zinc-800/50 text-zinc-600"
                          )}
                          style={done ? { backgroundColor: habit.color } : {}}
                          title={date}
                        >
                          {new Date(date + "T00:00:00").toLocaleDateString("en-US", { weekday: "narrow" })}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
