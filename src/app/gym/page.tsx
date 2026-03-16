"use client";

import { useState } from "react";
import { Plus, Dumbbell, Clock, Trash2, Pencil, X } from "lucide-react";
import { useStore } from "@/store/useStore";
import type { Exercise, ExerciseSet, Workout } from "@/types";

export default function GymPage() {
  const { workouts, addWorkout, updateWorkout, deleteWorkout } = useStore();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    type: "Strength",
    duration_minutes: 60,
    exercises: [] as Exercise[],
    notes: "",
  });
  const [currentExercise, setCurrentExercise] = useState({ name: "", sets: [{ reps: 0, weight: 0 }] as ExerciseSet[] });

  function resetForm() {
    setFormData({ date: new Date().toISOString().split("T")[0], type: "Strength", duration_minutes: 60, exercises: [], notes: "" });
    setCurrentExercise({ name: "", sets: [{ reps: 0, weight: 0 }] });
    setEditingId(null);
    setShowForm(false);
  }

  function startEdit(workout: Workout) {
    setFormData({
      date: workout.date,
      type: workout.type,
      duration_minutes: workout.duration_minutes,
      exercises: workout.exercises,
      notes: workout.notes || "",
    });
    setEditingId(workout.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function addExercise() {
    if (!currentExercise.name.trim()) return;
    setFormData({ ...formData, exercises: [...formData.exercises, { ...currentExercise }] });
    setCurrentExercise({ name: "", sets: [{ reps: 0, weight: 0 }] });
  }

  function addSet() {
    setCurrentExercise({ ...currentExercise, sets: [...currentExercise.sets, { reps: 0, weight: 0 }] });
  }

  function handleSave() {
    if (editingId) {
      updateWorkout(editingId, formData);
    } else {
      addWorkout(formData);
    }
    resetForm();
  }

  function handleDelete(id: string) {
    if (confirm("Delete this workout?")) {
      deleteWorkout(id);
    }
  }

  const sortedWorkouts = [...workouts].sort((a, b) => b.date.localeCompare(a.date));
  const thisWeek = workouts.filter((w) => {
    const d = new Date(w.date);
    const now = new Date();
    return now.getTime() - d.getTime() < 7 * 86400000;
  });
  const thisMonth = workouts.filter((w) => w.date.startsWith(new Date().toISOString().substring(0, 7)));
  const totalMinutes = workouts.reduce((s, w) => s + w.duration_minutes, 0);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Gym Tracker</h1>
          <p className="text-sm text-zinc-400 mt-1">{workouts.length} total workouts · {Math.floor(totalMinutes / 60)}h {totalMinutes % 60}m total</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={16} />
          Log Workout
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="glass-card p-5">
          <p className="text-xs text-zinc-500 uppercase">This Week</p>
          <p className="text-2xl font-bold mt-1">{thisWeek.length}</p>
          <p className="text-xs text-zinc-500 mt-1">{thisWeek.reduce((s, w) => s + w.duration_minutes, 0)} min total</p>
        </div>
        <div className="glass-card p-5">
          <p className="text-xs text-zinc-500 uppercase">This Month</p>
          <p className="text-2xl font-bold mt-1">{thisMonth.length}</p>
          <p className="text-xs text-zinc-500 mt-1">{thisMonth.reduce((s, w) => s + w.duration_minutes, 0)} min total</p>
        </div>
        <div className="glass-card p-5">
          <p className="text-xs text-zinc-500 uppercase">Avg Duration</p>
          <p className="text-2xl font-bold mt-1">
            {workouts.length > 0 ? Math.round(totalMinutes / workouts.length) : 0}
          </p>
          <p className="text-xs text-zinc-500 mt-1">minutes</p>
        </div>
      </div>

      {/* Workout Form (Add / Edit) */}
      {showForm && (
        <div className="glass-card p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">{editingId ? "Edit Workout" : "Log Workout"}</h3>
            <button onClick={resetForm} className="text-zinc-500 hover:text-white"><X size={16} /></button>
          </div>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm outline-none"
            />
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm outline-none"
            >
              <option>Strength</option>
              <option>Cardio</option>
              <option>HIIT</option>
              <option>Yoga</option>
              <option>Calisthenics</option>
              <option>Other</option>
            </select>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={formData.duration_minutes}
                onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) || 0 })}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm outline-none"
              />
              <span className="text-xs text-zinc-500 shrink-0">min</span>
            </div>
          </div>

          {/* Existing exercises in form */}
          {formData.exercises.length > 0 && (
            <div className="space-y-1 mb-3">
              {formData.exercises.map((ex, i) => (
                <div key={i} className="flex items-center gap-2 text-sm bg-zinc-900 rounded px-3 py-2">
                  <Dumbbell size={14} className="text-orange-400" />
                  <span>{ex.name}</span>
                  <span className="text-xs text-zinc-500">
                    {ex.sets.map((s) => `${s.reps}×${s.weight}kg`).join(", ")}
                  </span>
                  <button
                    onClick={() => setFormData({ ...formData, exercises: formData.exercises.filter((_, j) => j !== i) })}
                    className="ml-auto text-zinc-600 hover:text-red-400"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add Exercise */}
          <div className="border border-zinc-800 rounded-lg p-3 mb-3">
            <input
              type="text"
              placeholder="Exercise name"
              value={currentExercise.name}
              onChange={(e) => setCurrentExercise({ ...currentExercise, name: e.target.value })}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm outline-none mb-2"
            />
            {currentExercise.sets.map((set, i) => (
              <div key={i} className="flex gap-2 mb-1 items-center">
                <span className="text-xs text-zinc-500 w-12">Set {i + 1}</span>
                <input
                  type="number"
                  placeholder="Reps"
                  value={set.reps || ""}
                  onChange={(e) => {
                    const sets = [...currentExercise.sets];
                    sets[i] = { ...sets[i], reps: parseInt(e.target.value) || 0 };
                    setCurrentExercise({ ...currentExercise, sets });
                  }}
                  className="w-20 bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-sm outline-none"
                />
                <input
                  type="number"
                  placeholder="kg"
                  value={set.weight || ""}
                  onChange={(e) => {
                    const sets = [...currentExercise.sets];
                    sets[i] = { ...sets[i], weight: parseFloat(e.target.value) || 0 };
                    setCurrentExercise({ ...currentExercise, sets });
                  }}
                  className="w-20 bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-sm outline-none"
                />
                {currentExercise.sets.length > 1 && (
                  <button
                    onClick={() => setCurrentExercise({ ...currentExercise, sets: currentExercise.sets.filter((_, j) => j !== i) })}
                    className="text-zinc-600 hover:text-red-400"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            ))}
            <div className="flex gap-2 mt-2">
              <button onClick={addSet} className="text-xs text-zinc-400 hover:text-white">+ Add Set</button>
              <button onClick={addExercise} className="text-xs text-blue-400 hover:text-blue-300 ml-auto">Add Exercise</button>
            </div>
          </div>

          <textarea
            placeholder="Notes (optional)"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm outline-none resize-none mb-3"
            rows={2}
          />

          <div className="flex gap-2 justify-end">
            <button onClick={resetForm} className="px-4 py-2 text-sm text-zinc-400 hover:text-white">Cancel</button>
            <button onClick={handleSave} className="px-4 py-2 bg-orange-600 hover:bg-orange-700 rounded-lg text-sm font-medium">
              {editingId ? "Update Workout" : "Save Workout"}
            </button>
          </div>
        </div>
      )}

      {/* Workout History */}
      <div className="space-y-3">
        {sortedWorkouts.length === 0 ? (
          <div className="glass-card p-8 text-center text-zinc-500">No workouts logged yet</div>
        ) : (
          sortedWorkouts.map((workout) => (
            <div key={workout.id} className="glass-card p-5 group">
              <div className="flex items-center gap-3 mb-3">
                <Dumbbell size={18} className="text-orange-400" />
                <div>
                  <span className="font-medium">{workout.type}</span>
                  <span className="text-xs text-zinc-500 ml-2">{workout.date}</span>
                </div>
                <div className="flex items-center gap-1 ml-auto text-xs text-zinc-400">
                  <Clock size={12} />
                  {Math.floor(workout.duration_minutes / 60) > 0 && `${Math.floor(workout.duration_minutes / 60)}h `}
                  {workout.duration_minutes % 60}min
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => startEdit(workout)}
                    className="p-1.5 text-zinc-500 hover:text-blue-400 transition-colors"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(workout.id)}
                    className="p-1.5 text-zinc-500 hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              {workout.exercises.length > 0 && (
                <div className="space-y-1">
                  {workout.exercises.map((ex, i) => (
                    <div key={i} className="text-sm text-zinc-400 flex gap-2">
                      <span className="text-zinc-300">{ex.name}</span>
                      <span className="text-zinc-600">
                        {ex.sets.map((s) => `${s.reps}×${s.weight}kg`).join(", ")}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              {workout.notes && (
                <p className="text-xs text-zinc-500 mt-2">{workout.notes}</p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
