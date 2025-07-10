"use server";

import { managementClient } from "@services/auth0/management-client";

export const getRolesAction = async () => {
  const roles = await managementClient.roles.getAll();
  if(roles.status !== 200)
    throw new Error("Failed to get roles");
  return roles.data;
}

export const resendEmailVerificationAction = async (userId: string) => {
  const response = await managementClient.jobs.verifyEmail({ user_id: userId });

  return response.status === 200;
}

export const assignRolesAction = async (userId: string, role_ids: [string]) => {
  await managementClient.users.assignRoles({ id: userId}, {
    roles: role_ids
  })
}

type UpdateAuth0UserPayload = {
  family_name?: string;
  given_name?: string;
  name?: string;
  nickname?: string;
  picture?: string;
}
export const updateAuth0UserAction = async (userId: string, data: UpdateAuth0UserPayload) => {
  const { family_name, given_name, name, nickname, picture } = data;
  await managementClient.users.update({ id: userId }, {
    family_name,
    given_name,
    name,
    nickname,
    picture,
  });
}