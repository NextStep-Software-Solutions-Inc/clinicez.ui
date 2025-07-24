export interface HealthcareProviderAuthResult {
  authorizedHpId: number;
  createdBy: number;
}

export interface UserWithHealthcareProviders {
  id: number;
  HealthcareProviders: {
    id: number;
    ProfessionalDetails: {
      licenseNumber: string | null;
      ptrNumber: string | null;
    } | null;
    HPProfile: {
      title: string | null;
      name: string | null;
      suffix: string | null;
      specialties: string[];
    } | null;
  }[];
}

/**
 * Validates healthcare provider authorization for clinical record creation
 * @param appUser - User object with healthcare provider data
 * @param hpIds - Array of healthcare provider IDs that are allowed for this operation
 * @param operationName - Name of the operation for error messages (e.g., "create medical certificates")
 * @returns Object containing the authorized HP ID and user ID for creation
 * @throws Error if authorization fails
 */
export function validateHealthcareProviderAuth(
  appUser: UserWithHealthcareProviders | null,
  hpIds: number[],
  operationName: string
): HealthcareProviderAuthResult {
  if (!appUser) {
    throw new Error("Session user id is missing or invalid");
  }

  // Check if user has healthcare provider records
  if (!appUser.HealthcareProviders || appUser.HealthcareProviders.length === 0) {
    throw new Error("User is not registered as a healthcare provider");
  }

  // Get the healthcare provider IDs of the logged-in user
  const userHpIds = appUser.HealthcareProviders.map(hp => hp.id);

  // Check if hpIds is provided and if any of user's HP IDs are in the allowed hpIds
  if (!hpIds || hpIds.length === 0) {
    throw new Error("Healthcare provider IDs are required");
  }

  const authorizedHpIds = userHpIds.filter(hpId => hpIds.includes(hpId));
  if (authorizedHpIds.length === 0) {
    throw new Error(`You are not authorized to ${operationName} for the specified healthcare providers`);
  }

  // Use the first authorized healthcare provider ID
  const authorizedHpId = authorizedHpIds[0];
  const createdBy = appUser.id;

  return {
    authorizedHpId,
    createdBy
  };
}

/**
 * Standard select clause for fetching user with healthcare provider data
 * This ensures consistency across all queries that need healthcare provider authorization
 */
export const USER_WITH_HEALTHCARE_PROVIDERS_SELECT = {
  id: true,
  HealthcareProviders: {
    select: {
      id: true,
      ProfessionalDetails: {
        select: {
          licenseNumber: true,
          ptrNumber: true,
        }
      },
      HPProfile: {
        select: {
          title: true,
          name: true,
          suffix: true,
          specialties: true,
        }
      }
    }
  }
} as const;
