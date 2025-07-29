"use server";
import "server-only";

import { google } from "googleapis";
import { managementClient } from "@services/auth0/management-client";
import { getCachedSession } from "@actions/session.action";
import prisma from "@lib/prisma";
import { getPermissionsAction } from "@actions/permission.action";
import { PERMISSIONS } from "@lib/permissions";
import { combineDateTime } from "@/lib/day-utils";
import { withErrorHandling } from "@/lib/with-error-handling";

type Credentials  = {
  refresh_token?: string | null;
  expiry_date?: number | null;
  access_token?: string | null;
  token_type?: string | null;
  id_token?: string | null;
  scope?: string;
}

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
);

export async function getGoogleAuthUrl(redirectUrl: string) {
  try {
    const scopes = ["https://www.googleapis.com/auth/calendar"];
    const url = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: scopes,
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

export async function getGoogleAuthTokens(code: string, redirect_uri:string) {
  try {
    const session = await getCachedSession();
    if(!session) throw new Error("Session not found");
    const { tokens } = await oauth2Client.getToken({
      code,
      redirect_uri,
    });
    oauth2Client.setCredentials(tokens);
    await managementClient.users.update({id: session.user.sub}, {
      user_metadata: {
        idp: {
          provider: "google-oauth2",
          credentials: tokens
        }
      }
    })

    return tokens;
  } catch (error) {
    console.error(`Error fetching access token: ${error}`);
    return null;
  }
}

export const getGoogleAccessToken = async () => {
  const session = await getCachedSession();
  if (!session?.user?.sub) {
    throw new Error("No valid session found");
  }
  try {
    const auth0User = await managementClient.users.get({id: session.user.sub, fields: "user_metadata"});

    const user_metadata = auth0User.data.user_metadata as {idp: {provider: string, credentials: Credentials}};
    // find google credentials
    if("idp" in user_metadata) {
      const idp = user_metadata.idp;
      if(idp.provider === "google-oauth2") {
        const credentials = idp.credentials;
        oauth2Client.setCredentials(credentials);
      }
    } else {
      throw new Error("Credentials not found");
    }
    
    const { token } = await oauth2Client.getAccessToken();
    return token;
  } catch (error) {
    console.error(`Error fetching access token: ${error}`);
    return null;
  }
};

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
export const insertToCalendar = withErrorHandling(async (appointmentId:number) => {
  
  const session = await getCachedSession();
  if(!session) throw new Error("Session not found");

  const myPermissions = await getPermissionsAction({userId: session.user.sub, type: "CLINIC"});
  const myPermissionArray = myPermissions.map(p => p.name);
  const confirmBookingPermissions = [PERMISSIONS.CLINIC["CONFIRM:CLINIC:APPOINTMENT"].name];
  const canConfirmBooking = confirmBookingPermissions.every(p => myPermissionArray.includes(p));

  if(!canConfirmBooking) throw new Error("You don't have permission to confirm booking");

  const auth0User = await managementClient.users.get({id: session?.user.sub, fields: "user_metadata"});
  const user_metadata = auth0User.data.user_metadata as {idp: {provider: string, credentials: Credentials}};
  
  // find google credentials
  if("idp" in user_metadata) {
    const idp = user_metadata.idp;
    if(idp.provider === "google-oauth2") {
      const credentials = idp.credentials;
      oauth2Client.setCredentials(credentials);
    }
  } else {
    throw new Error("Google credentials not found");
  }
    
  // construct event

  const appointment = await prisma.appointment.findUniqueOrThrow({
    where: {
      id: appointmentId,
      isActive: true
    },
    select: {
      id: true,
      subject: true,
      complaint: true,
      Requesters: {
        select: {
          User: {
            select: {
              email: true
            }
          }
        }
      },
      AppointmentAttribute: {
        select: {
          id: true,
          AppointmentMode: {
            select: {
              name: true
            }
          },
          date: true,
          timeStart: true,
          timeEnd: true
        }
      },
      AppointmentRouting: {
        where: {
          status: "ACCEPTED"
        },
        select: {
          RoutedTo: {
            select: {
              User: {
                select: {
                  email: true
                }
              }
            }
          },
          status: true
        }
      }
    }
  })


  const calendar = google.calendar({ version: "v3", auth: oauth2Client });
  const event = {
    summary: appointment.subject,
    location: appointment.AppointmentAttribute?.AppointmentMode.name,
    description:  appointment.complaint,
    start: {
      dateTime: combineDateTime(appointment.AppointmentAttribute!.date!, appointment.AppointmentAttribute!.timeStart!),
      timeZone: "Asia/Manila"
    },
    end: {
      dateTime: combineDateTime(appointment.AppointmentAttribute!.date!, appointment.AppointmentAttribute!.timeEnd!),
      timeZone: "Asia/Manila"
    },
    attendees: [...appointment.AppointmentRouting.map(h => ({email: h.RoutedTo.User.email})), ...appointment.Requesters.map(p => ({email: p.User.email}))],
    conferenceData: {
      createRequest: {
        requestId: `meet-${appointmentId}`
      }
    }
  }

  const {data:calendarEvent, status} = await calendar.events.insert({
    calendarId: "primary",
    conferenceDataVersion: 1,
    sendUpdates: "all",
    sendNotifications: true,
    requestBody:  {...event}
  });

  if(![200, 201, 202].includes(status)) throw new Error("Error inserting to calendar");

  await prisma.appointmentAttribute.update({
    where: {id: appointment.AppointmentAttribute!.id },
    data: { 
      eventId: calendarEvent.id,
      meetingUrl: calendarEvent.hangoutLink
    }
  })
  return { message: "Event inserted to calendar", data: undefined}
})