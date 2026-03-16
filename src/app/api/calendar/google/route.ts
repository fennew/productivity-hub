import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

async function refreshAccessToken(refreshToken: string): Promise<string | null> {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: process.env.GOOGLE_CLIENT_ID || "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
      grant_type: "refresh_token",
    }),
  });

  const data = await response.json();
  if (!response.ok) return null;

  const cookieStore = await cookies();
  cookieStore.set("google_access_token", data.access_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: data.expires_in || 3600,
    path: "/",
  });

  return data.access_token;
}

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  let accessToken = cookieStore.get("google_access_token")?.value;
  const refreshToken = cookieStore.get("google_refresh_token")?.value;

  if (!accessToken && refreshToken) {
    accessToken = (await refreshAccessToken(refreshToken)) ?? undefined;
  }

  if (!accessToken) {
    return NextResponse.json(
      { error: "Not authenticated with Google. Connect in Settings." },
      { status: 401 }
    );
  }

  // Get events from Google Calendar
  const now = new Date();
  const timeMin = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const timeMax = new Date(now.getFullYear(), now.getMonth() + 2, 0).toISOString();

  try {
    const calendarResponse = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?` +
        new URLSearchParams({
          timeMin,
          timeMax,
          singleEvents: "true",
          orderBy: "startTime",
          maxResults: "100",
        }),
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (calendarResponse.status === 401 && refreshToken) {
      // Token expired, try refresh
      accessToken = (await refreshAccessToken(refreshToken)) ?? undefined;
      if (!accessToken) {
        return NextResponse.json({ error: "Token refresh failed" }, { status: 401 });
      }
      // Retry with new token
      const retryResponse = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?` +
          new URLSearchParams({ timeMin, timeMax, singleEvents: "true", orderBy: "startTime", maxResults: "100" }),
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      const retryData = await retryResponse.json();
      return NextResponse.json({ events: mapGoogleEvents(retryData.items || []) });
    }

    const data = await calendarResponse.json();

    if (!calendarResponse.ok) {
      return NextResponse.json({ error: data.error?.message || "Failed to fetch" }, { status: 500 });
    }

    return NextResponse.json({ events: mapGoogleEvents(data.items || []) });
  } catch (err) {
    console.error("Google Calendar fetch error:", err);
    return NextResponse.json({ error: "Failed to fetch calendar events" }, { status: 500 });
  }
}

function mapGoogleEvents(items: GoogleCalendarEvent[]) {
  return items.map((item) => ({
    id: item.id,
    title: item.summary || "(No title)",
    description: item.description || "",
    start_time: item.start?.dateTime || item.start?.date || "",
    end_time: item.end?.dateTime || item.end?.date || "",
    location: item.location || "",
    meeting_link: item.hangoutLink || "",
    attendees: (item.attendees || []).map((a) => a.email),
    source: "google_calendar" as const,
    color: "#4285f4",
    created_at: item.created || new Date().toISOString(),
  }));
}

interface GoogleCalendarEvent {
  id: string;
  summary?: string;
  description?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
  location?: string;
  hangoutLink?: string;
  attendees?: { email: string }[];
  created?: string;
}
