import prisma from "@/lib/prisma"

/**
 * Custom error for sequence generation failures
 */
export class SequenceGenerationError extends Error {
  constructor(
    message: string,
    public entityType: string,
    public date: string,
    public clinicId?: number | null,
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

      // Check if it's a retryable error
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
 * Generate timestamp-based transaction number or authorization code
 * 
 * @param entityType - Type of entity (e.g., "EKAS_TRANSACTION", "EKAS_AUTH_CODE")
 * @param clinicId - Clinic ID (null for personal records)
 * @param options - Optional configuration
 * @returns The formatted transaction number or authorization code
 */
export async function generateTimestampTransactionNumber(
  entityType: 'EKAS_TRANSACTION' | 'EKAS_AUTH_CODE',
  clinicId?: number | null,
  options?: {
    maxRetries?: number;
    createdAt?: Date;
  }
): Promise<string> {
  const maxRetries = options?.maxRetries ?? 3;
  const date = options?.createdAt || new Date();
  const dateKey = getDateKey(date);

  const MAX_SEQUENCE_VALUE = 999999; // 6-digit limit

  const sequenceNumber = await withRetry(async () => {
    const result = await prisma.$transaction(async (tx) => {
      // Build the where clause
      const whereClause = {
        entityType,
        clinicId: clinicId ?? null,
        date: dateKey
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
            clinicId: clinicId ?? null,
            date: dateKey,
            currentValue: 1
          }
        })
        return 1
      }

      // Check if we've exceeded the limit
      if (sequence.currentValue >= MAX_SEQUENCE_VALUE) {
        throw new SequenceGenerationError(
          `Sequence limit exceeded for ${entityType} on ${dateKey}: ${sequence.currentValue}/${MAX_SEQUENCE_VALUE}`,
          entityType,
          dateKey,
          clinicId
        );
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
  }, maxRetries);

  // Format the number based on entity type
  const paddedSequence = sequenceNumber.toString().padStart(6, '0');

  if (entityType === 'EKAS_TRANSACTION') {
    if (clinicId) {
      return `EKAS-C${clinicId}-${dateKey}-${paddedSequence}`;
    }
    return `EKAS-${dateKey}-${paddedSequence}`;
  } else { // EKAS_AUTH_CODE
    if (clinicId) {
      return `PHK-C${clinicId}-${dateKey}-${paddedSequence}`;
    }
    return `PHK-${dateKey}-${paddedSequence}`;
  }
}

/**
 * Get or create the next sequence number for a given entity type, clinic, and date
 * (Legacy compatibility function)
 * 
 * @param entityType - Type of entity (e.g., "EKAS_TRANSACTION", "EKAS_AUTH_CODE")
 * @param clinicId - Clinic ID (null for personal records)
 * @param date - Date for the sequence (optional, defaults to today)
 * @returns The next sequence number
 */
export async function getNextSequenceNumber(
  entityType: string,
  clinicId: number | null,
  date?: Date
): Promise<number> {
  const dateKey = getDateKey(date);

  const result = await prisma.$transaction(async (tx) => {
    // Build the where clause
    const whereClause = {
      entityType,
      clinicId: clinicId,
      date: dateKey
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
          date: dateKey,
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
