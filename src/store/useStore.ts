import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  Task,
  CalendarEvent,
  Habit,
  HabitLog,
  Transaction,
  Workout,
  VoiceNote,
  ChatMessage,
  ChatConversation,
} from "@/types";
import { generateId } from "@/lib/utils";

interface AppState {
  // Tasks
  tasks: Task[];
  addTask: (task: Omit<Task, "id" | "created_at" | "updated_at">) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  completeTask: (id: string) => void;

  // Calendar
  events: CalendarEvent[];
  addEvent: (event: Omit<CalendarEvent, "id" | "created_at">) => void;
  updateEvent: (id: string, updates: Partial<CalendarEvent>) => void;
  deleteEvent: (id: string) => void;
  setEvents: (events: CalendarEvent[]) => void;

  // Habits
  habits: Habit[];
  habitLogs: HabitLog[];
  addHabit: (habit: Omit<Habit, "id" | "created_at">) => void;
  logHabit: (habitId: string, date: string) => void;

  // Finances
  transactions: Transaction[];
  addTransaction: (tx: Omit<Transaction, "id" | "created_at">) => void;

  // Gym
  workouts: Workout[];
  addWorkout: (workout: Omit<Workout, "id" | "created_at">) => void;

  // Voice Notes
  voiceNotes: VoiceNote[];
  addVoiceNote: (note: Omit<VoiceNote, "id" | "created_at">) => void;
  updateVoiceNote: (id: string, updates: Partial<VoiceNote>) => void;
  deleteVoiceNote: (id: string) => void;

  // Chat
  conversations: ChatConversation[];
  activeConversationId: string | null;
  addConversation: () => string;
  addMessage: (conversationId: string, message: Omit<ChatMessage, "id" | "created_at">) => void;
  setActiveConversation: (id: string | null) => void;

  // Google Calendar
  googleCalendarConnected: boolean;
  setGoogleCalendarConnected: (connected: boolean) => void;

  // UI
  sidebarOpen: boolean;
  toggleSidebar: () => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // ---- Tasks ----
      tasks: [],
      addTask: (task) =>
        set((state) => ({
          tasks: [
            ...state.tasks,
            {
              ...task,
              id: generateId(),
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          ],
        })),
      updateTask: (id, updates) =>
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === id ? { ...t, ...updates, updated_at: new Date().toISOString() } : t
          ),
        })),
      deleteTask: (id) =>
        set((state) => ({ tasks: state.tasks.filter((t) => t.id !== id) })),
      completeTask: (id) =>
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === id
              ? { ...t, status: "done" as const, completed_at: new Date().toISOString(), updated_at: new Date().toISOString() }
              : t
          ),
        })),

      // ---- Calendar ----
      events: [],
      addEvent: (event) =>
        set((state) => ({
          events: [
            ...state.events,
            { ...event, id: generateId(), created_at: new Date().toISOString() },
          ],
        })),
      updateEvent: (id, updates) =>
        set((state) => ({
          events: state.events.map((e) =>
            e.id === id ? { ...e, ...updates } : e
          ),
        })),
      deleteEvent: (id) =>
        set((state) => ({ events: state.events.filter((e) => e.id !== id) })),
      setEvents: (events) => set({ events }),

      // ---- Habits ----
      habits: [],
      habitLogs: [],
      addHabit: (habit) =>
        set((state) => ({
          habits: [
            ...state.habits,
            { ...habit, id: generateId(), created_at: new Date().toISOString() },
          ],
        })),
      logHabit: (habitId, date) =>
        set((state) => {
          const existing = state.habitLogs.find(
            (l) => l.habit_id === habitId && l.date === date
          );
          if (existing) {
            return {
              habitLogs: state.habitLogs.map((l) =>
                l.id === existing.id ? { ...l, count: l.count + 1 } : l
              ),
            };
          }
          return {
            habitLogs: [
              ...state.habitLogs,
              { id: generateId(), habit_id: habitId, date, count: 1 },
            ],
          };
        }),

      // ---- Finances ----
      transactions: [],
      addTransaction: (tx) =>
        set((state) => ({
          transactions: [
            ...state.transactions,
            { ...tx, id: generateId(), created_at: new Date().toISOString() },
          ],
        })),

      // ---- Gym ----
      workouts: [],
      addWorkout: (workout) =>
        set((state) => ({
          workouts: [
            ...state.workouts,
            { ...workout, id: generateId(), created_at: new Date().toISOString() },
          ],
        })),

      // ---- Voice Notes ----
      voiceNotes: [],
      addVoiceNote: (note) =>
        set((state) => ({
          voiceNotes: [
            ...state.voiceNotes,
            { ...note, id: generateId(), created_at: new Date().toISOString() },
          ],
        })),
      updateVoiceNote: (id, updates) =>
        set((state) => ({
          voiceNotes: state.voiceNotes.map((n) =>
            n.id === id ? { ...n, ...updates } : n
          ),
        })),
      deleteVoiceNote: (id) =>
        set((state) => ({ voiceNotes: state.voiceNotes.filter((n) => n.id !== id) })),

      // ---- Chat ----
      conversations: [],
      activeConversationId: null,
      addConversation: () => {
        const id = generateId();
        set((state) => ({
          conversations: [
            {
              id,
              title: "New Chat",
              messages: [],
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            ...state.conversations,
          ],
          activeConversationId: id,
        }));
        return id;
      },
      addMessage: (conversationId, message) =>
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === conversationId
              ? {
                  ...c,
                  messages: [
                    ...c.messages,
                    { ...message, id: generateId(), created_at: new Date().toISOString() },
                  ],
                  updated_at: new Date().toISOString(),
                }
              : c
          ),
        })),
      setActiveConversation: (id) => set({ activeConversationId: id }),

      // ---- Google Calendar ----
      googleCalendarConnected: false,
      setGoogleCalendarConnected: (connected) => set({ googleCalendarConnected: connected }),

      // ---- UI ----
      sidebarOpen: true,
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
    }),
    {
      name: "productivity-hub-storage",
      partialize: (state) => ({
        tasks: state.tasks,
        events: state.events,
        habits: state.habits,
        habitLogs: state.habitLogs,
        transactions: state.transactions,
        workouts: state.workouts,
        voiceNotes: state.voiceNotes,
        conversations: state.conversations,
        googleCalendarConnected: state.googleCalendarConnected,
      }),
    }
  )
);
