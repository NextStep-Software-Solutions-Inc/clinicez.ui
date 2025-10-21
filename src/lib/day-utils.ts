
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