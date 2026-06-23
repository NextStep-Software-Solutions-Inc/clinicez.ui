export type StructuredKonsultaBatchDeficiency = {
  domainKey: string;
  domainLabel: string;
  batchEntryId: number;
  patientUserId: number;
  patientName: string;
  philHealthPin: string;
  consultationId: number | null;
  itemLabel: string;
  message: string;
};

type GeneratedDeficiencyContainer = {
  generatedDeficiencies?: unknown;
};

export function extractGeneratedKonsultaBatchDeficiencies(
  value: unknown,
): StructuredKonsultaBatchDeficiency[] {
  if (!value || typeof value !== "object") {
    return [];
  }

  const container = value as GeneratedDeficiencyContainer;
  if (!Array.isArray(container.generatedDeficiencies)) {
    return [];
  }

  return container.generatedDeficiencies.flatMap((entry) => {
    if (!entry || typeof entry !== "object") {
      return [];
    }

    const deficiency = entry as Record<string, unknown>;
    if (
      typeof deficiency.domainKey !== "string" ||
      typeof deficiency.domainLabel !== "string" ||
      typeof deficiency.batchEntryId !== "number" ||
      typeof deficiency.patientUserId !== "number" ||
      typeof deficiency.patientName !== "string" ||
      typeof deficiency.philHealthPin !== "string" ||
      typeof deficiency.itemLabel !== "string" ||
      typeof deficiency.message !== "string"
    ) {
      return [];
    }

    return [
      {
        domainKey: deficiency.domainKey,
        domainLabel: deficiency.domainLabel,
        batchEntryId: deficiency.batchEntryId,
        patientUserId: deficiency.patientUserId,
        patientName: deficiency.patientName,
        philHealthPin: deficiency.philHealthPin,
        consultationId:
          typeof deficiency.consultationId === "number"
            ? deficiency.consultationId
            : null,
        itemLabel: deficiency.itemLabel,
        message: deficiency.message,
      } satisfies StructuredKonsultaBatchDeficiency,
    ];
  });
}

export function summarizeGeneratedKonsultaBatchDeficiencies(
  deficiencies: StructuredKonsultaBatchDeficiency[],
): string | null {
  if (deficiencies.length === 0) {
    return null;
  }

  const groupedByDomain = new Map<string, number>();
  for (const deficiency of deficiencies) {
    groupedByDomain.set(
      deficiency.domainLabel,
      (groupedByDomain.get(deficiency.domainLabel) ?? 0) + 1,
    );
  }

  const summary = Array.from(groupedByDomain.entries())
    .map(([domainLabel, count]) => `${domainLabel} (${count})`)
    .join(", ");

  return `Optional mapping deficiencies detected: ${summary}. Review the grouped details below before validating this batch.`;
}
