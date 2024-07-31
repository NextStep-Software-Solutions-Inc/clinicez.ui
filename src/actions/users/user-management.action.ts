"use server";

import { managementClient } from "@services/auth0/management-client";

export const getRolesAction = async () => {
  const roles = await managementClient.roles.getAll();
  if(roles.status !== 200)
    throw new Error("Failed to get roles");
  return roles.data;
}

export const assignRolesAction = async (user_id: string, role_ids: [string]) => {
  await managementClient.users.assignRoles({ id: user_id}, {
    roles: role_ids
  })
}