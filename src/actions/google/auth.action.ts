"use server";
import "server-only";

import { google } from "googleapis";
import { clerkClient, currentUser } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import dayjs from "@/lib/day-utils";
import { getCachedSession } from "../session.action";
import { withErrorHandling } from "@/lib/with-error-handling";
import { getPermissionsAction } from "../permission.action";
import { PERMISSIONS } from "@/lib/permissions";

const GOOGLE_CALENDAR_METADATA_KEY = "googleCalendarCredentials";

/**
 * Produce a proper RFC3339 datetime string in Asia/Manila timezone.
 * Google Calendar API requires seconds in the datetime (e.g. "2024-03-10T09:00:00+08:00").
 * The `time` argument is typically stored as "HH:mm" — this function normalises it to "HH:mm:ss".
 */
function toCalendarRFC3339(date: Date, time: string): string {
  const timePart = time.split(":").length === 2 ? `${time}:00` : time;
  const dateStr = dayjs(date).format("YYYY-MM-DD");
  return dayjs.tz(`${dateStr}T${timePart}`, "Asia/Manila").format();
}

function createOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.NEXT_PUBLIC_APP_URL}/api/google/code`,
  );
}

export async function getGoogleAuthUrl(redirectUrl: string) {
  try {
    const oauth2Client = createOAuth2Client();
    const scopes = [
      "https://www.googleapis.com/auth/calendar",
      "https://www.googleapis.com/auth/calendar.events",
      // email scope so we can surface the connected account's email address
      "https://www.googleapis.com/auth/userinfo.email",
    ];
    const url = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: scopes,
      prompt: "consent",
      redirect_uri: redirectUrl,
    });

    return {
      status: true,
      message: "Auth url generated",
      data: url
    }
  } catch (error) {
    console.error(`Error fetching auth url: ${error}`);
    return {
      status: false,
      message: "Error get auth url",
      data: null
    }
  }
}

/** Exchange the OAuth authorization code for tokens and persist them in Clerk private metadata. */
export async function exchangeGoogleCode(code: string): Promise<boolean> {
  try {
    const oauth2Client = createOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);
    if (!tokens.refresh_token && !tokens.access_token) return false;

    const clerkApi = await clerkClient();
    const clerkyUser = await currentUser();
    if (!clerkyUser) return false;

    // Fetch the Google account email so we can display it in the integration UI
    let connectedEmail: string | null = null;
    try {
      oauth2Client.setCredentials(tokens);
      const oauth2Api = google.oauth2({ version: "v2", auth: oauth2Client });
      const { data: userInfo } = await oauth2Api.userinfo.get();
      connectedEmail = userInfo.email ?? null;
    } catch {
      // Non-critical — proceed without email
    }

    // Store tokens in private metadata so they persist across sessions
    const existing = (clerkyUser.privateMetadata ?? {}) as Record<string, unknown>;
    await clerkApi.users.updateUser(clerkyUser.id, {
      privateMetadata: {
        ...existing,
        [GOOGLE_CALENDAR_METADATA_KEY]: {
          access_token: tokens.access_token,
          // Preserve existing refresh_token if a new one wasn't returned
          refresh_token: tokens.refresh_token ?? (existing[GOOGLE_CALENDAR_METADATA_KEY] as Record<string, unknown> | undefined)?.refresh_token,
          expiry_date: tokens.expiry_date,
          token_type: tokens.token_type,
          scope: tokens.scope,
          email: connectedEmail,
        },
      },
    });
    return true;
  } catch (error) {
    console.error("Failed to exchange Google code:", error);
    return false;
  }
}

/** Returns a configured OAuth2 client with valid credentials, or null if not connected. */
async function getAuthenticatedCalendarClient() {
  const clerkApi = await clerkClient();
  const clerkyUser = await currentUser();
  if (!clerkyUser) return null;

  const stored = (clerkyUser.privateMetadata?.[GOOGLE_CALENDAR_METADATA_KEY] ?? null) as Record<string, unknown> | null;

  if (stored?.access_token || stored?.refresh_token) {
    const oauth2Client = createOAuth2Client();
    oauth2Client.setCredentials({
      access_token: stored.access_token as string | undefined,
      refresh_token: stored.refresh_token as string | undefined,
      expiry_date: stored.expiry_date as number | undefined,
      token_type: stored.token_type as string | undefined,
    });

    // Refresh access token if expired
    if (stored.refresh_token) {
      try {
        const { credentials } = await oauth2Client.refreshAccessToken();
        // Persist the refreshed access_token back
        const existing = (clerkyUser.privateMetadata ?? {}) as Record<string, unknown>;
        await clerkApi.users.updateUser(clerkyUser.id, {
          privateMetadata: {
            ...existing,
            [GOOGLE_CALENDAR_METADATA_KEY]: {
              ...stored,
              access_token: credentials.access_token,
              expiry_date: credentials.expiry_date,
            },
          },
        });
        oauth2Client.setCredentials(credentials);
      } catch {
        // Refresh failed — try with existing access token
      }
    }
    return oauth2Client;
  }

  // Fall back to Clerk's social OAuth token (may lack calendar scope)
  const tokenResult = await clerkApi.users.getUserOauthAccessToken(clerkyUser.id, "google");
  const token = tokenResult.data.find(t => t.provider === "google")?.token;
  if (token) {
    const oauth2Client = createOAuth2Client();
    oauth2Client.setCredentials({ access_token: token });
    return oauth2Client;
  }

  return null;
}

/** Check whether the current user has connected Google Calendar. */
export async function checkGoogleCalendarAccess(): Promise<{ connected: boolean; email: string | null }> {
  try {
    const clerkApi = await clerkClient();
    const clerkyUser = await currentUser();
    if (!clerkyUser) return { connected: false, email: null };

    // 1. Check credentials stored via our custom OAuth flow (works for all users)
    const stored = (clerkyUser.privateMetadata?.[GOOGLE_CALENDAR_METADATA_KEY] ?? null) as Record<string, unknown> | null;
    if (stored?.refresh_token || stored?.access_token) {
      const storedEmail = (stored.email as string | undefined) ?? null;
      return { connected: true, email: storedEmail };
    }

    // 2. Fall back to Clerk social OAuth (for users who signed in / linked via Google)
    const tokenResult = await clerkApi.users.getUserOauthAccessToken(clerkyUser.id, "google");
    const hasToken = tokenResult.data.some(t => t.provider === "google");
    if (hasToken) {
      // Get the email from the linked external account
      // Clerk uses "oauth_google" for accounts linked via OAuth and "google" for
      // accounts created directly via Google social login — check both.
      const googleAccount = clerkyUser.externalAccounts?.find(
        (a) => a.provider === "google" || a.provider === "oauth_google",
      );
      const email = googleAccount?.emailAddress ?? null;
      return { connected: true, email };
    }

    return { connected: false, email: null };
  } catch {
    return { connected: false, email: null };
  }
}

/** Disconnect Google Calendar by clearing stored credentials. */
export async function disconnectGoogleCalendar(): Promise<{ success: boolean }> {
  try {
    const clerkApi = await clerkClient();
    const clerkyUser = await currentUser();
    if (!clerkyUser) return { success: false };

    const existing = (clerkyUser.privateMetadata ?? {}) as Record<string, unknown>;
    const updated = { ...existing };
    delete updated[GOOGLE_CALENDAR_METADATA_KEY];
    await clerkApi.users.updateUser(clerkyUser.id, { privateMetadata: updated });
    return { success: true };
  } catch {
    return { success: false };
  }
}

export async function getGoogleAuthToken() {
  const clerkApi = await clerkClient();
  const clerkyUser = await currentUser();

  if (!clerkyUser) throw new Error("Unauthorized");

  const googleToken = await clerkApi.users.getUserOauthAccessToken(clerkyUser.id, "google")

  return googleToken.data.find(token => token.provider === "google")?.token || null;
}

type InsertCalendarPayload = {
  emails: string[];
  id: string;
  summary: string;
  location: string;
  description?: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  meet: boolean;
}

/** Fetch appointment details needed for calendar event construction. */
async function fetchAppointmentForCalendar(appointmentId: number) {
  return prisma.appointment.findUniqueOrThrow({
    where: { id: appointmentId, isActive: true },
    select: {
      id: true,
      subject: true,
      complaint: true,
      Requesters: {
        select: {
          User: { select: { email: true } }
        }
      },
      AppointmentAttribute: {
        select: {
          id: true,
          eventId: true,
          AppointmentMode: { select: { name: true } },
          date: true,
          timeStart: true,
          timeEnd: true,
        }
      },
      AppointmentRouting: {
        // Include both PENDING and ACCEPTED routings so all assigned HPs receive the calendar invite
        where: { status: { in: ["PENDING", "ACCEPTED"] } },
        select: {
          RoutedTo: {
            select: { User: { select: { email: true } } }
          },
          status: true,
        }
      }
    }
  });
}

export const insertToCalendar = withErrorHandling(async (appointmentId: number, createMeet = true) => {
  const session = await getCachedSession();
  if (!session) throw new Error("Session not found");

  const myPermissions = await getPermissionsAction({ userId: session.user.sub, type: "CLINIC" });
  const myPermissionArray = myPermissions.map(p => p.name);
  const confirmBookingPermissions = [PERMISSIONS.CLINIC["CONFIRM:CLINIC:APPOINTMENT"].name];
  const canConfirmBooking = confirmBookingPermissions.every(p => myPermissionArray.includes(p));

  if (!canConfirmBooking) throw new Error("You don't have permission to confirm booking");

  const authClient = await getAuthenticatedCalendarClient();
  if (!authClient) throw new Error("Google Calendar not connected. Please connect your Google account in Settings → Integrations.");

  const appointment = await fetchAppointmentForCalendar(appointmentId);
  const attr = appointment.AppointmentAttribute;
  if (!attr?.date || !attr.timeStart || !attr.timeEnd) {
    throw new Error("Appointment schedule is incomplete.");
  }

  const calendar = google.calendar({ version: "v3", auth: authClient });
  const attendees = [
    ...appointment.AppointmentRouting.map(h => ({ email: h.RoutedTo.User.email })),
    ...appointment.Requesters.map(p => ({ email: p.User.email })),
  ];

  const event = {
    summary: appointment.subject,
    location: attr.AppointmentMode.name,
    description: appointment.complaint ?? undefined,
    start: { dateTime: toCalendarRFC3339(attr.date, attr.timeStart), timeZone: "Asia/Manila" },
    end:   { dateTime: toCalendarRFC3339(attr.date, attr.timeEnd),   timeZone: "Asia/Manila" },
    attendees,
    ...(createMeet ? {
      conferenceData: {
        // Timestamp suffix prevents duplicate request ID errors if the event is re-created
        createRequest: { requestId: `meet-${appointmentId}-${Date.now()}` }
      }
    } : {}),
  };

  const { data: calendarEvent, status } = await calendar.events.insert({
    calendarId: "primary",
    conferenceDataVersion: createMeet ? 1 : 0,
    sendUpdates: "all",
    sendNotifications: true,
    requestBody: event,
  });

  if (![200, 201, 202].includes(status)) throw new Error("Error inserting to calendar");

  await prisma.appointmentAttribute.update({
    where: { id: attr.id },
    data: {
      eventId: calendarEvent.id ?? "",
      meetingUrl: calendarEvent.hangoutLink ?? "",
    }
  });

  return {
    message: "Event added to Google Calendar",
    data: {
      eventId: calendarEvent.id ?? null,
      meetingUrl: calendarEvent.hangoutLink ?? null,
    }
  };
});

/** Update an existing Google Calendar event after a reschedule. */
export const updateCalendarEvent = withErrorHandling(async (appointmentId: number) => {
  const session = await getCachedSession();
  if (!session) throw new Error("Session not found");

  const authClient = await getAuthenticatedCalendarClient();
  if (!authClient) return { message: "Google Calendar not connected — event not updated", data: null };

  const appointment = await fetchAppointmentForCalendar(appointmentId);
  const attr = appointment.AppointmentAttribute;
  if (!attr?.eventId) return { message: "No calendar event to update", data: null };
  if (!attr.date || !attr.timeStart || !attr.timeEnd) return { message: "Schedule is incomplete", data: null };

  const calendar = google.calendar({ version: "v3", auth: authClient });
  const attendees = [
    ...appointment.AppointmentRouting.map(h => ({ email: h.RoutedTo.User.email })),
    ...appointment.Requesters.map(p => ({ email: p.User.email })),
  ];

  await calendar.events.patch({
    calendarId: "primary",
    eventId: attr.eventId,
    sendUpdates: "all",
    requestBody: {
      summary: appointment.subject,
      location: attr.AppointmentMode.name,
      description: appointment.complaint ?? undefined,
      start: { dateTime: toCalendarRFC3339(attr.date, attr.timeStart), timeZone: "Asia/Manila" },
      end:   { dateTime: toCalendarRFC3339(attr.date, attr.timeEnd),   timeZone: "Asia/Manila" },
      attendees,
    },
  });

  return { message: "Google Calendar event updated", data: null };
});

export type CalendarEventItem = {
  id: string;
  summary: string;
  start: string;
  end: string;
  isAllDay: boolean;
  location: string | null;
  hangoutLink: string | null;
  /** Direct link to open the event in Google Calendar */
  htmlLink: string | null;
};

/**
 * Fetch the next upcoming events from the current user's primary Google Calendar.
 * Returns an empty array when the calendar is not connected.
 */
export async function getCalendarEvents(maxResults = 20): Promise<CalendarEventItem[]> {
  try {
    const authClient = await getAuthenticatedCalendarClient();
    if (!authClient) return [];

    const calendar = google.calendar({ version: "v3", auth: authClient });
    const { data } = await calendar.events.list({
      calendarId: "primary",
      timeMin: new Date().toISOString(),
      maxResults,
      singleEvents: true,
      orderBy: "startTime",
    });

    return (data.items ?? []).map((e) => {
      const isAllDay = Boolean(e.start?.date && !e.start?.dateTime);
      return {
        id: e.id ?? "",
        summary: e.summary ?? "(No title)",
        start: e.start?.dateTime ?? e.start?.date ?? "",
        end: e.end?.dateTime ?? e.end?.date ?? "",
        isAllDay,
        location: e.location ?? null,
        hangoutLink: e.hangoutLink ?? null,
        htmlLink: e.htmlLink ?? null,
      };
    });
  } catch (error) {
    console.error("Failed to fetch Google Calendar events:", error);
    return [];
  }
}

/** Delete a Google Calendar event (e.g. on cancellation). */
export const deleteCalendarEvent = withErrorHandling(async (appointmentId: number) => {
  const session = await getCachedSession();
  if (!session) throw new Error("Session not found");

  const authClient = await getAuthenticatedCalendarClient();
  if (!authClient) return { message: "Google Calendar not connected", data: null };

  const appointment = await fetchAppointmentForCalendar(appointmentId);
  const eventId = appointment.AppointmentAttribute?.eventId;
  if (!eventId) return { message: "No calendar event found", data: null };

  const calendar = google.calendar({ version: "v3", auth: authClient });
  await calendar.events.delete({
    calendarId: "primary",
    eventId,
    sendUpdates: "all",
  });

  await prisma.appointmentAttribute.update({
    where: { id: appointment.AppointmentAttribute!.id },
    data: { eventId: "", meetingUrl: "" },
  });

  return { message: "Google Calendar event deleted", data: null };
});