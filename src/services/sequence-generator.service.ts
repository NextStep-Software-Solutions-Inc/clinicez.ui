import prisma from "@/lib/prisma";

export type EntityType = "HEALTH_ASSESSMENT" | "CONSULTATION" | "PHILHEALTH_KONSULTA_T" | "PHILHEALTH_KONSULTA_E" | "PHILHEALTH_KONSULTA_P" | "PHILHEALTH_KONSULTA_S" | "PHILHEALTH_KONSULTA_R";

/**
 * Custom error for sequence generation failures
 */
export class SequenceGenerationError extends Error {
  constructor(
    message: string,
    public entityType: string,
    public date: string,
    public clinicId?: number,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'SequenceGenerationError';
  }
}

/**
 * Get date key in YYYYMMDD format
 */
function getDateKey(date?: Date): string {
  const d = date || new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

/**
 * Validate sequence generation input
 */
function validateSequenceInput(
  entityType: string,
  clinicId?: number
): void {
  const validEntityTypes: EntityType[] = ["HEALTH_ASSESSMENT", "CONSULTATION", "PHILHEALTH_KONSULTA_T", "PHILHEALTH_KONSULTA_E", "PHILHEALTH_KONSULTA_P", "PHILHEALTH_KONSULTA_S", "PHILHEALTH_KONSULTA_R"];
  if (!validEntityTypes.includes(entityType as EntityType)) {
    throw new SequenceGenerationError(
      `Invalid entity type: ${entityType}`,
      entityType,
      getDateKey()
    );
  }

  if (clinicId !== undefined && clinicId !== null) {
    if (clinicId <= 0 || !Number.isInteger(clinicId)) {
      throw new SequenceGenerationError(
        `Invalid clinic ID: ${clinicId}`,
        entityType,
        getDateKey(),
        clinicId
      );
    }
  }
}

/**
 * Retry logic with exponential backoff
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 100
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      // Check if it's a retryable error (transaction conflicts, deadlocks)
      const errorMessage = error instanceof Error ? error.message : String(error);
      const isRetryable =
        errorMessage.includes('Transaction') ||
        errorMessage.includes('deadlock') ||
        errorMessage.includes('lock timeout') ||
        errorMessage.includes('P2034') ||
        errorMessage.includes('P2028');

      if (!isRetryable || attempt === maxRetries - 1) {
        throw error;
      }

      // Exponential backoff with jitter
      const delay = Math.min(baseDelay * Math.pow(2, attempt), 5000);
      const jitter = Math.random() * 100;
      await new Promise(resolve => setTimeout(resolve, delay + jitter));
    }
  }

  throw new Error(`Failed after ${maxRetries} attempts: ${lastError?.message}`);
}

/**
 * Generate a unique timestamp-based case number
 * Format: "CONS-20260112-00001" or "HAFT-20260112-00123"
 * 
 * Uses a transaction to ensure atomicity and prevent race conditions
 * 
 * @param entityType - Type of entity ("HEALTH_ASSESSMENT" or "CONSULTATION")
 * @param clinicId - Optional clinic ID for clinic-specific sequences
 * @param options - Optional configuration
 * @returns Promise<string> - Formatted case number
 */
export async function generateTimestampCaseNumber(
  entityType: EntityType,
  clinicId?: number,
  options?: {
    maxRetries?: number;
    createdAt?: Date;
  }
): Promise<string> {
  // Validate input
  validateSequenceInput(entityType, clinicId);

  const maxRetries = options?.maxRetries ?? 3;
  const date = options?.createdAt || new Date();
  const dateKey = getDateKey(date);

  const MAX_SEQUENCE_VALUE = 99999; // 5-digit limit

  return withRetry(async () => {
    // Use transaction to ensure atomicity
    const sequence = await prisma.$transaction(async (tx) => {
      // Try to find existing sequence for this date
      let seq = await tx.sequenceGenerator.findFirst({
        where: {
          entityType,
          clinicId: clinicId ?? null,
          date: dateKey,
        },
      });

      // Create if doesn't exist
      if (!seq) {
        seq = await tx.sequenceGenerator.create({
          data: {
            entityType,
            clinicId: clinicId ?? null,
            date: dateKey,
            currentValue: 1,
          },
        });
        return seq;
      }

      // Check if we've exceeded the limit
      if (seq.currentValue >= MAX_SEQUENCE_VALUE) {
        throw new SequenceGenerationError(
          `Sequence limit exceeded for ${entityType} on ${dateKey}: ${seq.currentValue}/${MAX_SEQUENCE_VALUE}`,
          entityType,
          dateKey,
          clinicId
        );
      }

      // Increment and return
      return await tx.sequenceGenerator.update({
        where: { id: seq.id },
        data: { currentValue: { increment: 1 } },
      });
    });

    // Format: "CONS-20260112-00001" or "HAFT-20260112-00123"
    const prefix = entityType === "HEALTH_ASSESSMENT" ? "HAFT" : "CONS";
    const paddedNumber = String(sequence.currentValue).padStart(5, "0");

    return `${prefix}-${dateKey}-${paddedNumber}`;
  }, maxRetries);
}

export type PhilHealthTransType = "CASE" | "ENLISTMENT" | "PROFILING" | "SOAP" | "TRANSMITTAL";

/**
 * Generate a unique timestamp-based transaction number for PhilHealth Yakap
 * Format: 
 * CASE (T): T + ACCRE_NO + YYYYMM + 4-digit seq
 * ENLISTMENT (E): E + ACCRE_NO + YYYYMM + 5-digit seq
 * PROFILING (P): P + ACCRE_NO + YYYYMM + 5-digit seq
 * SOAP (S): S + ACCRE_NO + YYYYMM + 5-digit seq
 */
export async function generatePhilHealthKonsultaTransactionNumber(
  transType: PhilHealthTransType,
  accreNo: string,
  clinicId?: number,
  options?: {
    maxRetries?: number;
    createdAt?: Date;
  }
): Promise<string> {
  let entityType: EntityType;
  let prefixChar: string;
  let isCaseNo = false;

  switch (transType) {
    case "CASE": entityType = "PHILHEALTH_KONSULTA_T"; prefixChar = "T"; isCaseNo = true; break;
    case "ENLISTMENT": entityType = "PHILHEALTH_KONSULTA_E"; prefixChar = "E"; break;
    case "PROFILING": entityType = "PHILHEALTH_KONSULTA_P"; prefixChar = "P"; break;
    case "SOAP": entityType = "PHILHEALTH_KONSULTA_S"; prefixChar = "S"; break;
    case "TRANSMITTAL": entityType = "PHILHEALTH_KONSULTA_R"; prefixChar = "R"; break;
  }

  // Validate input
  validateSequenceInput(entityType, clinicId);

  if (!accreNo || accreNo.length !== 9) {
    throw new Error(`Invalid Accreditation Number: ${accreNo}. Must be exactly 9 characters.`);
  }

  const maxRetries = options?.maxRetries ?? 3;
  const date = options?.createdAt || new Date();

  // PhilHealth uses YYYYMM for resetting sequence numbers
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const dateKey = `${year}${month}`;

  // All PhilHealth transaction types (T, E, P, S, R) use 5-digit sequences (21 characters total)
  const MAX_SEQUENCE_VALUE = 99999;
  const padding = 5;

  return withRetry(async () => {
    // Use transaction to ensure atomicity
    const sequence = await prisma.$transaction(async (tx) => {
      // Try to find existing sequence for this YYYYMM
      let seq = await tx.sequenceGenerator.findFirst({
        where: {
          entityType,
          clinicId: clinicId ?? null,
          date: dateKey, // This resets every month
        },
      });

      // Create if doesn't exist
      if (!seq) {
        seq = await tx.sequenceGenerator.create({
          data: {
            entityType,
            clinicId: clinicId ?? null,
            date: dateKey,
            currentValue: 1,
          },
        });
        return seq;
      }

      // Check if we've exceeded the limit
      if (seq.currentValue >= MAX_SEQUENCE_VALUE) {
        throw new SequenceGenerationError(
          `Sequence limit exceeded for ${entityType} on ${dateKey}: ${seq.currentValue}/${MAX_SEQUENCE_VALUE}`,
          entityType,
          dateKey,
          clinicId
        );
      }

      // Increment and return
      return await tx.sequenceGenerator.update({
        where: { id: seq.id },
        data: { currentValue: { increment: 1 } },
      });
    });

    const paddedNumber = String(sequence.currentValue).padStart(padding, "0");
    return `${prefixChar}${accreNo}${dateKey}${paddedNumber}`;
  }, maxRetries);
}

/**
 * Get current sequence value without incrementing
 * 
 * @param entityType - Type of entity
 * @param clinicId - Optional clinic ID
 * @param date - Optional date (defaults to today)
 * @returns Promise<number> - Current sequence value
 */
export async function getCurrentSequenceValue(
  entityType: EntityType,
  clinicId?: number,
  date?: Date
): Promise<number> {
  const dateKey = getDateKey(date);

  const seq = await prisma.sequenceGenerator.findFirst({
    where: {
      entityType,
      clinicId: clinicId ?? null,
      date: dateKey,
    },
  });

  return seq?.currentValue ?? 0;
}

/**
 * Reset sequence for a given entity type and clinic (for testing purposes)
 * 
 * @param entityType - Type of entity
 * @param clinicId - Optional clinic ID
 * @param date - Optional date (defaults to today)
 * @returns Promise<void>
 */
export async function resetSequence(
  entityType: EntityType,
  clinicId?: number,
  date?: Date
): Promise<void> {
  const dateKey = getDateKey(date);

  await prisma.sequenceGenerator.deleteMany({
    where: {
      entityType,
      clinicId: clinicId ?? null,
      date: dateKey,
    },
  });
}

/**
 * Parse timestamp from a case number
 * 
 * @param caseNumber - Case number to parse (e.g., "CONS-20260112-00001")
 * @returns Date object or null if invalid format
 */
export function parseTimestampFromCaseNumber(caseNumber: string): Date | null {
  const parts = caseNumber.split('-');
  if (parts.length !== 3) return null;

  const dateStr = parts[1];
  if (dateStr.length !== 8) return null;

  const year = parseInt(dateStr.substring(0, 4), 10);
  const month = parseInt(dateStr.substring(4, 6), 10) - 1; // JS months are 0-indexed
  const day = parseInt(dateStr.substring(6, 8), 10);

  const date = new Date(year, month, day);

  // Validate the date is valid
  if (isNaN(date.getTime())) return null;

  return date;
}
