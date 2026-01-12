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
 * Generate a formatted transaction number (timestamp-based)
 * @param clinicId - Clinic ID
 * @param sequenceNumber - The sequence number
 * @param date - Date for the transaction (optional, defaults to today)
 * @returns Formatted transaction number (e.g., "EKAS-20260112-000123" or "EKAS-C123-20260112-000456")
 */
export function formatTransactionNumber(
  clinicId: number | null,
  sequenceNumber: number,
  date?: Date
): string {
  const dateKey = getDateKey(date);
  const paddedSequence = sequenceNumber.toString().padStart(6, '0');
  
  if (clinicId) {
    return `EKAS-C${clinicId}-${dateKey}-${paddedSequence}`;
  }
  return `EKAS-${dateKey}-${paddedSequence}`;
}

/**
 * Generate a formatted authorization code (timestamp-based)
 * @param clinicId - Clinic ID
 * @param sequenceNumber - The sequence number
 * @param date - Date for the authorization (optional, defaults to today)
 * @returns Formatted auth code (e.g., "PHK-20260112-000123" or "PHK-C123-20260112-000456")
 */
export function formatAuthorizationCode(
  clinicId: number | null,
  sequenceNumber: number,
  date?: Date
): string {
  const dateKey = getDateKey(date);
  const paddedSequence = sequenceNumber.toString().padStart(6, '0');
  
  if (clinicId) {
    return `PHK-C${clinicId}-${dateKey}-${paddedSequence}`;
  }
  return `PHK-${dateKey}-${paddedSequence}`;
}

/**
 * Parse timestamp from a transaction number
 * 
 * @param transactionNumber - Transaction number to parse (e.g., "EKAS-20260112-000001" or "EKAS-C123-20260112-000001")
 * @returns Date object or null if invalid format
 */
export function parseTimestampFromTransactionNumber(transactionNumber: string): Date | null {
  const parts = transactionNumber.split('-');
  
  // Handle both formats: EKAS-DATE-SEQ and EKAS-CLINIC-DATE-SEQ
  let dateStr: string;
  if (parts.length === 3) {
    // Format: EKAS-20260112-000001
    dateStr = parts[1];
  } else if (parts.length === 4) {
    // Format: EKAS-C123-20260112-000001
    dateStr = parts[2];
  } else {
    return null;
  }

  if (dateStr.length !== 8) return null;

  const year = parseInt(dateStr.substring(0, 4), 10);
  const month = parseInt(dateStr.substring(4, 6), 10) - 1; // JS months are 0-indexed
  const day = parseInt(dateStr.substring(6, 8), 10);

  const date = new Date(year, month, day);
  
  // Validate the date is valid
  if (isNaN(date.getTime())) return null;
  
  return date;
}
