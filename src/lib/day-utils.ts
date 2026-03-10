
import dayjs from "dayjs";
import type { ConfigType } from "dayjs";
import utc from "dayjs/plugin/utc"
import timezone from "dayjs/plugin/timezone"
import localizedFormat from "dayjs/plugin/localizedFormat"
import isBetween from "dayjs/plugin/isBetween"
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(localizedFormat)
dayjs.extend(isBetween)
dayjs.extend(relativeTime)

export default dayjs

export const formatDate = (value: ConfigType, format = "MM/DD/YYYY"): string => {
  if (value === undefined || value === null || value === "") {
    return "";
  }

  const parsed = dayjs(value);
  if (!parsed.isValid()) {
    return "";
  }

  return parsed.format(format);
}

export const localDateTimeToUtcDateTime = (localDateTime: string): string => {
  const utcDateTime = dayjs(localDateTime).utc().format("YYYY-MM-DDTHH:mm:ssZ");
  return utcDateTime;
}

export const utcDateTimeToLocalDateTime = (utcDateTime: string): string => {
  const localDateTime = dayjs(utcDateTime).format("YYYY-MM-DDTHH:mm:ss");
  return localDateTime;
}


export const combineDateTime = (date: Date, time: string): string => {
  const dateStr = dayjs(date).endOf("date").toISOString();
  return `${dateStr.split("T")[0]}T${time}`;
}

/**
 * This utility function sets the minimum date to 6 months prior to the current date,
 * preventing users from choosing/selecting a date older than 6 months in date picker components.
 */
export const getMinDateSixMonthsAgo = (): string => {
  return dayjs().subtract(6, "months").format("YYYY-MM-DD");
}

/**
 * This utility function sets the maximum date to the current date, preventing
 * users from choosing/selecting a future date in date picker components.
 */
export const getMaxDate = (): string => {
  return dayjs().format("YYYY-MM-DD");
}

/**
 * Convert a "HH:MM" 24-hour time string to "h:MM AM/PM" 12-hour format.
 * Returns "TBD" when the input is falsy.
 */
export const formatTime12Hr = (timeStr: string | null | undefined): string => {
  if (!timeStr) return 'TBD';
  const parts = timeStr.split(':');
  const hour = parseInt(parts[0], 10);
  const minute = parts[1] ?? '00';
  const period = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minute} ${period}`;
}

/**
 * Combine a Date (typically a date-only @db.Date field stored as UTC midnight) with
 * a "HH:MM" timeStart string to produce a full datetime for comparison.
 * Times are interpreted in Asia/Manila (UTC+8) — the same convention used
 * throughout the app (e.g. Google Calendar integration in auth.action.ts).
 * When timeStart is absent, the returned Date is set to end-of-day 23:59:59 PHT.
 */
export const combineDateWithTime = (date: Date, timeStart: string | null | undefined): Date => {
  // @db.Date fields are stored as UTC midnight; use UTC components to extract the
  // calendar date so the result is correct regardless of the server timezone.
  const dateStr = dayjs.utc(date).format('YYYY-MM-DD');
  const timeStr = timeStart ?? '23:59:59';
  return dayjs.tz(`${dateStr} ${timeStr}`, 'Asia/Manila').toDate();
}