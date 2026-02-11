/**
 * Compare two objects and return an array of field-level changes.
 * Only includes fields where the value has actually changed.
 */
export function diffFields(
  previous: Record<string, unknown>,
  updated: Record<string, unknown>,
  fields: string[]
): { fieldName: string; previousValue?: string; newValue?: string }[] {
  const changes: {
    fieldName: string;
    previousValue?: string;
    newValue?: string;
  }[] = [];

  for (const field of fields) {
    const prev = previous[field];
    const next = updated[field];

    const prevStr = prev == null ? undefined : String(prev);
    const nextStr = next == null ? undefined : String(next);

    if (prevStr !== nextStr) {
      changes.push({
        fieldName: field,
        previousValue: prevStr,
        newValue: nextStr,
      });
    }
  }

  return changes;
}
