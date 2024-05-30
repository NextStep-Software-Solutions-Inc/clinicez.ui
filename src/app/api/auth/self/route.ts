import { getRolesAction } from "@actions/user-management.action";

export const GET = async () => {
  const roles = await getRolesAction();
  return Response.json(roles);
};