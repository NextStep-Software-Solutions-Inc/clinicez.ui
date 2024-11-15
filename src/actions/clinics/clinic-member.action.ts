"use server";

import "server-only";
import prismaClient from "@/lib/prisma";
import { getCachedSession } from "../session.action";
import { withErrorHandling } from "@/lib/with-error-handling";

export type GetClinicMembers = Awaited<ReturnType<typeof getClinicMembersAction>>;
export const getClinicMembersAction = withErrorHandling(async (clinicUid: string) => {

  const session = await getCachedSession()
  if(!session) throw new Error("User not authenticated")
      
  const members = await prismaClient.clinicMember.findMany({
    where: {
      Clinic: {
        clinicUid
      }
    },
    select: {
      createdAt: true,
      Role:{
        select: {
          name: true
        }
      },
      User: {
        select: {
          email: true,
          firstName: true,
          lastName: true,
          middleName: true,
          suffix: true,
        }
      }
    }
  });
  return {message: "Successfully fetched clinic members.", data: members}
})