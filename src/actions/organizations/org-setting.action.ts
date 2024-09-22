"use server";
import "server-only";

import prismaCommon from "@lib/prisma-common";
import { Prisma } from '@prisma/common/client';
import { cache } from "react";

export const getOrgSettingsAction = cache(async (orgUid: string) => {
  try {
    const orgSetting = await prismaCommon.organizationSetting.findFirst({
      where: { Organization: { orgId: orgUid } }
    });
    return {
      status: true,
      message: "Org settings fetched successfully",
      data: orgSetting
    }
  } catch (error) {
    console.error(error);
    let errorMessage = "Error while fetching org settings";
    if(error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      errorMessage = "Organization not found";
    }
    return {
      status: false,
      message: errorMessage,
      data: null
    }
  }
});