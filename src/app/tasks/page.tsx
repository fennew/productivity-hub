"use client";

import { useState } from "react";
import {
  Plus,
  CheckCircle2,
  Circle,
  Trash2,
  FolderPlus,
  Folder,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Pencil,
  X,
  LayoutGrid,
  List,
  Calendar,
} from "lucide-react";
import { useStore } from "@/store/useStore";
import type { Priority, TaskStatus } from "@/types";
import { cn } from "@/lib/utils";

const PROJECT_COLORS = [
  "#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981",
  "#06b6d4", "#f97316", "#ef4444", "#6366f1", "#14b8a6",
];

function formatDate(dateStr: string) {
  const date = new Date(dateStr + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.getTime() === today.getTime()) return "Today";
  if (date.getTime() === tomorrow.getTime()) return "Tomorrow";
  if (date.getTime() === yesterday.getTime()) return "Yesterday";

  return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function addDays(dateStr: string, days: number) {
  const date = new Date(dateStr + "T00:00:00");
  date.setDate(date.getDate() + days);
  return date.toISOString().split("T")[0];
}

export default function TasksPage() {
  const { tasks, projects, addTask, updateTask, deleteTask, completeTask, addProject, updateProject, deleteProject } = useStore();
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showBulkForm, setShowBulkForm] = useState(false);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState<TaskStatus | "all">("all");
  const [filterProject, setFilterProject] = useState<string | "all">("all");
  const [viewMode, setViewMode] = useState<"list" | "projects" | "date">("list");
  const [collapsedProjects, setCollapsedProjects] = useState<Set<string>>(new Set());
  const [editingProject, setEditingProject] = useState<string | null>(null);
  const [editProjectName, setEditProjectName] = useState("");
  const [bulkText, setBulkText] = useState("");
  const [bulkProject, setBulkProject] = useState("");
  const [bulkPriority, setBulkPriority] = useState<Priority>("medium");
  const [bulkDate, setBulkDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);

  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    priority: "medium" as Priority,
    due_date: new Date().toISOString().split("T")[0],
    project: "",
    tags: [] as string[],
  });

  const [newProject, setNewProject] = useState({
    name: "",
    description: "",
    color: PROJECT_COLORS[0],
  });

  const todayStr = new Date().toISOString().split("T")[0];

  // Filtering
  const filteredTasks = tasks.filter((t) => {
    if (filterStatus !== "all" && t.status !== filterStatus) return false;
    if (filterProject !== "all" && (t.project || "") !== filterProject) return false;
    if (viewMode === "date" && t.due_date !== selectedDate) return false;
    return true;
  });

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  // Group tasks by project for project view
  const tasksByProject = new Map<string, typeof tasks>();
  sortedTasks.forEach((task) => {
    const key = task.project || "__no_project__";
    if (!tasksByProject.has(key)) tasksByProject.set(key, []);
    tasksByProject.get(key)!.push(task);
  });

  // Date view: nearby dates with task counts
  const dateRange: string[] = [];
  for (let i = -3; i <= 7; i++) {
    dateRange.push(addDays(selectedDate, i));
  }

  function handleAddTask() {
    if (!newTask.title.trim()) return;
    addTask({
      ...newTask,
      due_date: viewMode === "date" ? selectedDate : newTask.due_date,
      status: "todo",
      tags: newTask.tags,
      auto_reschedule: true,
      source: "manual",
    });
    setNewTask({
      title: "",
      description: "",
      priority: "medium",
      due_date: viewMode === "date" ? selectedDate : new Date().toISOString().split("T")[0],
      project: "",
      tags: [],
    });
    setShowTaskForm(false);
  }

  function handleBulkAdd() {
    const lines = bulkText.split("\n").map((l) => l.trim()).filter((l) => l.length > 0);
    if (lines.length === 0) return;
    const dateToUse = viewMode === "date" ? selectedDate : bulkDate;
    lines.forEach((line) => {
      // Remove leading bullet points, dashes, numbers
      const title = line.replace(/^[\-\*\u2022\d+\.\)]\s*/, "").trim();
      if (!title) return;
      addTask({
        title,
        status: "todo",
        priority: bulkPriority,
        due_date: dateToUse,
        project: bulkProject || undefined,
        tags: [],
        auto_reschedule: true,
        source: "manual",
      });
    });
    setBulkText("");
    setShowBulkForm(false);
  }

  function handleAddProject() {
    if (!newProject.name.trim()) return;
    addProject({
      name: newProject.name.trim(),
      description: newProject.description,
      color: newProject.color,
      status: "active",
    });
    setNewProject({ name: "", description: "", color: PROJECT_COLORS[Math.floor(Math.random() * PROJECT_COLORS.length)] });
    setShowProjectForm(false);
  }

  function toggleProjectCollapse(projectName: string) {
    setCollapsedProjects((prev) => {
      const next = new Set(prev);
      if (next.has(projectName)) next.delete(projectName);
      else next.add(projectName);
      return next;
    });
  }

  function getProjectColor(projectName: string): string {
    const project = projects.find((p) => p.name === projectName);
    return project?.color || "#71717a";
  }

  function getProjectTaskCount(projectName: string) {
    return tasks.filter((t) => t.project === projectName && t.status !== "done" && t.status !== "cancelled").length;
  }

  function getDateTaskCount(date: string) {
    return tasks.filter((t) => t.due_date === date && t.status !== "done" && t.status !== "cancelled").length;
  }

  return (
    <div className="max-w-5xl mx-auto w-full overflow-hidden">
      {/* Header */}
      <div className="mb-4 md:mb-6">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-xl md:text-2xl font-bold">Tasks</h1>
            <p className="text-xs md:text-sm text-zinc-400 mt-0.5">
              {tasks.filter((t) => t.status !== "done" && t.status !== "cancelled").length} open
              {" \u00b7 "}
              {projects.filter((p) => p.status === "active").length} projects
            </p>
          </div>
          <button
            onClick={() => { setShowTaskForm(!showTaskForm); setShowProjectForm(false); setShowBulkForm(false); }}
            className="flex items-center gap-1.5 px-3 md:px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">Add Task</span>
          </button>
        </div>
        {/* Action bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {/* View mode toggles */}
          <div className="flex bg-zinc-800 rounded-lg overflow-hidden shrink-0">
            <button
              onClick={() => setViewMode("list")}
              className={cn("p-2 transition-colors", viewMode === "list" ? "bg-zinc-700 text-white" : "text-zinc-400 hover:text-white")}
              title="List view"
            >
              <List size={16} />
            </button>
            <button
              onClick={() => setViewMode("projects")}
              className={cn("p-2 transition-colors", viewMode === "projects" ? "bg-zinc-700 text-white" : "text-zinc-400 hover:text-white")}
              title="Group by project"
            >
              <LayoutGrid size={16} />
            </button>
            <button
              onClick={() => setViewMode("date")}
              className={cn("p-2 transition-colors", viewMode === "date" ? "bg-zinc-700 text-white" : "text-zinc-400 hover:text-white")}
              title="Date view"
            >
              <Calendar size={16} />
            </button>
          </div>
          <button
            onClick={() => { setShowProjectForm(!showProjectForm); setShowTaskForm(false); }}
            className="flex items-center gap-1.5 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-xs md:text-sm font-medium transition-colors whitespace-nowrap shrink-0"
          >
            <FolderPlus size={14} />
            <span className="hidden sm:inline">New</span> Project
          </button>
          <button
            onClick={() => { setShowBulkForm(!showBulkForm); setShowTaskForm(false); setShowProjectForm(false); }}
            className="flex items-center gap-1.5 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-xs md:text-sm font-medium transition-colors whitespace-nowrap shrink-0"
          >
            <List size={14} />
            Bulk Add
          </button>
        </div>
      </div>

      {/* Date Navigation (Date View) */}
      {viewMode === "date" && (
        <div className="glass-card p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => setSelectedDate(addDays(selectedDate, -1))}
              className="p-1.5 hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            <div className="text-center">
              <h2 className="text-lg font-semibold">
                {formatDate(selectedDate)}
                {selectedDate === todayStr && (
                  <span className="text-xs text-blue-400 ml-2 font-normal">
                    {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                  </span>
                )}
              </h2>
              {selectedDate !== todayStr && (
                <p className="text-xs text-zinc-500">{selectedDate}</p>
              )}
            </div>
            <button
              onClick={() => setSelectedDate(addDays(selectedDate, 1))}
              className="p-1.5 hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {dateRange.map((date) => {
              const count = getDateTaskCount(date);
              const isToday = date === todayStr;
              const isSelected = date === selectedDate;
              const dayName = new Date(date + "T00:00:00").toLocaleDateString("en-US", { weekday: "short" });
              const dayNum = new Date(date + "T00:00:00").getDate();

              return (
                <button
                  key={date}
                  onClick={() => setSelectedDate(date)}
                  className={cn(
                    "flex flex-col items-center px-3 py-2 rounded-lg text-xs transition-all min-w-[52px]",
                    isSelected
                      ? "bg-blue-600 text-white"
                      : isToday
                      ? "bg-zinc-800 text-white ring-1 ring-blue-500/50"
                      : "bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-white"
                  )}
                >
                  <span className="text-[10px] uppercase">{dayName}</span>
                  <span className="text-base font-semibold">{dayNum}</span>
                  {count > 0 && (
                    <span className={cn(
                      "text-[9px] mt-0.5 px-1.5 rounded-full",
                      isSelected ? "bg-blue-500" : "bg-zinc-700"
                    )}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          {selectedDate !== todayStr && (
            <button
              onClick={() => setSelectedDate(todayStr)}
              className="mt-2 text-xs text-blue-400 hover:text-blue-300 transition-colors"
            >
              Jump to today
            </button>
          )}
        </div>
      )}

      {/* Bulk Add Form */}
      {showBulkForm && (
        <div className="glass-card p-5 mb-6">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <List size={16} className="text-blue-400" />
            Bulk Add Tasks
            <span className="text-xs text-zinc-500 font-normal ml-1">Each line becomes a task</span>
          </h3>
          <div className="space-y-3">
            <textarea
              placeholder={"Buy groceries\nCall dentist\nFinish report\nClean apartment\n..."}
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-sm outline-none focus:border-blue-500 resize-none font-mono"
              rows={6}
              autoFocus
            />
            <div className="space-y-2">
              <span className="text-xs text-zinc-500">
                {bulkText.split("\n").filter((l) => l.trim()).length} task{bulkText.split("\n").filter((l) => l.trim()).length !== 1 ? "s" : ""} to add
              </span>
              <div className="flex gap-2 flex-wrap">
                <select
                  value={bulkPriority}
                  onChange={(e) => setBulkPriority(e.target.value as Priority)}
                  className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-xs outline-none flex-1 min-w-[100px]"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
                {viewMode !== "date" && (
                  <input
                    type="date"
                    value={bulkDate}
                    onChange={(e) => setBulkDate(e.target.value)}
                    className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-xs outline-none flex-1 min-w-[120px]"
                  />
                )}
                <select
                  value={bulkProject}
                  onChange={(e) => setBulkProject(e.target.value)}
                  className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-xs outline-none flex-1 min-w-[100px]"
                >
                  <option value="">No project</option>
                  {projects.filter((p) => p.status === "active").map((p) => (
                    <option key={p.id} value={p.name}>{p.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowBulkForm(false)} className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors">
                Cancel
              </button>
              <button
                onClick={handleBulkAdd}
                disabled={bulkText.split("\n").filter((l) => l.trim()).length === 0}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg text-sm font-medium transition-colors"
              >
                Add {bulkText.split("\n").filter((l) => l.trim()).length} Tasks
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Project Form */}
      {showProjectForm && (
        <div className="glass-card p-5 mb-6">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <FolderPlus size={16} className="text-blue-400" />
            Create Project
          </h3>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Project name..."
              value={newProject.name}
              onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
              onKeyDown={(e) => e.key === "Enter" && handleAddProject()}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-blue-500"
              autoFocus
            />
            <input
              type="text"
              placeholder="Description (optional)"
              value={newProject.description}
              onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-blue-500"
            />
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-400">Color:</span>
              {PROJECT_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => setNewProject({ ...newProject, color })}
                  className={cn(
                    "w-6 h-6 rounded-full transition-all",
                    newProject.color === color && "ring-2 ring-white ring-offset-2 ring-offset-zinc-950"
                  )}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowProjectForm(false)} className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors">
                Cancel
              </button>
              <button onClick={handleAddProject} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors">
                Create Project
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Task Form */}
      {showTaskForm && (
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
            <div className="flex gap-2 flex-wrap">
              <select
                value={newTask.priority}
                onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as Priority })}
                className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm outline-none flex-1 min-w-[100px]"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
              {viewMode === "date" ? (
                <div className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-400">
                  {formatDate(selectedDate)} ({selectedDate})
                </div>
              ) : (
                <input
                  type="date"
                  value={newTask.due_date}
                  onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                  className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm outline-none"
                />
              )}
              <select
                value={newTask.project}
                onChange={(e) => setNewTask({ ...newTask, project: e.target.value })}
                className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm outline-none flex-1 min-w-[150px]"
              >
                <option value="">No project</option>
                {projects.filter((p) => p.status === "active").map((p) => (
                  <option key={p.id} value={p.name}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowTaskForm(false)} className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors">
                Cancel
              </button>
              <button onClick={handleAddTask} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors">
                Add Task
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Projects Bar */}
      {projects.length > 0 && viewMode !== "date" && (
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          <button
            onClick={() => setFilterProject("all")}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap",
              filterProject === "all"
                ? "bg-blue-600/20 text-blue-400 border border-blue-600/30"
                : "text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800"
            )}
          >
            All Projects
          </button>
          <button
            onClick={() => setFilterProject("")}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap",
              filterProject === ""
                ? "bg-zinc-600/20 text-zinc-300 border border-zinc-600/30"
                : "text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800"
            )}
          >
            No Project
          </button>
          {projects.filter((p) => p.status === "active").map((project) => (
            <div key={project.id} className="flex items-center gap-1 group/proj">
              <button
                onClick={() => setFilterProject(project.name)}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap",
                  filterProject === project.name
                    ? "border"
                    : "text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800"
                )}
                style={filterProject === project.name ? {
                  backgroundColor: `${project.color}20`,
                  color: project.color,
                  borderColor: `${project.color}50`,
                } : {}}
              >
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: project.color }} />
                {project.name}
                <span className="text-[10px] opacity-60">({getProjectTaskCount(project.name)})</span>
              </button>
              {editingProject === project.id ? (
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={editProjectName}
                    onChange={(e) => setEditProjectName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && editProjectName.trim()) {
                        const oldName = project.name;
                        updateProject(project.id, { name: editProjectName.trim() });
                        tasks.filter((t) => t.project === oldName).forEach((t) => updateTask(t.id, { project: editProjectName.trim() }));
                        setEditingProject(null);
                      }
                      if (e.key === "Escape") setEditingProject(null);
                    }}
                    className="bg-zinc-900 border border-zinc-600 rounded px-2 py-1 text-xs outline-none w-24"
                    autoFocus
                  />
                  <button onClick={() => setEditingProject(null)} className="text-zinc-500 hover:text-white">
                    <X size={12} />
                  </button>
                </div>
              ) : (
                <div className="opacity-0 group-hover/proj:opacity-100 flex items-center gap-0.5 transition-opacity">
                  <button
                    onClick={() => { setEditingProject(project.id); setEditProjectName(project.name); }}
                    className="text-zinc-600 hover:text-zinc-300 p-0.5"
                  >
                    <Pencil size={10} />
                  </button>
                  <button
                    onClick={() => deleteProject(project.id)}
                    className="text-zinc-600 hover:text-red-400 p-0.5"
                  >
                    <Trash2 size={10} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Status Filters */}
      <div className="flex gap-1.5 md:gap-2 mb-4 overflow-x-auto pb-1 -mx-1 px-1">
        {(["all", "todo", "in_progress", "done", "cancelled"] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={cn(
              "px-2.5 md:px-3 py-1.5 rounded-lg text-[11px] md:text-xs font-medium transition-colors whitespace-nowrap shrink-0",
              filterStatus === status
                ? "bg-blue-600/20 text-blue-400 border border-blue-600/30"
                : "text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800"
            )}
          >
            {status === "all" ? "All" : status.replace("_", " ")}
          </button>
        ))}
      </div>

      {/* Task List - Project View */}
      {viewMode === "projects" ? (
        <div className="space-y-4">
          {Array.from(tasksByProject.entries()).map(([projectKey, projectTasks]) => {
            const isNoProject = projectKey === "__no_project__";
            const projectName = isNoProject ? "No Project" : projectKey;
            const isCollapsed = collapsedProjects.has(projectKey);
            const openCount = projectTasks.filter((t) => t.status !== "done" && t.status !== "cancelled").length;

            return (
              <div key={projectKey} className="glass-card overflow-hidden">
                <button
                  onClick={() => toggleProjectCollapse(projectKey)}
                  className="w-full flex items-center gap-3 p-4 hover:bg-zinc-800/50 transition-colors"
                >
                  {isCollapsed ? <ChevronRight size={16} className="text-zinc-500" /> : <ChevronDown size={16} className="text-zinc-500" />}
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: isNoProject ? "#71717a" : getProjectColor(projectKey) }}
                  />
                  <span className="font-medium text-sm">{projectName}</span>
                  <span className="text-xs text-zinc-500 ml-auto">
                    {openCount} open \u00b7 {projectTasks.length} total
                  </span>
                </button>
                {!isCollapsed && (
                  <div className="border-t border-zinc-800">
                    {projectTasks.map((task) => (
                      <TaskRow key={task.id} task={task} projects={projects} updateTask={updateTask} deleteTask={deleteTask} completeTask={completeTask} showDate />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
          {sortedTasks.length === 0 && (
            <div className="glass-card p-8 text-center">
              <p className="text-zinc-500">No tasks yet. Create your first task!</p>
            </div>
          )}
        </div>
      ) : (
        /* Task List - Flat / Date View */
        <div className="space-y-2">
          {sortedTasks.length === 0 ? (
            <div className="glass-card p-8 text-center">
              <p className="text-zinc-500">
                {viewMode === "date"
                  ? `No tasks for ${formatDate(selectedDate)}. Add one!`
                  : "No tasks yet. Create your first task!"}
              </p>
            </div>
          ) : (
            sortedTasks.map((task) => (
              <TaskRow key={task.id} task={task} projects={projects} updateTask={updateTask} deleteTask={deleteTask} completeTask={completeTask} showDate={viewMode !== "date"} />
            ))
          )}
        </div>
      )}
    </div>
  );
}

function TaskRow({
  task,
  projects,
  updateTask,
  deleteTask,
  completeTask,
  showDate = true,
}: {
  task: ReturnType<typeof useStore.getState>["tasks"][0];
  projects: ReturnType<typeof useStore.getState>["projects"];
  updateTask: ReturnType<typeof useStore.getState>["updateTask"];
  deleteTask: ReturnType<typeof useStore.getState>["deleteTask"];
  completeTask: ReturnType<typeof useStore.getState>["completeTask"];
  showDate?: boolean;
}) {
  const projectColor = task.project
    ? projects.find((p) => p.name === task.project)?.color || "#71717a"
    : null;
  const todayStr = new Date().toISOString().split("T")[0];

  return (
    <div
      className={cn(
        "glass-card p-3 md:p-4 flex items-start md:items-center gap-3 md:gap-4 group",
        task.status === "done" && "opacity-50"
      )}
    >
      <button
        onClick={() =>
          task.status === "done"
            ? updateTask(task.id, { status: "todo", completed_at: undefined })
            : completeTask(task.id)
        }
        className="shrink-0 mt-0.5 md:mt-0"
      >
        {task.status === "done" ? (
          <CheckCircle2 size={20} className="text-green-500" />
        ) : (
          <Circle size={20} className="text-zinc-600 hover:text-blue-400 transition-colors" />
        )}
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={cn("text-sm font-medium", task.status === "done" && "line-through text-zinc-500")}>
            {task.title}
          </p>
          {/* Mobile: always show delete, Desktop: show on hover */}
          <button
            onClick={() => deleteTask(task.id)}
            className="text-zinc-600 hover:text-red-400 transition-colors md:opacity-0 md:group-hover:opacity-100 shrink-0"
          >
            <Trash2 size={14} />
          </button>
        </div>
        {task.description && (
          <p className="text-xs text-zinc-500 mt-0.5 truncate">{task.description}</p>
        )}
        <div className="flex gap-1.5 md:gap-2 mt-1.5 flex-wrap items-center">
          <div className={`w-2 h-2 rounded-full shrink-0 ${getPriorityColor(task.priority)}`} />
          {showDate && task.due_date && (
            <span
              className={cn(
                "text-[11px]",
                task.due_date < todayStr && task.status !== "done"
                  ? "text-red-400"
                  : task.due_date === todayStr
                  ? "text-blue-400"
                  : "text-zinc-500"
              )}
          >
            {task.due_date === todayStr ? "Today" : task.due_date}
          </span>
        )}
          {task.project && (
            <span
              className="text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1"
              style={{
                backgroundColor: `${projectColor}20`,
                color: projectColor || undefined,
              }}
            >
              <Folder size={8} />
              {task.project}
            </span>
          )}
          {task.source !== "manual" && task.source && (
            <span className="text-[10px] bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded">
              {task.source}
            </span>
          )}
          {task.tags?.includes("ai-created") && (
            <span className="text-[10px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded">
              AI
            </span>
          )}
        </div>
        {/* Controls row - visible on mobile, hover on desktop */}
        <div className="flex gap-2 mt-2 md:mt-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
          <select
            value={task.project || ""}
            onChange={(e) => updateTask(task.id, { project: e.target.value || undefined })}
            className="bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-[11px] md:text-xs outline-none max-w-[120px]"
          >
            <option value="">No project</option>
            {projects.filter((p) => p.status === "active").map((p) => (
              <option key={p.id} value={p.name}>{p.name}</option>
            ))}
          </select>
          <select
            value={task.status}
            onChange={(e) => updateTask(task.id, { status: e.target.value as TaskStatus })}
            className="bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-[11px] md:text-xs outline-none"
          >
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="done">Done</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
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
