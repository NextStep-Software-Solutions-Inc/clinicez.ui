export const SAFE_CLINIC_SETTING_SELECT = {
  id: true,
  clinicId: true,
  isPublic: true,
  sendEmailNotification: true,
  emailToClinicOnly: true,
  enableAppointment: true,
  enableConsultation: true,
  philhealthAccreditationNumber: true,
  facilityName: true,
  philhealthYakapPmccNumber: true,
  konsultaCertificationId: true,
} as const;

export type ClinicSettingSecretFields = {
  philhealthYakapUsername?: string | null;
  philhealthYakapPassword?: string | null;
  konsultaCipherKey?: string | null;
};

export type SanitizedClinicSetting<T extends ClinicSettingSecretFields> = Omit<
  T,
  "philhealthYakapUsername" | "philhealthYakapPassword" | "konsultaCipherKey"
> & {
  hasPhilhealthYakapUsername: boolean;
  hasPhilhealthYakapPassword: boolean;
};

export type CredentialUpdateResolution =
  | { action: "keep" }
  | { action: "clear"; value: null }
  | { action: "set"; value: string };

/**
 * Strips raw PhilHealth secret fields from a ClinicSetting payload before it
 * leaves server actions or API routes, replacing them with boolean presence flags.
 */
export function sanitizeClinicSetting<T extends ClinicSettingSecretFields>(
  setting: T,
): SanitizedClinicSetting<T>;
export function sanitizeClinicSetting<T extends ClinicSettingSecretFields>(
  setting: T | null,
): SanitizedClinicSetting<T> | null;
export function sanitizeClinicSetting<T extends ClinicSettingSecretFields>(
  setting: T | null,
): SanitizedClinicSetting<T> | null {
  if (!setting) {
    return null;
  }

  const clone = { ...setting };
  const hasPhilhealthYakapUsername = Boolean(
    clone.philhealthYakapUsername &&
      clone.philhealthYakapUsername.trim().length > 0,
  );
  const hasPhilhealthYakapPassword = Boolean(
    clone.philhealthYakapPassword &&
      clone.philhealthYakapPassword.trim().length > 0,
  );

  delete clone.philhealthYakapUsername;
  delete clone.philhealthYakapPassword;
  delete clone.konsultaCipherKey;

  return {
    ...(clone as Omit<
      T,
      "philhealthYakapUsername" | "philhealthYakapPassword" | "konsultaCipherKey"
    >),
    hasPhilhealthYakapUsername,
    hasPhilhealthYakapPassword,
  };
}

/**
 * Resolves tri-state credential input:
 * - `null`: explicit clear -> writes `null` to DB
 * - `undefined` or empty/whitespace-only string: untouched -> leaves DB unchanged
 * - non-empty string: replaces stored credential with the new value
 */
export function resolveCredentialUpdate(
  input: string | null | undefined,
  options?: { trim?: boolean },
): CredentialUpdateResolution {
  if (input === null) {
    return { action: "clear", value: null };
  }
  if (typeof input !== "string" || input.trim().length === 0) {
    return { action: "keep" };
  }
  return {
    action: "set",
    value: options?.trim ? input.trim() : input,
  };
}
