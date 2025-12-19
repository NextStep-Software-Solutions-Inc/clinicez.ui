/**
 * Generate a formatted transaction number
 * @param clinicId - Clinic ID
 * @param sequenceNumber - The sequence number
 * @param year - Year
 * @returns Formatted transaction number (e.g., "EKAS-2025-000123" or "EKAS-C123-2025-000456")
 */
export function formatTransactionNumber(
  clinicId: number | null,
  sequenceNumber: number,
  year: number
): string {
  const paddedSequence = sequenceNumber.toString().padStart(6, '0')
  if (clinicId) {
    return `EKAS-C${clinicId}-${year}-${paddedSequence}`
  }
  return `EKAS-${year}-${paddedSequence}`
}

/**
 * Generate a formatted authorization code
 * @param clinicId - Clinic ID
 * @param sequenceNumber - The sequence number
 * @param year - Year
 * @returns Formatted auth code (e.g., "PHK-2025-000123" or "PHK-C123-2025-000456")
 */
export function formatAuthorizationCode(
  clinicId: number | null,
  sequenceNumber: number,
  year: number
): string {
  const paddedSequence = sequenceNumber.toString().padStart(6, '0')
  if (clinicId) {
    return `PHK-C${clinicId}-${year}-${paddedSequence}`
  }
  return `PHK-${year}-${paddedSequence}`
}
