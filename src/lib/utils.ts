import { Badge } from "@components/ui/badge";
import { type ClassValue, clsx } from "clsx"
import { ComponentProps } from "react";
import { twMerge } from "tailwind-merge"
import dayjs from "dayjs";
import localizeFormat from "dayjs/plugin/localizedFormat"
dayjs.extend(localizeFormat)

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const capitalize = (str: string): string => {
  return str.replace(/\b\w/g, char => char.toUpperCase());
};

export const hasCodeProperty = (error: unknown): error is { code: string } => {
  return typeof error === 'object' && error !== null && 'code' in error;
}

export function getBadgeVariantFromLabel(
  label: string
): ComponentProps<typeof Badge>["variant"] {
  const badgeColors = {
    initial: "default",
    emergency: "destructive",
    "follow-up": "outline",
  } as const
  return badgeColors[label.toLowerCase() as keyof typeof badgeColors] ?? "default"
}

export const formatDateTime = (date: Date, time: Date): dayjs.Dayjs => {
  const actualHour = dayjs(time).hour();
  const actualMinute = dayjs(time).minute();
  const actualSecond = dayjs(time).second();
  const combinedDateTime = dayjs(date)
    .set("hours", actualHour)
    .set("minutes", actualMinute)
    .set("seconds", actualSecond)

  console.log({
    actualHour,
    actualMinute,
    actualSecond,
  });
    
  console.log({
    date: date,
    time: time,
    dateTime: combinedDateTime.toDate(),
    combinedDateTime: combinedDateTime.format("YYYY-MM-DD hh:mm:ss A")
  });
    
  return combinedDateTime;
}