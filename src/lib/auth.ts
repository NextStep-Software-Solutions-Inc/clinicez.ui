import { getCachedSession } from "@/actions/session.action";
import { decode } from "jsonwebtoken";

export function checkUserPermission(
  accessToken: string,
  permissions: string[] = []
): boolean {
  if (permissions.length === 0) return false;
  return permissions.every((permission) =>
    parseAccessToken(accessToken, "permissions").includes(permission)
  );
}

// lets create a function that parse the accessToken to get the permission claims
export function parseAccessToken(accessToken: string, claim: string): string[] {
  const payload = decode(accessToken, {
    json: true
  });
  if (payload && claim in payload) {
    return payload[claim];
  }
  return [];
}

export const sessionCheck = async () => {
  const session = await getCachedSession();
  if (!session) throw new Error("User not authenticated.");
  return session;
}