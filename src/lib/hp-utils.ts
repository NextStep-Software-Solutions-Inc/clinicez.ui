
export function extractExperienceYears(experience: string | undefined): string {
  if (!experience) return "0";
  const match = experience.match(/(\d+)/);
  return match ? match[1] : "0";
}

/**
 * Healthcare Provider utility functions
 */

type HPProfile = {
  title?: string | null;
  name?: string | null;
  suffix?: string | null;
};

type HPUser = {
  firstName?: string | null;
  middleName?: string | null;
  lastName?: string | null;
  suffix?: string | null;
};

type HealthcareProviderWithProfile = {
  HPProfile?: HPProfile | null;
  User?: HPUser | null;
};

/**
 * Get the display name for a healthcare provider.
 * Prefers the professional profile name, falls back to user name.
 * 
 * @param hp - Healthcare provider with profile and user information
 * @returns Formatted display name or "Unknown" if no name data is available
 */
export function getHealthcareProviderName(hp: HealthcareProviderWithProfile | null | undefined): string {
  if (!hp) return "Unknown";
  
  // Try professional profile first
  const title = hp.HPProfile?.title ?? "";
  const name = hp.HPProfile?.name ?? "";
  const suffix = hp.HPProfile?.suffix ?? "";
  const professionalName = `${title} ${name} ${suffix}`.replace(/\s+/g, " ").trim();
  
  if (professionalName) return professionalName;
  
  // Fall back to user name
  const firstName = hp.User?.firstName ?? "";
  const middleName = hp.User?.middleName ?? "";
  const lastName = hp.User?.lastName ?? "";
  const userSuffix = hp.User?.suffix ?? "";
  const userName = `${firstName} ${middleName} ${lastName} ${userSuffix}`.replace(/\s+/g, " ").trim();
  
  return userName || "Unknown";
}
