import { auth, currentUser } from "@clerk/nextjs/server";

export interface SessionShape {
  user: {
    sub: string;
    id?: number;
    email?: string | null;
    given_name?: string | null;
    family_name?: string | null;
  };
}

export interface TokenResponse {
  token: string | null;
}

export const getSession = async (): Promise<SessionShape | null> => {
  const result = await auth();
  const { userId } = result;

  if (!userId) return null;

  const user = await currentUser();

  return {
    user: {
      sub: userId,
      id: undefined,
      email: user?.emailAddresses?.[0]?.emailAddress ?? null,
      given_name: user?.firstName ?? null,
      family_name: user?.lastName ?? null,
    },
  };
};

export const getAccessToken = async (): Promise<TokenResponse> => {
  const result = await auth();
  const token = await result.getToken();
  return { token: token ?? null };
};