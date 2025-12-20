import prisma from "@/lib/prisma";

export type EntityType = "HEALTH_ASSESSMENT" | "CONSULTATION";

/**
 * Generate a unique case number for the given entity type and optional clinic
 * Format: "2025-HAF-0001" or "2025-CONS-0001"
 * 
 * Uses a transaction to ensure atomicity and prevent race conditions
 * 
 * @param entityType - Type of entity ("HEALTH_ASSESSMENT" or "CONSULTATION")
 * @param clinicId - Optional clinic ID for clinic-specific sequences
 * @returns Promise<string> - Formatted case number
 */
export async function generateCaseNumber(
  entityType: EntityType,
  clinicId?: number
): Promise<string> {
  const year = new Date().getFullYear();

  // Use transaction to ensure atomicity
  const sequence = await prisma.$transaction(async (tx) => {
    // Try to find existing sequence
    let seq = await tx.sequenceGenerator.findFirst({
      where: {
        entityType,
        clinicId: clinicId ?? null,
        year,
      },
    });

    // Create if doesn't exist
    if (!seq) {
      seq = await tx.sequenceGenerator.create({
        data: {
          entityType,
          clinicId: clinicId ?? null,
          year,
          currentValue: 1,
        },
      });
      return seq;
    }

    // Increment and return
    return await tx.sequenceGenerator.update({
      where: { id: seq.id },
      data: { currentValue: { increment: 1 } },
    });
  });

  // Format: "2025-HAF-0001" or "2025-CONS-0001"
  const prefix = entityType === "HEALTH_ASSESSMENT" ? "HAF" : "CONS";
  const paddedNumber = String(sequence.currentValue).padStart(4, "0");

  return `${year}-${prefix}-${paddedNumber}`;
}

/**
 * Get current sequence value without incrementing
 * 
 * @param entityType - Type of entity
 * @param clinicId - Optional clinic ID
 * @returns Promise<number> - Current sequence value
 */
export async function getCurrentSequenceValue(
  entityType: EntityType,
  clinicId?: number
): Promise<number> {
  const year = new Date().getFullYear();

  const seq = await prisma.sequenceGenerator.findFirst({
    where: {
      entityType,
      clinicId: clinicId ?? null,
      year,
    },
  });

  return seq?.currentValue ?? 0;
}

/**
 * Reset sequence for a given entity type and clinic (for testing purposes)
 * 
 * @param entityType - Type of entity
 * @param clinicId - Optional clinic ID
 * @returns Promise<void>
 */
export async function resetSequence(
  entityType: EntityType,
  clinicId?: number
): Promise<void> {
  const year = new Date().getFullYear();

  await prisma.sequenceGenerator.deleteMany({
    where: {
      entityType,
      clinicId: clinicId ?? null,
      year,
    },
  });
}
