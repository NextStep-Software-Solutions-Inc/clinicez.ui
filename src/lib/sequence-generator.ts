"use server"

import prisma from "@/lib/prisma"

/**
 * Get or create the next sequence number for a given entity type, clinic, and year
 * @param entityType - Type of entity (e.g., "EKAS_TRANSACTION", "EKAS_AUTH_CODE")
 * @param clinicId - Clinic ID (null for personal records)
 * @param year - Year for the sequence
 * @returns The next sequence number
 */
export async function getNextSequenceNumber(
  entityType: string,
  clinicId: number | null,
  year: number
): Promise<number> {
  const result = await prisma.$transaction(async (tx) => {
    // Build the where clause
    const whereClause = {
      entityType,
      clinicId: clinicId,
      year
    }

    // Try to find existing sequence
    let sequence = await tx.sequenceGenerator.findFirst({
      where: whereClause
    })

    if (!sequence) {
      // Create new sequence starting at 1
      sequence = await tx.sequenceGenerator.create({
        data: {
          entityType,
          clinicId: clinicId,
          year,
          currentValue: 1
        }
      })
      return 1
    }

    // Increment and return
    const nextValue = sequence.currentValue + 1
    await tx.sequenceGenerator.update({
      where: { id: sequence.id },
      data: { currentValue: nextValue }
    })

    return nextValue
  })

  return result
}
