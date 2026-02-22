export type ReportPeriod =
  | "today"
  | "week"
  | "month"
  | "last3months"
  | "last6months"
  | "ytd"
  | "custom";

export const REPORT_PERIOD_LABELS: Record<ReportPeriod, string> = {
  today: "Today",
  week: "This Week",
  month: "This Month",
  last3months: "Last 3 Months",
  last6months: "Last 6 Months",
  ytd: "Year to Date",
  custom: "Custom Range",
};

/**
 * Returns a { from, to } date range for a given period preset.
 * Both dates have their time components set to the start/end of the day.
 */
export function getDateRangeForPeriod(period: ReportPeriod): {
  from: Date;
  to: Date;
} {
  const now = new Date();

  switch (period) {
    case "today": {
      const from = new Date(now);
      from.setHours(0, 0, 0, 0);
      const to = new Date(now);
      to.setHours(23, 59, 59, 999);
      return { from, to };
    }
    case "week": {
      const from = new Date(now);
      from.setDate(now.getDate() - now.getDay());
      from.setHours(0, 0, 0, 0);
      const to = new Date(now);
      to.setHours(23, 59, 59, 999);
      return { from, to };
    }
    case "last3months": {
      const from = new Date(now);
      from.setMonth(now.getMonth() - 3);
      from.setDate(1);
      from.setHours(0, 0, 0, 0);
      const to = new Date(now);
      to.setHours(23, 59, 59, 999);
      return { from, to };
    }
    case "last6months": {
      const from = new Date(now);
      from.setMonth(now.getMonth() - 6);
      from.setDate(1);
      from.setHours(0, 0, 0, 0);
      const to = new Date(now);
      to.setHours(23, 59, 59, 999);
      return { from, to };
    }
    case "ytd": {
      const from = new Date(now.getFullYear(), 0, 1);
      from.setHours(0, 0, 0, 0);
      const to = new Date(now);
      to.setHours(23, 59, 59, 999);
      return { from, to };
    }
    default: {
      // "month" — default
      const from = new Date(now.getFullYear(), now.getMonth(), 1);
      from.setHours(0, 0, 0, 0);
      const to = new Date(now);
      to.setHours(23, 59, 59, 999);
      return { from, to };
    }
  }
}

/**
 * Resolves a date range from URL search-param values.
 * Falls back to the current month when params are missing or invalid.
 */
export function getDateRangeFromParams(
  period?: string,
  fromStr?: string,
  toStr?: string
): { from: Date; to: Date } {
  if (period === "custom" && fromStr && toStr) {
    const from = new Date(fromStr);
    from.setHours(0, 0, 0, 0);
    const to = new Date(toStr);
    to.setHours(23, 59, 59, 999);
    if (!isNaN(from.getTime()) && !isNaN(to.getTime())) {
      return { from, to };
    }
  }

  const validPeriod = (
    ["today", "week", "month", "last3months", "last6months", "ytd"] as ReportPeriod[]
  ).includes(period as ReportPeriod)
    ? (period as ReportPeriod)
    : "month";

  return getDateRangeForPeriod(validPeriod);
}
