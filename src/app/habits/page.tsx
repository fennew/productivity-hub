"use client";

import { useState } from "react";
import { Plus, Check, Flame, Pencil, Trash2, X, ChevronLeft, ChevronRight } from "lucide-react";
import { useStore } from "@/store/useStore";
import { cn } from "@/lib/utils";
import type { RecurrenceType } from "@/types";

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4"];

export default function HabitsPage() {
  const { habits, habitLogs, addHabit, updateHabit, deleteHabit, toggleHabitDay } = useStore();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    frequency: "daily" as RecurrenceType,
    target_count: 1,
    color: COLORS[0],
    icon: "",
    active: true,
  });

  // Week offset: 0 = current week, -1 = last week, etc.
  const [weekOffset, setWeekOffset] = useState(0);

  const today = new Date().toISOString().split("T")[0];

  // Get 7 days for the visible week
  const visibleDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i) + weekOffset * 7);
    return d.toISOString().split("T")[0];
  });

  function resetForm() {
    setFormData({ name: "", description: "", frequency: "daily", target_count: 1, color: COLORS[0], icon: "", active: true });
    setEditingId(null);
    setShowForm(false);
  }

  function startEdit(habit: typeof habits[0]) {
    setFormData({
      name: habit.name,
      description: habit.description || "",
      frequency: habit.frequency,
      target_count: habit.target_count,
      color: habit.color,
      icon: habit.icon || "",
      active: habit.active,
    });
    setEditingId(habit.id);
    setShowForm(true);
  }

  function handleSave() {
    if (!formData.name.trim()) return;
    if (editingId) {
      updateHabit(editingId, formData);
    } else {
      addHabit(formData);
    }
    resetForm();
  }

  function handleDelete(id: string) {
    if (confirm("Delete this habit and all its logs?")) {
      deleteHabit(id);
    }
  }

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

  const weekLabel = (() => {
    const start = new Date(visibleDays[0] + "T00:00:00");
    const end = new Date(visibleDays[6] + "T00:00:00");
    if (weekOffset === 0) return "This Week";
    if (weekOffset === -1) return "Last Week";
    return `${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${end.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
  })();

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Habits</h1>
          <p className="text-sm text-zinc-400 mt-1">Track your daily habits and build streaks</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={16} />
          New Habit
        </button>
      </div>

      {/* Week Navigation */}
      <div className="flex items-center justify-center gap-3 mb-4">
        <button onClick={() => setWeekOffset(weekOffset - 1)} className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 transition-colors">
          <ChevronLeft size={16} />
        </button>
        <span className="text-sm font-medium min-w-[120px] text-center">{weekLabel}</span>
        <button
          onClick={() => setWeekOffset(Math.min(0, weekOffset + 1))}
          disabled={weekOffset >= 0}
          className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 transition-colors disabled:opacity-30"
        >
          <ChevronRight size={16} />
        </button>
        {weekOffset !== 0 && (
          <button onClick={() => setWeekOffset(0)} className="text-xs text-blue-400 hover:text-blue-300 ml-2">Today</button>
        )}
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="glass-card p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">{editingId ? "Edit Habit" : "New Habit"}</h3>
            <button onClick={resetForm} className="text-zinc-500 hover:text-white"><X size={16} /></button>
          </div>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Habit name..."
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-green-500"
              autoFocus
            />
            <input
              type="text"
              placeholder="Description (optional)"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm outline-none"
            />
            <div className="flex gap-3">
              <select
                value={formData.frequency}
                onChange={(e) => setFormData({ ...formData, frequency: e.target.value as RecurrenceType })}
                className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm outline-none"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
              </select>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min={1}
                  value={formData.target_count}
                  onChange={(e) => setFormData({ ...formData, target_count: parseInt(e.target.value) || 1 })}
                  className="w-16 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm outline-none"
                />
                <span className="text-xs text-zinc-500">/ day</span>
              </div>
              <div className="flex gap-1 items-center">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setFormData({ ...formData, color: c })}
                    className={cn(
                      "w-6 h-6 rounded-full border-2 transition-all",
                      formData.color === c ? "border-white scale-110" : "border-transparent"
                    )}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={resetForm} className="px-4 py-2 text-sm text-zinc-400 hover:text-white">Cancel</button>
              <button onClick={handleSave} className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm font-medium">
                {editingId ? "Update Habit" : "Create Habit"}
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
            const todayDone = isCompleted(habit.id, today);

            return (
              <div key={habit.id} className="glass-card p-5 group">
                <div className="flex items-center gap-4">
                  {/* Today check button */}
                  <button
                    onClick={() => toggleHabitDay(habit.id, today)}
                    className={cn(
                      "w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all shrink-0",
                      todayDone ? "border-transparent" : "border-zinc-700 hover:border-zinc-500"
                    )}
                    style={todayDone ? { backgroundColor: habit.color } : {}}
                  >
                    {todayDone && <Check size={18} className="text-white" />}
                  </button>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{habit.name}</span>
                      {streak > 0 && (
                        <span className="flex items-center gap-1 text-xs text-orange-400 shrink-0">
                          <Flame size={12} />
                          {streak}d
                        </span>
                      )}
                    </div>
                    {habit.description && (
                      <p className="text-xs text-zinc-500 mt-0.5 truncate">{habit.description}</p>
                    )}
                  </div>

                  {/* Week grid - clickable to toggle past days */}
                  <div className="flex gap-1.5 shrink-0">
                    {visibleDays.map((date) => {
                      const done = isCompleted(habit.id, date);
                      const isFuture = date > today;
                      return (
                        <button
                          key={date}
                          onClick={() => !isFuture && toggleHabitDay(habit.id, date)}
                          disabled={isFuture}
                          className={cn(
                            "w-7 h-7 rounded-md flex items-center justify-center text-[10px] transition-all",
                            done ? "text-white" : "bg-zinc-800/50 text-zinc-600 hover:bg-zinc-700/50",
                            isFuture && "opacity-30 cursor-not-allowed",
                            date === today && !done && "ring-1 ring-zinc-600"
                          )}
                          style={done ? { backgroundColor: habit.color } : {}}
                          title={`${date}${date === today ? " (today)" : ""} — click to toggle`}
                        >
                          {new Date(date + "T00:00:00").toLocaleDateString("en-US", { weekday: "narrow" })}
                        </button>
                      );
                    })}
                  </div>

                  {/* Edit/Delete */}
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <button onClick={() => startEdit(habit)} className="p-1.5 text-zinc-500 hover:text-blue-400 transition-colors">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => handleDelete(habit.id)} className="p-1.5 text-zinc-500 hover:text-red-400 transition-colors">
                      <Trash2 size={14} />
                    </button>
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
