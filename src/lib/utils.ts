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

export const hasContextProperty = (context: unknown): context is { functionName: string, args: any[] } => {
  return typeof context === 'object' && context !== null && 'functionName' in context && 'args' in context;
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


export function convertStringToNumber(str: string | null): number | undefined {
  const num = Number(str);
  return Number.isNaN(num) ? undefined : num;
}


/**
 * Parses an object with string values to their respective types, including arrays
 * @param obj - Object to parse
 * @returns Object with parsed values
 * @example
 * const obj = { name: 'John', age: '25', isStudent: 'true', tags: '["a","b"]', scores: '[1,2,3]' };
 * const parsed = parseObject(obj);
 * console.log(parsed); // { name: 'John', age: 25, isStudent: true, tags: ['a','b'], scores: [1,2,3] }
 */
export const parseObject = (obj: Record<string, string | string[]>) => {
  const parsed: Record<string, string | number | boolean | Array<string | number>> = {};
  Object.entries(obj).forEach(([key, value]) => {
    // Try to parse as JSON array
    try {
      if (typeof value === "string") {
        const json = JSON.parse(value);
        if (Array.isArray(json)) {
          // If all elements are numbers, return as number[]
          if (json.every((el) => typeof el === "number")) {
            parsed[key] = json as number[];
          }
          // If all elements are strings, return as string[]
          else if (json.every((el) => typeof el === "string")) {
            parsed[key] = json as string[];
          }
          // Otherwise, leave as is (array of mixed types)
          else {
            parsed[key] = json;
          }
          return;
        }
      }
    } catch {
      // Not a JSON array, continue parsing as primitive
    }

    if (value === "true") {
      parsed[key] = true;
    } else if (value === "false") {
      parsed[key] = false;
    } else if (!isNaN(Number(value))) {
      parsed[key] = Number(value);
    } else {
      parsed[key] = value;
    }
  });
  return parsed;
};
export function searchParamsToObject(params: URLSearchParams) {
  const obj: Record<string, string | string[]> = {};
  for (const key of params.keys()) {
    const values = params.getAll(key);
    obj[key] = values.length > 1 ? values : values[0];
  }
  return obj;
}

export function generateSerialNumber(): string {
  const prefix = 'EZ';
  const suffixLetter = 'H';
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const middleLength = 5;
  let middle = '';

  const randomValues = new Uint8Array(middleLength + 1);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(randomValues);
    for (let i = 0; i < middleLength; i++) {
      middle += chars.charAt(randomValues[i] % chars.length);
    }
    const suffixDigit = (randomValues[middleLength] % 10).toString();
    return `${prefix}${middle}${suffixLetter}${suffixDigit}`;
  } else {
    for (let i = 0; i < middleLength; i++) {
      middle += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const suffixDigit = Math.floor(Math.random() * 10).toString();
    return `${prefix}${middle}${suffixLetter}${suffixDigit}`;
  }
}
