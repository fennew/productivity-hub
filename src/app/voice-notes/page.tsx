"use client";

import { useState, useRef } from "react";
import { Mic, MicOff, Loader2, FileText, CheckSquare, Pencil, Trash2, Plus, ArrowRight } from "lucide-react";
import { useStore } from "@/store/useStore";
import { cn } from "@/lib/utils";

export default function VoiceNotesPage() {
  const { voiceNotes, addVoiceNote, deleteVoiceNote, addTask } = useStore();
  const [recording, setRecording] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Pending review state: after AI processes, show tasks for review before adding
  const [pendingReview, setPendingReview] = useState<{
    summary: string;
    transcript: string;
    tasks: string[];
  } | null>(null);
  const [editingTaskIndex, setEditingTaskIndex] = useState<number | null>(null);
  const [editingTaskValue, setEditingTaskValue] = useState("");

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        await processInput(transcript || "Voice note recorded - transcription pending");
      };

      mediaRecorder.start();
      setRecording(true);
    } catch {
      alert("Microphone access denied. Please allow microphone access.");
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  }

  async function processInput(text: string) {
    setProcessing(true);
    try {
      const response = await fetch("/api/voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: text }),
      });
      const data = await response.json();

      // Show review screen instead of immediately creating tasks
      setPendingReview({
        summary: data.summary || text,
        transcript: text,
        tasks: data.tasks || [],
      });
      setTranscript("");
    } catch {
      setPendingReview({
        summary: text,
        transcript: text,
        tasks: [],
      });
    } finally {
      setProcessing(false);
    }
  }

  function handleTextSubmit() {
    if (!transcript.trim() || processing) return;
    processInput(transcript.trim());
  }

  function confirmAndAddTasks() {
    if (!pendingReview) return;

    // Save voice note
    addVoiceNote({
      transcript: pendingReview.transcript,
      summary: pendingReview.summary,
      extracted_tasks: pendingReview.tasks,
      duration_seconds: 0,
      processed: true,
    });

    // Create tasks in the global task store (visible in /tasks)
    for (const taskTitle of pendingReview.tasks) {
      addTask({
        title: taskTitle,
        status: "todo",
        priority: "medium",
        tags: ["voice-note"],
        auto_reschedule: true,
        source: "voice",
      });
    }

    setPendingReview(null);
  }

  function removeTaskFromPending(index: number) {
    if (!pendingReview) return;
    setPendingReview({
      ...pendingReview,
      tasks: pendingReview.tasks.filter((_, i) => i !== index),
    });
  }

  function startEditTask(index: number) {
    if (!pendingReview) return;
    setEditingTaskIndex(index);
    setEditingTaskValue(pendingReview.tasks[index]);
  }

  function saveEditTask() {
    if (!pendingReview || editingTaskIndex === null) return;
    const newTasks = [...pendingReview.tasks];
    if (editingTaskValue.trim()) {
      newTasks[editingTaskIndex] = editingTaskValue.trim();
    } else {
      newTasks.splice(editingTaskIndex, 1);
    }
    setPendingReview({ ...pendingReview, tasks: newTasks });
    setEditingTaskIndex(null);
    setEditingTaskValue("");
  }

  function addManualTask() {
    if (!pendingReview) return;
    setPendingReview({
      ...pendingReview,
      tasks: [...pendingReview.tasks, ""],
    });
    setEditingTaskIndex(pendingReview.tasks.length);
    setEditingTaskValue("");
  }

  function discardReview() {
    if (pendingReview) {
      addVoiceNote({
        transcript: pendingReview.transcript,
        summary: pendingReview.summary,
        extracted_tasks: [],
        duration_seconds: 0,
        processed: true,
      });
    }
    setPendingReview(null);
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Voice Notes</h1>

      {/* Pending Review Panel */}
      {pendingReview && (
        <div className="glass-card p-6 mb-6 border-blue-600/30">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <CheckSquare size={18} className="text-blue-400" />
            Review AI-Extracted Tasks
          </h3>

          <div className="bg-zinc-900 rounded-lg p-3 mb-4">
            <p className="text-xs text-zinc-500 mb-1">Summary</p>
            <p className="text-sm">{pendingReview.summary}</p>
          </div>

          <div className="space-y-2 mb-4">
            <p className="text-xs text-zinc-500">
              Tasks to create ({pendingReview.tasks.length}) — edit, remove, or add before confirming:
            </p>
            {pendingReview.tasks.length === 0 && (
              <p className="text-sm text-zinc-600 italic">No tasks extracted. You can add manually below.</p>
            )}
            {pendingReview.tasks.map((task, i) => (
              <div key={i} className="flex items-center gap-2 bg-zinc-900 rounded-lg px-3 py-2">
                {editingTaskIndex === i ? (
                  <input
                    type="text"
                    value={editingTaskValue}
                    onChange={(e) => setEditingTaskValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveEditTask();
                      if (e.key === "Escape") { setEditingTaskIndex(null); setEditingTaskValue(""); }
                    }}
                    onBlur={saveEditTask}
                    className="flex-1 bg-zinc-800 border border-blue-500 rounded px-2 py-1 text-sm outline-none"
                    autoFocus
                  />
                ) : (
                  <>
                    <CheckSquare size={14} className="text-blue-400 shrink-0" />
                    <span className="text-sm flex-1">{task}</span>
                    <button
                      onClick={() => startEditTask(i)}
                      className="text-zinc-500 hover:text-blue-400 transition-colors p-1"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() => removeTaskFromPending(i)}
                      className="text-zinc-500 hover:text-red-400 transition-colors p-1"
                    >
                      <Trash2 size={13} />
                    </button>
                  </>
                )}
              </div>
            ))}
            <button
              onClick={addManualTask}
              className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors py-1"
            >
              <Plus size={12} />
              Add task manually
            </button>
          </div>

          <div className="flex gap-2 justify-end">
            <button
              onClick={discardReview}
              className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors"
            >
              Save note only (skip tasks)
            </button>
            <button
              onClick={confirmAndAddTasks}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors"
            >
              Confirm &amp; Add {pendingReview.tasks.length} Task{pendingReview.tasks.length !== 1 ? "s" : ""}
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Recording Area */}
      {!pendingReview && (
        <div className="glass-card p-8 text-center mb-6">
          <button
            onClick={recording ? stopRecording : startRecording}
            disabled={processing}
            className={cn(
              "w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 transition-all",
              recording ? "bg-red-600 animate-pulse" : "bg-blue-600 hover:bg-blue-700",
              processing && "opacity-50 cursor-not-allowed"
            )}
          >
            {processing ? (
              <Loader2 size={32} className="animate-spin" />
            ) : recording ? (
              <MicOff size={32} />
            ) : (
              <Mic size={32} />
            )}
          </button>
          <p className="text-sm text-zinc-400 mb-4">
            {recording ? "Recording... Click to stop" : processing ? "Processing with AI..." : "Click to start recording"}
          </p>

          <div className="max-w-lg mx-auto">
            <p className="text-xs text-zinc-600 mb-2">Or type/paste your note:</p>
            <textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="Type your thoughts here and AI will extract tasks from it..."
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-sm outline-none focus:border-blue-500 resize-none"
              rows={3}
            />
            <button
              onClick={handleTextSubmit}
              disabled={!transcript.trim() || processing}
              className="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg text-sm font-medium transition-colors"
            >
              Process with AI
            </button>
          </div>
        </div>
      )}

      {/* Voice Notes List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-semibold">Past Notes</h2>
          <span className="text-xs text-zinc-500">{voiceNotes.length} notes</span>
        </div>
        {voiceNotes.length === 0 ? (
          <div className="glass-card p-8 text-center text-zinc-500">
            No voice notes yet. Record or type your first note!
          </div>
        ) : (
          [...voiceNotes].reverse().map((note) => (
            <div key={note.id} className="glass-card p-5 group">
              <div className="flex items-start gap-3">
                <FileText size={18} className="text-blue-400 mt-0.5 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium mb-1">{note.summary}</p>
                  {note.summary !== note.transcript && (
                    <p className="text-xs text-zinc-500 mb-2">{note.transcript}</p>
                  )}
                  {note.extracted_tasks.length > 0 && (
                    <div className="mt-2 space-y-1">
                      <p className="text-xs text-zinc-500 flex items-center gap-1">
                        <CheckSquare size={12} />
                        Tasks created ({note.extracted_tasks.length}):
                      </p>
                      {note.extracted_tasks.map((task, i) => (
                        <div key={i} className="text-xs bg-zinc-900 rounded px-2 py-1 text-zinc-300 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                          {task}
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="text-[10px] text-zinc-600 mt-2">{new Date(note.created_at).toLocaleString()}</p>
                </div>
                <button
                  onClick={() => deleteVoiceNote(note.id)}
                  className="text-zinc-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 p-1"
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
