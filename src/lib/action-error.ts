/**
 * Utilities for extracting and formatting error messages from server action results.
 *
 * Server actions wrapped with `withErrorHandling` always return
 * `{ status: boolean; message: string; data: T | null }`.
 * These helpers make it easy for client components to surface the
 * specific, server-provided error message in toast notifications.
 */

/** Shape returned by every `withErrorHandling`-wrapped server action. */
interface ActionResult {
  status: boolean;
  message: string;
  data: unknown;
}

/**
 * Extract a human-readable error message from a server action result,
 * a caught Error, or an unknown value.
 *
 * @param error - The value to extract a message from.  Can be an
 *   `ActionResult` (with `status === false`), an `Error`, a plain
 *   string, or anything else.
 * @param fallback - Returned when no meaningful message can be
 *   determined.  Defaults to `"An unexpected error occurred"`.
 */
export function getActionErrorMessage(
  error: unknown,
  fallback = "An unexpected error occurred",
): string {
  if (error === null || error === undefined) return fallback;

  // Server action result object  { status, message, data }
  if (isActionResult(error)) {
    return error.message || fallback;
  }

  // Standard Error instance
  if (error instanceof Error) {
    return error.message || fallback;
  }

  // Plain string
  if (typeof error === "string" && error.length > 0) {
    return error;
  }

  return fallback;
}

/**
 * Collect specific error messages from a `Promise.allSettled` batch
 * where each settled result wraps an `ActionResult`.
 *
 * Returns an array of error messages — one per failed promise.
 * A promise is considered failed if it was rejected **or** if it
 * fulfilled with `status === false`.
 */
export function getSettledErrors(
  results: PromiseSettledResult<ActionResult>[],
): string[] {
  const errors: string[] = [];

  for (const r of results) {
    if (r.status === "rejected") {
      errors.push(getActionErrorMessage(r.reason));
    } else if (!r.value?.status) {
      errors.push(r.value?.message || "An unexpected error occurred");
    }
  }

  return errors;
}

// ── internal ──────────────────────────────────────────────────────────

function isActionResult(value: unknown): value is ActionResult {
  return (
    typeof value === "object" &&
    value !== null &&
    "status" in value &&
    "message" in value
  );
}
