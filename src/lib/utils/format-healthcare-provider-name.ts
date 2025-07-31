interface HealthcareProviderProfile {
  hpProfile?: {
    title?: string | null
    name?: string | null
    suffix?: string | null
  },
  user?: {
    firstName?: string | null
    lastName?: string | null
  }
}

export function formatHealthcareProviderName({ hpProfile, user }: HealthcareProviderProfile) {
  // Try HP Profile first (title + name + suffix)
  if (hpProfile) {
    const hpName = [
      hpProfile.title, hpProfile.name, hpProfile.suffix
    ].filter(part => part && part.trim()).join(" ");

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
