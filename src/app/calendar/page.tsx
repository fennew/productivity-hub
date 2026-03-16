"use client";

import { useState } from "react";
import { Plus, ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { useStore } from "@/store/useStore";
import { cn } from "@/lib/utils";

export default function CalendarPage() {
  const { events, addEvent, tasks } = useStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showForm, setShowForm] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: "",
    description: "",
    start_time: "",
    end_time: "",
    location: "",
    meeting_link: "",
    attendees: [] as string[],
    source: "manual" as const,
    color: "#3b82f6",
  });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date().toISOString().split("T")[0];

  const days = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  function getEventsForDay(day: number) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return events.filter((e) => e.start_time.startsWith(dateStr));
  }

  function getTasksForDay(day: number) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return tasks.filter((t) => t.due_date === dateStr && t.status !== "done");
  }

  function handleAddEvent() {
    if (!newEvent.title.trim() || !newEvent.start_time || !newEvent.end_time) return;
    addEvent(newEvent);
    setNewEvent({
      title: "",
      description: "",
      start_time: "",
      end_time: "",
      location: "",
      meeting_link: "",
      attendees: [],
      source: "manual",
      color: "#3b82f6",
    });
    setShowForm(false);
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">Calendar</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentDate(new Date(year, month - 1))}
              className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="text-sm font-medium min-w-[140px] text-center">
              {currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
            </span>
            <button
              onClick={() => setCurrentDate(new Date(year, month + 1))}
              className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={16} />
          Add Event
        </button>
      </div>

      {/* Add Event Form */}
      {showForm && (
        <div className="glass-card p-5 mb-6">
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Event title..."
              value={newEvent.title}
              onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
              className="col-span-2 bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-blue-500"
              autoFocus
            />
            <div>
              <label className="text-xs text-zinc-500 mb-1 block">Start</label>
              <input
                type="datetime-local"
                value={newEvent.start_time}
                onChange={(e) => setNewEvent({ ...newEvent, start_time: e.target.value })}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-500 mb-1 block">End</label>
              <input
                type="datetime-local"
                value={newEvent.end_time}
                onChange={(e) => setNewEvent({ ...newEvent, end_time: e.target.value })}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm outline-none"
              />
            </div>
            <input
              type="text"
              placeholder="Location"
              value={newEvent.location}
              onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
              className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm outline-none"
            />
            <input
              type="text"
              placeholder="Meeting link"
              value={newEvent.meeting_link}
              onChange={(e) => setNewEvent({ ...newEvent, meeting_link: e.target.value })}
              className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm outline-none"
            />
          </div>
          <div className="flex gap-2 justify-end mt-3">
            <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-zinc-400 hover:text-white">
              Cancel
            </button>
            <button onClick={handleAddEvent} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium">
              Add Event
            </button>
          </div>
        </div>
      )}

      {/* Calendar Grid */}
      <div className="glass-card overflow-hidden">
        <div className="grid grid-cols-7">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="p-3 text-center text-xs font-medium text-zinc-500 border-b border-zinc-800">
              {day}
            </div>
          ))}
          {days.map((day, i) => {
            const dateStr = day
              ? `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
              : "";
            const dayEvents = day ? getEventsForDay(day) : [];
            const dayTasks = day ? getTasksForDay(day) : [];
            const isToday = dateStr === today;

            return (
              <div
                key={i}
                className={cn(
                  "min-h-[100px] p-2 border-b border-r border-zinc-800/50",
                  !day && "bg-zinc-900/30"
                )}
              >
                {day && (
                  <>
                    <span
                      className={cn(
                        "text-sm inline-flex items-center justify-center w-7 h-7 rounded-full",
                        isToday && "bg-blue-600 text-white font-bold"
                      )}
                    >
                      {day}
                    </span>
                    <div className="mt-1 space-y-1">
                      {dayEvents.map((event) => (
                        <div
                          key={event.id}
                          className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 truncate"
                        >
                          {event.title}
                        </div>
                      ))}
                      {dayTasks.map((task) => (
                        <div
                          key={task.id}
                          className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-300 truncate"
                        >
                          {task.title}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
