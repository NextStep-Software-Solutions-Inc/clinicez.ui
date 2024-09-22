"use server";
import "server-only";

import prismaCommon from "@lib/prisma-common"
import { Prisma } from '@prisma/common/client';
import { cache } from "react";

export const getOrgConsultationConfigAction = cache(async (orgUid: string) => {
  try {
    const orgConsultationConfig = await prismaCommon.orgConsultationConfig.findFirstOrThrow({
      where: {
        Organization: {
          orgId: orgUid
        }
      },
      select: {
        NoteTemplate: {
          select: {
            name: true,
            NoteSections: {
              where: {
                isActive: true,
              },
              select: {
                id: true,
                name: true,
                description: true,
              }
            }
          }
        },
      }
    });
    return {
      status: true,
      message: "Org consultation config fetched successfully",
      data: orgConsultationConfig
    }
  } catch (error) {
    console.error(error);
    let errorMessage = "Error while fetching org consultation config";
    if(error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      errorMessage = "Organization not found";
    }
    return {
      status: false,
      message: errorMessage,
      data: null
    }
  }
})