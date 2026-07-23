/**
 * Reusable Masking & Formatting Utilities for Patient Forms
 */

/**
 * Format PhilHealth PIN: XX-XXXXXXXXX-X (12 digits total)
 */
export function formatPhilHealthPin(val: string | null | undefined): string {
  if (!val) return '';
  const digits = val.replace(/\D/g, '').slice(0, 12);
  let formatted = '';
  if (digits.length > 0) {
    formatted = digits.slice(0, 2);
  }
  if (digits.length > 2) {
    formatted += '-' + digits.slice(2, 11);
  }
  if (digits.length > 11) {
    formatted += '-' + digits.slice(11, 12);
  }
  return formatted;
}

/**
 * Strip hyphens/spaces to store clean raw digits
 */
export function unmaskDigits(val: string | null | undefined): string {
  if (!val) return '';
  return val.replace(/\D/g, '');
}

/**
 * Format PhilSys ID: XXXX-XXXX-XXXX-XXXX (16 digits total)
 */
export function formatPhilSysId(val: string | null | undefined): string {
  if (!val) return '';
  const digits = val.replace(/\D/g, '').slice(0, 16);
  const parts: string[] = [];
  for (let i = 0; i < digits.length; i += 4) {
    parts.push(digits.slice(i, i + 4));
  }
  return parts.join('-');
}

/**
 * Format TIN: XXX-XXX-XXX-XXX (9 or 12 digits total)
 */
export function formatTin(val: string | null | undefined): string {
  if (!val) return '';
  const digits = val.replace(/\D/g, '').slice(0, 12);
  const parts: string[] = [];
  for (let i = 0; i < digits.length; i += 3) {
    parts.push(digits.slice(i, i + 3));
  }
  return parts.join('-');
}

/**
 * Format Mobile / Phone: 09XX-XXX-XXXX (11 digits)
 */
export function formatMobileNumber(val: string | null | undefined): string {
  if (!val) return '';
  const digits = val.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 4) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  return `${digits.slice(0, 4)}-${digits.slice(4, 7)}-${digits.slice(7)}`;
}
