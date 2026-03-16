-- ============================================
-- Productivity Hub - Supabase Database Schema
-- Run this in Supabase SQL Editor after creating your project
-- ============================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ---- Tasks ----
create table tasks (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  title text not null,
  description text,
  status text not null default 'todo' check (status in ('todo', 'in_progress', 'done', 'cancelled')),
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high', 'urgent')),
  due_date date,
  due_time time,
  project text,
  tags text[] default '{}',
  recurrence text check (recurrence in ('daily', 'weekly', 'monthly', 'yearly')),
  source text default 'manual' check (source in ('manual', 'voice', 'telegram', 'gmail', 'notion')),
  auto_reschedule boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  completed_at timestamptz
);

-- ---- Calendar Events ----
create table calendar_events (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  title text not null,
  description text,
  start_time timestamptz not null,
  end_time timestamptz not null,
  location text,
  meeting_link text,
  attendees text[] default '{}',
  source text default 'manual',
  color text default '#3b82f6',
  created_at timestamptz default now()
);

-- ---- Habits ----
create table habits (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  description text,
  frequency text not null default 'daily' check (frequency in ('daily', 'weekly', 'monthly', 'yearly')),
  target_count int default 1,
  color text default '#10b981',
  icon text,
  active boolean default true,
  created_at timestamptz default now()
);

create table habit_logs (
  id uuid primary key default uuid_generate_v4(),
  habit_id uuid references habits(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  date date not null,
  count int default 1,
  notes text,
  unique (habit_id, date)
);

-- ---- Transactions / Finances ----
create table transactions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  type text not null check (type in ('income', 'expense')),
  amount decimal(12,2) not null,
  currency text default 'EUR',
  category text not null,
  description text not null,
  date date not null,
  invoice_number text,
  client text,
  paid boolean default false,
  created_at timestamptz default now()
);

create table invoices (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  invoice_number text not null,
  client text not null,
  amount decimal(12,2) not null,
  currency text default 'EUR',
  status text default 'draft' check (status in ('draft', 'sent', 'paid', 'overdue')),
  due_date date not null,
  items jsonb not null default '[]',
  created_at timestamptz default now()
);

-- ---- Workouts / Gym ----
create table workouts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  date date not null,
  type text not null,
  duration_minutes int,
  exercises jsonb not null default '[]',
  notes text,
  created_at timestamptz default now()
);

-- ---- Voice Notes ----
create table voice_notes (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  audio_url text,
  transcript text not null,
  summary text,
  extracted_tasks text[] default '{}',
  duration_seconds int,
  processed boolean default false,
  created_at timestamptz default now()
);

-- ---- Chat Conversations ----
create table chat_conversations (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  title text default 'New Chat',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table chat_messages (
  id uuid primary key default uuid_generate_v4(),
  conversation_id uuid references chat_conversations(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  model text,
  created_at timestamptz default now()
);

-- ---- Integrations ----
create table integrations (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  type text not null check (type in ('gmail', 'notion', 'google_sheets', 'telegram')),
  name text not null,
  connected boolean default false,
  config jsonb default '{}',
  last_synced timestamptz,
  created_at timestamptz default now()
);

-- ---- Notification Preferences ----
create table notification_preferences (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade unique,
  daily_summary boolean default true,
  daily_summary_time time default '17:00',
  task_reminders boolean default true,
  meeting_reminders boolean default true,
  reminder_minutes_before int default 15,
  push_subscription jsonb,
  created_at timestamptz default now()
);

-- ---- Indexes ----
create index idx_tasks_user_status on tasks(user_id, status);
create index idx_tasks_due_date on tasks(due_date);
create index idx_calendar_events_user on calendar_events(user_id, start_time);
create index idx_habit_logs_date on habit_logs(habit_id, date);
create index idx_transactions_user_date on transactions(user_id, date);
create index idx_workouts_user_date on workouts(user_id, date);

-- ---- Row Level Security ----
alter table tasks enable row level security;
alter table calendar_events enable row level security;
alter table habits enable row level security;
alter table habit_logs enable row level security;
alter table transactions enable row level security;
alter table invoices enable row level security;
alter table workouts enable row level security;
alter table voice_notes enable row level security;
alter table chat_conversations enable row level security;
alter table chat_messages enable row level security;
alter table integrations enable row level security;
alter table notification_preferences enable row level security;

-- Policies: users can only access their own data
create policy "Users can manage their own tasks" on tasks for all using (auth.uid() = user_id);
create policy "Users can manage their own events" on calendar_events for all using (auth.uid() = user_id);
create policy "Users can manage their own habits" on habits for all using (auth.uid() = user_id);
create policy "Users can manage their own habit logs" on habit_logs for all using (auth.uid() = user_id);
create policy "Users can manage their own transactions" on transactions for all using (auth.uid() = user_id);
create policy "Users can manage their own invoices" on invoices for all using (auth.uid() = user_id);
create policy "Users can manage their own workouts" on workouts for all using (auth.uid() = user_id);
create policy "Users can manage their own voice notes" on voice_notes for all using (auth.uid() = user_id);
create policy "Users can manage their own conversations" on chat_conversations for all using (auth.uid() = user_id);
create policy "Users can manage their own integrations" on integrations for all using (auth.uid() = user_id);
create policy "Users can manage their own notification prefs" on notification_preferences for all using (auth.uid() = user_id);

-- Chat messages policy (via conversation ownership)
create policy "Users can manage messages in their conversations" on chat_messages for all
  using (conversation_id in (select id from chat_conversations where user_id = auth.uid()));

-- ---- Auto-reschedule function ----
-- Moves overdue incomplete tasks to today (runs via Supabase cron)
create or replace function reschedule_overdue_tasks()
returns void as $$
begin
  update tasks
  set due_date = current_date, updated_at = now()
  where status in ('todo', 'in_progress')
    and due_date < current_date
    and auto_reschedule = true;
end;
$$ language plpgsql security definer;
