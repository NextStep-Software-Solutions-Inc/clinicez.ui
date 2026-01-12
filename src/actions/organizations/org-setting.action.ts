"use server";
import "server-only";

import prisma from "@lib/prisma";
import { cache } from "react";
import { getCachedSession } from "@actions/session.action";
import { hasCodeProperty } from "@lib/utils";

export type GetOrgSetting = Awaited<ReturnType<typeof getOrgSettingAction>>
export const getOrgSettingAction = cache(async (orgUid: string) => {

  let message = "Org settings fetched successfully";
  try {

    const session = await getCachedSession();
    if (!session) throw new Error("User not authenticated.");

    const orgSetting = await prisma.organizationSetting.findFirst({
      where: { Organization: { orgUid } },
    });
    return { status: true, message, data: orgSetting }
  } catch (error) {
    console.error(error);
    message = "Error while fetching org settings";
    if (hasCodeProperty(error) && error.code === 'P2025') message = "Organization not found";
    return { status: false, message: message, data: null }
  }
});

type UpsertOrganizationSetting = {
  sendEmailNotification?: boolean;
  emailToOrgOnly?: boolean;
}
export const updateOrgSettingsAction = async (orgSettingId: number, { sendEmailNotification, emailToOrgOnly }: UpsertOrganizationSetting) => {

  let message = "Organization settings updated successfully";
  try {

    const session = await getCachedSession();
    if (!session) throw new Error("User not authenticated.");

    const orgSetting = await prisma.organizationSetting.update({
      where: {
        id: orgSettingId
      },
      data: {
        sendEmailNotification,
        emailToOrgOnly
      }
    });
    return { status: true, message, data: orgSetting }
  } catch (error) {
    console.error(`Error updating org settings: ${error}`);
    message = "Error while updating org settings";
    if (error instanceof Error) message = error.message;
    return { status: false, message, data: null }
  }
};