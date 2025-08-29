export type PrimaryAddress = {
  apartmentUnit?: string | null;
  bldgName?: string | null;
  street?: string | null;
  subdivision?: string | null;
  barangay?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  addressLine?: string | null;
}

export type PhilHealthRecordLite = {
  id: number;
  memberTypeId: number;
  pin?: string | null;
  philSysId?: string | null;
  tin?: string | null;
}

export type PhilHealthRecordBasic = {
  pin?: string | null;
  philSysId?: string | null;
  tin?: string | null;
  PhilHealthMemberType?: { name: string | null };
}

export type UserWithAddresses = {
  UserAddresses?: PrimaryAddress[];
}

export type UserWithPhilHealthRecord = {
  PhilHealthRecord: PhilHealthRecordLite[];
}

export type UserWithPhilHealthRecordBasic = {
  PhilHealthRecord: PhilHealthRecordBasic[];
}

export function hasUserAddresses(u: unknown): u is UserWithAddresses {
  return !!u && typeof u === "object" && "UserAddresses" in (u as Record<string, unknown>)
}

export function hasPhilHealthRecord(u: unknown): u is UserWithPhilHealthRecord {
  return !!u && typeof u === "object" && "PhilHealthRecord" in (u as Record<string, unknown>)
}

export function hasPhilHealthRecordBasic(u: unknown): u is UserWithPhilHealthRecordBasic {
  return !!u && typeof u === "object" && "PhilHealthRecord" in (u as Record<string, unknown>)
}

// Generate a unique case number.
export function generateCaseNumber(): string {
  // numeric case number
  // can have 0s or any other positive number as the leading digit
  const caseNumber = Math.floor(Math.random() * 1000000);
  return caseNumber.toString().padStart(12, '0');
}

// Generate a unique transaction number.
// alphanumeric and secure
export function generateTransactionNumber(): string {
  const prefix = 'TX';
  const suffix = 'H';
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const middleLength = 5;
  let middle = '';

  if (typeof crypto === 'undefined' || !crypto.getRandomValues) {
    throw new Error('Secure random number generation is not available in this environment.');
  }
  const randomValues = new Uint8Array(middleLength + 1);
  crypto.getRandomValues(randomValues);
  for (let i = 0; i < middleLength; i++) {
    middle += chars.charAt(randomValues[i] % chars.length);
  }
  const suffixDigit = (randomValues[middleLength] % 10).toString();
  return `${prefix}${middle}${suffix}${suffixDigit}`;
}