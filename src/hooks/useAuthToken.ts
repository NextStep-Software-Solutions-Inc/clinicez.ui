import { refreshTokensAction } from "@actions/auth.action";
// import { useUser } from "@clerk/nextjs"; // Commented out for Clerk migration
import { useUser } from "@clerk/nextjs";
import useSWR from "swr";

const fetcher = async (): Promise<{ type: string; token: string } | null> => {
  const token = await refreshTokensAction();
  if (!token) return null;

  return {
    type: "Bearer",
    token: token
  };
};

export const useAuthToken = () => {
  const { user, isLoaded } = useUser();

  const shouldFetch = !!user && isLoaded;

  return useSWR(
    shouldFetch ? 'auth-token' : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      refreshInterval: 0, // Only fetch when needed
      dedupingInterval: 60000, // Dedupe requests for 1 minute
    }
  );
};
