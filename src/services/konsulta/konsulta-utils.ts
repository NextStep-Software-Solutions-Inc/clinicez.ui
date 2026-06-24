import { Prisma } from "@prisma/client";

/**
 * Gets the next auto-incrementing sequence number for a given entity type in a specific YYYYMM period.
 * Uses the database SequenceGenerator model.
 * 
 * @param tx Prisma transaction client
 * @param entityType The type of sequence (e.g. "KONSULTA_CASE" or "KONSULTA_TRANS")
 * @param clinicId The clinic ID
 * @param date The date to extract the YYYYMM period from
 */
export async function getNextKonsultaSequence(
  tx: Prisma.TransactionClient,
  entityType: string,
  clinicId: number,
  date: Date
): Promise<number> {
  const dateKey = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}`;
  
  let sequence = await tx.sequenceGenerator.findFirst({
    where: { entityType, clinicId, date: dateKey }
  });

  if (!sequence) {
    sequence = await tx.sequenceGenerator.create({
      data: { entityType, clinicId, date: dateKey, currentValue: 1 }
    });
    return 1;
  }

  const nextValue = sequence.currentValue + 1;
  await tx.sequenceGenerator.update({
    where: { id: sequence.id },
    data: { currentValue: nextValue }
  });

  return nextValue;
}

import { formatKonsultaHciNumber } from "@/lib/format-sequence";

/**
 * Generates a PhilHealth Case Number (pHciCaseNo)
 * Format: [PREFIX] + ACCRE_NO + YYYYMM + 5 digits series number
 */
export function generateKonsultaCaseNo(accreNo: string, date: Date, sequenceNumber: number, prefix: string = "T"): string {
  return formatKonsultaHciNumber(prefix as any, accreNo, sequenceNumber, date);
}

/**
 * Generates a PhilHealth Transaction Number (pHciTransNo)
 * Format: [PREFIX] + ACCRE_NO + YYYYMM + 5 digits series number
 */
export function generateKonsultaTransNo(accreNo: string, date: Date, sequenceNumber: number, prefix: string = "E"): string {
  return formatKonsultaHciNumber(prefix as any, accreNo, sequenceNumber, date);
}
