import { auth, currentUser } from "@clerk/nextjs/server";

export interface SessionShape {
  user: {
    sub: string;
    id?: number;
    email?: string | null;
    given_name?: string | null;
    family_name?: string | null;
    external_id?: string | null;
  };
}

export interface TokenResponse {
  token: string | null;
}

/**
 * Get the current session with user information
 * 
 * Falls back to basic user info (userId only) if Clerk API fails.
 * This prevents the application from crashing due to Clerk API errors.
 * 
 * @returns SessionShape with user info, or null if not authenticated
 */
export const getSession = async (): Promise<SessionShape | null> => {
  const result = await auth();
  const { userId } = result;

  if (!userId) return null;

  try {
    const user = await currentUser();

    return {
      user: {
        sub: userId,
        id: undefined,
        email: user?.emailAddresses?.[0]?.emailAddress ?? null,
        given_name: user?.firstName ?? null,
        family_name: user?.lastName ?? null,
        external_id: user?.externalId ?? null,
      },
    };
  } catch (error) {
    // Log error but continue with basic user info
    console.error('Clerk API error in getSession:', error);
    
    // Return session with only userId - allows app to function with degraded info
    return {
      user: {
        sub: userId,
        id: undefined,
        email: null,
        given_name: null,
        family_name: null,
      },
    };
  }
};

export const getAccessToken = async (): Promise<TokenResponse> => {
  const result = await auth();
  const token = await result.getToken();
  return { token: token ?? null };
};