import { Badge } from "@components/ui/badge";
import { type ClassValue, clsx } from "clsx"
import { ComponentProps } from "react";
import { twMerge } from "tailwind-merge"
import dayjs from "@lib/day-utils"

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


export function convertStringToNumber(str: string| null): number | undefined {
  const num = Number(str);
  return Number.isNaN(num) ? undefined : num;
}


/**
 * Parses an object with string values to their respective types
 * @param obj - Object to parse
 * @returns Object with parsed values
 * @example
 * const obj = { name: 'John', age: '25', isStudent: 'true' };
 * const parsed = parseObject(obj);
 * console.log(parsed); // { name: 'John', age: 25, isStudent: true }
 * @example
 * const obj = { name: 'John', age: '25', isStudent: 'false' };
 * const parsed = parseObject(obj);
 * console.log(parsed); // { name: 'John', age: 25, isStudent: false }
 */
export const parseObject = (obj: Record<string, string>) => {
  const parsed: Record<string, string | number | boolean> = {};
  Object.entries(obj).forEach(([key, value]) => {
    if (value === 'true') {
      parsed[key] = true;
    } else if (value === 'false') {
      parsed[key] = false;
    } else if (!isNaN(Number(value))) {
      parsed[key] = Number(value);
    } else {
      parsed[key] = value;
    }
  });
  return parsed;
};