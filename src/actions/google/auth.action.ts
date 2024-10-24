"use server";
import "server-only";

import { google } from "googleapis";
import { authenticationClient, managementClient } from "@services/auth0/management-client";
import { getCachedSession } from "@actions/session.action";

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

    console.log({url});
    return url;
  } catch (error) {
    console.error(`Error fetching auth url: ${error}`);
    return null;
  }
}

export async function getGoogleAuthTokens(code: string, redirect_uri:string) {
  try {
    const { tokens } = await oauth2Client.getToken({
      code,
      redirect_uri,
    });
    const session = await getCachedSession();

    const newUser = await managementClient.users.create({
      email: session?.user.email,
      connection: "google-oauth2",
    })
    // const user = await managementClient.users.link({id: session?.user.sub}, {link_with: newUser.data.})
    // console.log(JSON.stringify(user, null, 2));
    
    // oauth2Client.setCredentials({
    //   access_token: "ya29.a0AcM612zhIG2UujiOH2wT5ZTmVZaruCqg4pSQe9NyxRcM-7XEXs9mAWprA8JODwu5xXp0DBNMXz5j0-cqYk2bgCgwO6HBPwwwl8vhXQxhQcFhDfIP5F4A2dMEyAZRx0vb3N8-QUEzXnbfN0k9eJsyQM_lf9sLld_bZh4aCgYKAQ8SARMSFQHGX2MiWMKSlwdLKoEr-QOWotC-hQ0170"
    // });
    return tokens;
  } catch (error) {
    console.error(`Error fetching access token: ${error}`);
    return null;
  }
}

export const getGoogleAccessToken = async () => {
  oauth2Client.setCredentials({
    access_token: "ya29.a0AcM612zhIG2UujiOH2wT5ZTmVZaruCqg4pSQe9NyxRcM-7XEXs9mAWprA8JODwu5xXp0DBNMXz5j0-cqYk2bgCgwO6HBPwwwl8vhXQxhQcFhDfIP5F4A2dMEyAZRx0vb3N8-QUEzXnbfN0k9eJsyQM_lf9sLld_bZh4aCgYKAQ8SARMSFQHGX2MiWMKSlwdLKoEr-QOWotC-hQ0170"
  });
  const { token } = await oauth2Client.getAccessToken();
  return token;
};

export const insertToCalendar = async (email: string) => {
  try {
    console.log({oauth2Client});
    oauth2Client.setCredentials({
      access_token: "ya29.a0AcM612zhIG2UujiOH2wT5ZTmVZaruCqg4pSQe9NyxRcM-7XEXs9mAWprA8JODwu5xXp0DBNMXz5j0-cqYk2bgCgwO6HBPwwwl8vhXQxhQcFhDfIP5F4A2dMEyAZRx0vb3N8-QUEzXnbfN0k9eJsyQM_lf9sLld_bZh4aCgYKAQ8SARMSFQHGX2MiWMKSlwdLKoEr-QOWotC-hQ0170"
    })
    
    const calendar = google.calendar({ version: "v3", auth: oauth2Client });
    const event = {
      summary: "Google I/O 2022",
      location: "800 Howard St., San Francisco, CA 94103",
      description: "A chance to hear more about Google's developer products.",
      start: {
        dateTime: "2024-10-28T09:00:00-07:00",
        timeZone: "America/Los_Angeles",
      },
      end: {
        dateTime: "2024-10-28T17:00:00-07:00",
        timeZone: "America/Los_Angeles",
      },
      recurrence: ["RRULE:FREQ=DAILY;COUNT=2"],
      attendees: [{ email}, {email: "wacanam20@gmail.com"}, {email: "clinicez.official@gmail.com"}],
    }
    const {data, status} = await calendar.events.insert({
      calendarId: "primary",
      requestBody: event,
    });
    console.log({data, status});
  } catch (error) {
    console.error(`Error inserting to calendar: ${error}`);
  }
}