// ============================================
// Core Types for Productivity Hub
// ============================================

export type Priority = "low" | "medium" | "high" | "urgent";
export type TaskStatus = "todo" | "in_progress" | "done" | "cancelled";
export type RecurrenceType = "daily" | "weekly" | "monthly" | "yearly";
export type IntegrationType = "gmail" | "notion" | "google_sheets" | "telegram";

// ---- Projects ----
export interface Project {
  id: string;
  name: string;
  description?: string;
  color: string;
  status: "active" | "completed" | "archived";
  created_at: string;
  updated_at: string;
}

// ---- Tasks ----
export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: Priority;
  due_date?: string;
  due_time?: string;
  project?: string;
  tags: string[];
  recurrence?: RecurrenceType;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  source?: "manual" | "voice" | "telegram" | "gmail" | "notion";
  auto_reschedule: boolean;
}

// ---- Calendar & Meetings ----
export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  location?: string;
  meeting_link?: string;
  attendees: string[];
  source?: IntegrationType | "manual";
  color?: string;
  created_at: string;
}

// ---- Habits ----
export interface Habit {
  id: string;
  name: string;
  description?: string;
  frequency: RecurrenceType;
  target_count: number;
  color: string;
  icon?: string;
  created_at: string;
  active: boolean;
}

export interface HabitLog {
  id: string;
  habit_id: string;
  date: string;
  count: number;
  notes?: string;
}

// ---- Finances ----
export interface Transaction {
  id: string;
  type: "income" | "expense";
  amount: number;
  currency: string;
  category: string;
  description: string;
  date: string;
  invoice_number?: string;
  client?: string;
  paid: boolean;
  created_at: string;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  client: string;
  amount: number;
  currency: string;
  status: "draft" | "sent" | "paid" | "overdue";
  due_date: string;
  items: InvoiceItem[];
  created_at: string;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

// ---- Gym ----
export interface Workout {
  id: string;
  date: string;
  type: string;
  duration_minutes: number;
  exercises: Exercise[];
  notes?: string;
  created_at: string;
}

export interface Exercise {
  name: string;
  sets: ExerciseSet[];
}

export interface ExerciseSet {
  reps?: number;
  weight?: number;
  duration_seconds?: number;
  distance_meters?: number;
}

// ---- Voice Notes ----
export interface VoiceNote {
  id: string;
  audio_url?: string;
  transcript: string;
  summary: string;
  extracted_tasks: string[];
  duration_seconds: number;
  created_at: string;
  processed: boolean;
}

// ---- AI Chat ----
export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  created_at: string;
  model?: string;
}

export interface ChatConversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  created_at: string;
  updated_at: string;
}

// ---- Integrations ----
export interface Integration {
  id: string;
  type: IntegrationType;
  name: string;
  connected: boolean;
  config: Record<string, string>;
  last_synced?: string;
}

// ---- Notifications ----
export interface NotificationPreference {
  daily_summary: boolean;
  daily_summary_time: string; // "17:00"
  task_reminders: boolean;
  meeting_reminders: boolean;
  reminder_minutes_before: number;
}
