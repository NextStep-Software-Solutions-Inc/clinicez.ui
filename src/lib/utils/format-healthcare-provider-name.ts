// Formats a healthcare provider's name with fallbacks to user information
export function formatHealthcareProviderName(
  hpProfile?: {
    title?: string | null;
    name?: string | null;
    suffix?: string | null;
  },
  user?: {
    firstName?: string | null;
    lastName?: string | null;
  }
): string {
  // Try HP Profile first (title + name + suffix)
  if (hpProfile) {
    const hpName = [
      hpProfile.title, hpProfile.name, hpProfile.suffix
    ].filter(Boolean).join(" ");

    if (hpName) {
      return hpName;
    }
  }

  // Fallback to user's full name
  if (user) {
    const userName = [
      user.firstName, user.lastName
    ].filter(Boolean).join(" ");

    if (userName) {
      return userName;
    }
  }

  // Final fallback
  return "N/A";
}
