
import dayjs from "dayjs";
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

export default dayjs;

export const formatDateTime = (date: Date, time: string): dayjs.Dayjs => {
  const dateStr = dayjs(date).endOf("date").toISOString();
  const dateTimeStr = `${dateStr.split("T")[0]}T${time}`;
  const combinedDateTime = dayjs(dateTimeStr);
  return combinedDateTime;
}
  