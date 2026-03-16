"use client";

import { useState } from "react";
import { Plus, Filter, CheckCircle2, Circle, Clock, Trash2 } from "lucide-react";
import { useStore } from "@/store/useStore";
import type { Priority, TaskStatus } from "@/types";
import { cn } from "@/lib/utils";

export default function TasksPage() {
  const { tasks, addTask, updateTask, deleteTask, completeTask } = useStore();
  const [showForm, setShowForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState<TaskStatus | "all">("all");
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    priority: "medium" as Priority,
    due_date: new Date().toISOString().split("T")[0],
    project: "",
    tags: [] as string[],
  });

  const filteredTasks =
    filterStatus === "all"
      ? tasks
      : tasks.filter((t) => t.status === filterStatus);

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  function handleAddTask() {
    if (!newTask.title.trim()) return;
    addTask({
      ...newTask,
      status: "todo",
      tags: newTask.tags,
      auto_reschedule: true,
      source: "manual",
    });
    setNewTask({
      title: "",
      description: "",
      priority: "medium",
      due_date: new Date().toISOString().split("T")[0],
      project: "",
      tags: [],
    });
    setShowForm(false);
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Tasks</h1>
          <p className="text-sm text-zinc-400 mt-1">
            {tasks.filter((t) => t.status !== "done").length} open tasks
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={16} />
          Add Task
        </button>
      </div>

      {/* Add Task Form */}
      {showForm && (
        <div className="glass-card p-5 mb-6">
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Task title..."
              value={newTask.title}
              onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
              onKeyDown={(e) => e.key === "Enter" && handleAddTask()}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-blue-500"
              autoFocus
            />
            <textarea
              placeholder="Description (optional)"
              value={newTask.description}
              onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-blue-500 resize-none"
              rows={2}
            />
            <div className="flex gap-3">
              <select
                value={newTask.priority}
                onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as Priority })}
                className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm outline-none"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
              <input
                type="date"
                value={newTask.due_date}
                onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm outline-none"
              />
              <input
                type="text"
                placeholder="Project"
                value={newTask.project}
                onChange={(e) => setNewTask({ ...newTask, project: e.target.value })}
                className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm outline-none flex-1"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddTask}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors"
              >
                Add Task
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 mb-4">
        {(["all", "todo", "in_progress", "done", "cancelled"] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
              filterStatus === status
                ? "bg-blue-600/20 text-blue-400 border border-blue-600/30"
                : "text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800"
            )}
          >
            {status === "all" ? "All" : status.replace("_", " ")}
          </button>
        ))}
      </div>

      {/* Task List */}
      <div className="space-y-2">
        {sortedTasks.length === 0 ? (
          <div className="glass-card p-8 text-center">
            <p className="text-zinc-500">No tasks yet. Create your first task!</p>
          </div>
        ) : (
          sortedTasks.map((task) => (
            <div
              key={task.id}
              className={cn(
                "glass-card p-4 flex items-center gap-4 group",
                task.status === "done" && "opacity-50"
              )}
            >
              <button
                onClick={() =>
                  task.status === "done"
                    ? updateTask(task.id, { status: "todo", completed_at: undefined })
                    : completeTask(task.id)
                }
                className="shrink-0"
              >
                {task.status === "done" ? (
                  <CheckCircle2 size={20} className="text-green-500" />
                ) : (
                  <Circle size={20} className="text-zinc-600 hover:text-blue-400 transition-colors" />
                )}
              </button>

              <div className="flex-1 min-w-0">
                <p
                  className={cn(
                    "text-sm font-medium truncate",
                    task.status === "done" && "line-through text-zinc-500"
                  )}
                >
                  {task.title}
                </p>
                {task.description && (
                  <p className="text-xs text-zinc-500 mt-0.5 truncate">{task.description}</p>
                )}
                <div className="flex gap-2 mt-1">
                  {task.project && (
                    <span className="text-[10px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded">
                      {task.project}
                    </span>
                  )}
                  {task.source !== "manual" && task.source && (
                    <span className="text-[10px] bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded">
                      {task.source}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className={`w-2 h-2 rounded-full ${getPriorityColor(task.priority)}`} />
                {task.due_date && (
                  <span
                    className={cn(
                      "text-xs",
                      task.due_date < new Date().toISOString().split("T")[0] && task.status !== "done"
                        ? "text-red-400"
                        : "text-zinc-500"
                    )}
                  >
                    {task.due_date}
                  </span>
                )}
                <select
                  value={task.status}
                  onChange={(e) => updateTask(task.id, { status: e.target.value as TaskStatus })}
                  className="bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs outline-none opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <option value="todo">To Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="done">Done</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <button
                  onClick={() => deleteTask(task.id)}
                  className="text-zinc-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
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
