"use server";

import "server-only";
import prismaCommon from "@lib/prisma-common";
import { getCachedSession } from "@actions/session.action";
import { getPermissionsAction } from "@actions/permission.action";
import { PERMISSIONS } from "@lib/permissions";


export type GetMyUserPreference = Awaited<ReturnType<typeof getMyUserPreferenceAction>>;
export const getMyUserPreferenceAction = async () => {
  const session = await getCachedSession();
  try {
    if(!session) throw new Error("User not authenticated.");
    const userPreference = await prismaCommon.userPreference.findFirstOrThrow({
      where: {
        User: {
          userId: session.user.sub
        }
      },
      include: {
        HealthCareProvider: {
          select: {
            id: true,
            type: true
          }
        }
      }
    });
    return {
      status: true,
      message: "User preference fetched successfully.",
      data: userPreference
    }
  } catch (error) {
    console.error(`Error fetching user preference: ${error}`);
    let message = "An error occurred while fetching user preference.";
    if (error instanceof Error) {
      message = error.message;
    }
    return {
      status: false,
      message,
      data: null
    }
  };
};

type UpsertUserPreferencePayload = {
    userPreferenceId: number;
    autoAcceptAppointmentAssignment: boolean;
    autoAssignAppointmentToSelf: boolean;
    defaultHpId?: number;
}
export const upsertMyUserPreference = async (payload: UpsertUserPreferencePayload) => {
    
  const session = await getCachedSession();

  try {
    if(!session) throw new Error("User not authenticated.");

    const myPermission = await getPermissionsAction({userId: session.user.sub, type: "USER"});
    const myPermissionArray = myPermission.map(permission => permission.name);
    const upsertUserPreferencePermissions = [PERMISSIONS.USER["UPSERT:USER-PREFERENCE:OWN"].name];
    
    const canUpsertUserPreference = upsertUserPreferencePermissions.some(permission => myPermissionArray.includes(permission));

    if(!canUpsertUserPreference) throw new Error("You do not have permission to update user preference.");

    const { defaultHpId, autoAssignAppointmentToSelf, autoAcceptAppointmentAssignment } = payload;
    const userPreference = await prismaCommon.userPreference.upsert({
      where: {
        id: payload.userPreferenceId,
        User: {
          userId: session.user.sub
        }
      },
      create: {
        User: {
          connect: {
            userId: session.user.sub
          }
        },
        ...autoAssignAppointmentToSelf ? {
          HealthCareProvider: {
            connect: {
              id: defaultHpId
            }
          }
        } : {},
        autoAcceptAppointmentAssignment: autoAcceptAppointmentAssignment,
        autoAssignAppointmentToSelf: autoAssignAppointmentToSelf,
      },
      update: {
        ...autoAssignAppointmentToSelf ? {defaultHpId } : {defaultHpId: null},
        autoAcceptAppointmentAssignment: autoAcceptAppointmentAssignment,
        autoAssignAppointmentToSelf: autoAssignAppointmentToSelf
      }
    })
    
    return {
      status: true,
      message: "User preference updated successfully.",
      data: userPreference
    }
  } catch (error) {
    console.error(`Error upserting user preference: ${error}`);
    let message = "An error occurred while updating user preference.";
    if (error instanceof Error) {
      message = error.message;
    }
    return {
      status: false,
      message,
      data: null
    }
    
  }
};