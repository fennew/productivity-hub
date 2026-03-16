"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Mail,
  Calendar as CalendarIcon,
  FileSpreadsheet,
  MessageCircle,
  Webhook,
  Bell,
  Clock,
  Check,
  X,
  Loader2,
  ExternalLink,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useStore } from "@/store/useStore";

function SettingsContent() {
  const searchParams = useSearchParams();
  const { googleCalendarConnected, setGoogleCalendarConnected, addEvent, events } = useStore();
  const [googleLoading, setGoogleLoading] = useState(false);
  const [syncingCalendar, setSyncingCalendar] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);
  const [notifications, setNotifications] = useState({
    daily_summary: true,
    daily_summary_time: "17:00",
    task_reminders: true,
    meeting_reminders: true,
    reminder_minutes_before: 15,
  });

  // Check Google connection status on mount + handle OAuth callback
  useEffect(() => {
    const googleStatus = searchParams.get("google");
    if (googleStatus === "success") {
      setGoogleCalendarConnected(true);
    }

    fetch("/api/auth/google/status")
      .then((r) => r.json())
      .then((data) => setGoogleCalendarConnected(data.connected))
      .catch(() => {});
  }, [searchParams, setGoogleCalendarConnected]);

  async function connectGoogle() {
    setGoogleLoading(true);
    try {
      const res = await fetch("/api/auth/google");
      const data = await res.json();
      if (data.authUrl) {
        window.location.href = data.authUrl;
      } else {
        alert(data.error || "Failed to get auth URL. Check GOOGLE_CLIENT_ID in .env.local");
      }
    } catch {
      alert("Failed to connect. Make sure GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are set in .env.local");
    } finally {
      setGoogleLoading(false);
    }
  }

  async function disconnectGoogle() {
    await fetch("/api/auth/google/disconnect", { method: "POST" });
    setGoogleCalendarConnected(false);
  }

  async function syncGoogleCalendar() {
    setSyncingCalendar(true);
    setSyncResult(null);
    try {
      const res = await fetch("/api/calendar/google");
      const data = await res.json();

      if (data.error) {
        setSyncResult(`Error: ${data.error}`);
        return;
      }

      const existingIds = new Set(events.map((e) => e.id));
      let added = 0;
      for (const event of data.events) {
        if (!existingIds.has(event.id)) {
          addEvent(event);
          added++;
        }
      }

      setSyncResult(`Synced! ${added} new events added (${data.events.length} total from Google)`);
    } catch {
      setSyncResult("Failed to sync. Try reconnecting.");
    } finally {
      setSyncingCalendar(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      {/* Google Auth Status Banner */}
      {searchParams.get("google") === "success" && (
        <div className="glass-card p-3 mb-6 border-green-600/30 flex items-center gap-2">
          <Check size={16} className="text-green-400" />
          <span className="text-sm text-green-400">Google Calendar connected successfully!</span>
        </div>
      )}
      {searchParams.get("google") === "error" && (
        <div className="glass-card p-3 mb-6 border-red-600/30 flex items-center gap-2">
          <X size={16} className="text-red-400" />
          <span className="text-sm text-red-400">Failed to connect Google Calendar. Try again.</span>
        </div>
      )}

      {/* Integrations */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Webhook size={20} />
          Integrations
        </h2>
        <div className="space-y-3">
          {/* Google Calendar - ACTIVE */}
          <div className="glass-card p-5">
            <div className="flex items-start gap-3">
              <CalendarIcon size={22} className="text-blue-400 mt-0.5" />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Google Calendar</span>
                  {googleCalendarConnected ? (
                    <span className="text-[10px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded">Connected</span>
                  ) : (
                    <span className="text-[10px] bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded">Ready to connect</span>
                  )}
                </div>
                <p className="text-xs text-zinc-500 mt-0.5">Sync your Google Calendar events to the calendar view</p>

                {googleCalendarConnected && (
                  <div className="mt-3 flex items-center gap-2">
                    <button
                      onClick={syncGoogleCalendar}
                      disabled={syncingCalendar}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg text-xs font-medium transition-colors"
                    >
                      {syncingCalendar ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                      Sync Now
                    </button>
                    {syncResult && (
                      <span className={cn("text-xs", syncResult.startsWith("Error") ? "text-red-400" : "text-green-400")}>
                        {syncResult}
                      </span>
                    )}
                  </div>
                )}
              </div>
              {googleCalendarConnected ? (
                <button
                  onClick={disconnectGoogle}
                  className="px-3 py-1.5 text-xs bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                >
                  Disconnect
                </button>
              ) : (
                <button
                  onClick={connectGoogle}
                  disabled={googleLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg font-medium transition-colors"
                >
                  {googleLoading ? <Loader2 size={12} className="animate-spin" /> : <ExternalLink size={12} />}
                  Connect
                </button>
              )}
            </div>

            {/* Setup instructions */}
            {!googleCalendarConnected && (
              <div className="mt-4 p-3 bg-zinc-900 rounded-lg">
                <p className="text-xs font-medium text-zinc-300 mb-2">Setup instructions:</p>
                <ol className="text-xs text-zinc-500 space-y-1 list-decimal list-inside">
                  <li>Go to Google Cloud Console &gt; APIs &amp; Services &gt; Credentials</li>
                  <li>Create an OAuth 2.0 Client ID (Web application)</li>
                  <li>Add authorized redirect URI: <code className="text-zinc-400 bg-zinc-800 px-1 rounded">YOUR_DOMAIN/api/auth/google/callback</code></li>
                  <li>Enable the Google Calendar API</li>
                  <li>Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to <code className="text-zinc-400 bg-zinc-800 px-1 rounded">.env.local</code></li>
                  <li>Click Connect above</li>
                </ol>
              </div>
            )}
          </div>

          {/* Gmail */}
          <div className="glass-card p-4">
            <div className="flex items-start gap-3">
              <Mail size={20} className="text-red-400" />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">Gmail</span>
                  <span className="text-[10px] bg-zinc-800 text-zinc-500 px-1.5 py-0.5 rounded">Coming Soon</span>
                </div>
                <p className="text-xs text-zinc-500 mt-0.5">Import emails as tasks, send notifications</p>
              </div>
              <button disabled className="px-3 py-1 text-xs bg-zinc-800 text-zinc-500 rounded-lg cursor-not-allowed">Connect</button>
            </div>
          </div>

          {/* Notion */}
          <div className="glass-card p-4">
            <div className="flex items-start gap-3">
              <FileSpreadsheet size={20} className="text-zinc-300" />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">Notion</span>
                  <span className="text-[10px] bg-zinc-800 text-zinc-500 px-1.5 py-0.5 rounded">Coming Soon</span>
                </div>
                <p className="text-xs text-zinc-500 mt-0.5">Sync databases, import pages as tasks</p>
              </div>
              <button disabled className="px-3 py-1 text-xs bg-zinc-800 text-zinc-500 rounded-lg cursor-not-allowed">Connect</button>
            </div>
          </div>

          {/* Google Sheets */}
          <div className="glass-card p-4">
            <div className="flex items-start gap-3">
              <FileSpreadsheet size={20} className="text-green-400" />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">Google Sheets</span>
                  <span className="text-[10px] bg-zinc-800 text-zinc-500 px-1.5 py-0.5 rounded">Coming Soon</span>
                </div>
                <p className="text-xs text-zinc-500 mt-0.5">Export finances, sync habit data</p>
              </div>
              <button disabled className="px-3 py-1 text-xs bg-zinc-800 text-zinc-500 rounded-lg cursor-not-allowed">Connect</button>
            </div>
          </div>

          {/* Telegram */}
          <div className="glass-card p-4">
            <div className="flex items-start gap-3">
              <MessageCircle size={20} className="text-blue-400" />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">Telegram</span>
                  <span className="text-[10px] bg-zinc-800 text-zinc-500 px-1.5 py-0.5 rounded">Coming Soon</span>
                </div>
                <p className="text-xs text-zinc-500 mt-0.5">Send tasks via bot, receive notifications</p>
              </div>
              <button disabled className="px-3 py-1 text-xs bg-zinc-800 text-zinc-500 rounded-lg cursor-not-allowed">Connect</button>
            </div>
          </div>
        </div>
      </section>

      {/* Notifications */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Bell size={20} />
          Notifications
        </h2>
        <div className="glass-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Daily Summary</p>
              <p className="text-xs text-zinc-500">Get a summary of open tasks at a set time</p>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="time"
                value={notifications.daily_summary_time}
                onChange={(e) => setNotifications({ ...notifications, daily_summary_time: e.target.value })}
                className="bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs outline-none"
              />
              <button
                onClick={() => setNotifications({ ...notifications, daily_summary: !notifications.daily_summary })}
                className={cn("w-10 h-5 rounded-full transition-colors relative", notifications.daily_summary ? "bg-blue-600" : "bg-zinc-700")}
              >
                <div className={cn("w-4 h-4 rounded-full bg-white absolute top-0.5 transition-all", notifications.daily_summary ? "left-5" : "left-0.5")} />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Task Reminders</p>
              <p className="text-xs text-zinc-500">Get reminded before task deadlines</p>
            </div>
            <button
              onClick={() => setNotifications({ ...notifications, task_reminders: !notifications.task_reminders })}
              className={cn("w-10 h-5 rounded-full transition-colors relative", notifications.task_reminders ? "bg-blue-600" : "bg-zinc-700")}
            >
              <div className={cn("w-4 h-4 rounded-full bg-white absolute top-0.5 transition-all", notifications.task_reminders ? "left-5" : "left-0.5")} />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Meeting Reminders</p>
              <p className="text-xs text-zinc-500">Get reminded before calendar events</p>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={notifications.reminder_minutes_before}
                onChange={(e) => setNotifications({ ...notifications, reminder_minutes_before: parseInt(e.target.value) })}
                className="bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs outline-none"
              >
                <option value={5}>5 min before</option>
                <option value={10}>10 min before</option>
                <option value={15}>15 min before</option>
                <option value={30}>30 min before</option>
              </select>
              <button
                onClick={() => setNotifications({ ...notifications, meeting_reminders: !notifications.meeting_reminders })}
                className={cn("w-10 h-5 rounded-full transition-colors relative", notifications.meeting_reminders ? "bg-blue-600" : "bg-zinc-700")}
              >
                <div className={cn("w-4 h-4 rounded-full bg-white absolute top-0.5 transition-all", notifications.meeting_reminders ? "left-5" : "left-0.5")} />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
            <div>
              <p className="text-sm font-medium">Auto-Reschedule Overdue Tasks</p>
              <p className="text-xs text-zinc-500">Automatically move overdue tasks to today</p>
            </div>
            <span className="text-xs text-green-400 bg-green-500/20 px-2 py-1 rounded">Enabled</span>
          </div>
        </div>
      </section>

      {/* API Settings */}
      <section>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Clock size={20} />
          API Configuration
        </h2>
        <div className="glass-card p-5">
          <div className="space-y-3">
            <div>
              <label className="text-xs text-zinc-500 mb-1 block">OpenRouter API Key</label>
              <input type="password" value="sk-or-v1-****" disabled className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2 text-sm outline-none text-zinc-500" />
              <p className="text-[10px] text-zinc-600 mt-1">Set in .env.local file</p>
            </div>
            <div>
              <label className="text-xs text-zinc-500 mb-1 block">Supabase URL</label>
              <input type="text" placeholder="https://your-project.supabase.co" disabled className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2 text-sm outline-none text-zinc-500" />
              <p className="text-[10px] text-zinc-600 mt-1">Set in .env.local file</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="max-w-3xl mx-auto"><h1 className="text-2xl font-bold mb-6">Settings</h1><p className="text-zinc-500">Loading...</p></div>}>
      <SettingsContent />
    </Suspense>
  );
}
