"use server";

import "server-only";
import prisma from "@lib/prisma";
import { cache } from "react";
import { withErrorHandling } from "@/lib/with-error-handling";
import { sessionCheck } from "@/lib/auth";
import { getCachedSession } from "@actions/session.action";

type CreateClinicPayload = {
  clinicUid: string;
  tenantUid: string;
  name: string;
  logo?: string;
}
export const createClinicAction = withErrorHandling(async (data: CreateClinicPayload) => {

  await sessionCheck();

  const { clinicUid, tenantUid, name, logo } = data;
  const newOrganization = await prisma.clinic.create({
    data: {
      Tenant: {
        connect: {
          tenantUid
        }
      },
      clinicUid,
      name,
      logo
    }
  });

  return { message: "Clinic created successfully", data: newOrganization };
});


export type GetClinicsFilters = {
  userId?: string;
  clinicUid?: string;
  orgUid?: string;
  isPublic?: boolean;
}

export type GetClinicsV2 = Awaited<ReturnType<typeof getClinicsV2Action>>;
export const getClinicsV2Action = withErrorHandling(
  cache(async (filters?: GetClinicsFilters) => {
    // No auth required for v2 public clinic list
    const { clinicUid, orgUid, isPublic } = filters || {};

    const clinics = await prisma.clinic.findMany({
      where: {
        isActive: true,
        ...(clinicUid ? { clinicUid } : {}),
        ...(orgUid
          ? {
            ClinicOrganizations: {
              some: {
                Organization: { orgUid },
              },
            },
          }
          : {}),
        ...(typeof isPublic === "boolean"
          ? {
            ClinicSetting: {
              isPublic,
            },
          }
          : {}),
      },
      select: {
        clinicUid: true,
        name: true,
        description: true,
        ClinicMembers: {
          where: { isActive: true },
          select: { id: true },
        },
      },
      orderBy: { name: "asc" },
    });

    return {
      message: "Clinics fetched successfully.",
      data: clinics.map((clinic) => ({
        clinicUid: clinic.clinicUid,
        name: clinic.name,
        description: clinic.description,
        memberCount: clinic.ClinicMembers.length,
      })),
    };

  })
);


export type GetClinics = Awaited<ReturnType<typeof getClinicsAction>>
export const getClinicsAction = withErrorHandling(cache(async (filters?: GetClinicsFilters) => {

  await sessionCheck();

  const { clinicUid, orgUid, isPublic, userId } = filters || {};
  const clinics = await prisma.clinic.findMany({
    orderBy: {
      name: "asc"
    },
    include: {
      Tenant: {
        select: {
          id: true,
          name: true,
        }
      },
      ClinicOrganizations: {
        include: {
          Organization: {
            select: {
              id: true,
              name: true,
              orgUid: true,
            }
          }
        }
      }
    },
    where: {
      ...userId ? {
        ClinicMembers: {
          some: {
            User: {
              userId
            },
          }
        },
        ClinicPatients: {
          some: {
            Patient: {
              userId
            }
          }
        }
      } : {},
      ClinicSetting: {
        ...isPublic ? { isPublic } : {}
      },
      ...clinicUid ? { clinicUid } : {},
      ...orgUid ? {
        ClinicOrganizations: {
          some: {
            Organization: {
              orgUid
            }
          }
        }
      } : {},
      isActive: true
    }
  });
  return { message: "Clinics fetched successfully", data: clinics };
}));

export type GetClinic = Awaited<ReturnType<typeof getClinicAction>>
export const getClinicAction = withErrorHandling(cache(async (key: string | number) => {

  await sessionCheck();

  const clinic = await prisma.clinic.findFirst({
    where: {
      isActive: true,
      OR: [
        { ...!isNaN(Number(key)) ? { id: Number(key) } : {} },
        { clinicUid: String(key) }
      ]
    },
    select: {
      id: true,
      clinicUid: true,
      name: true,
      description: true,
      customUrl: true,
      logo: true,
      email: true,
      updatedAt: true,
      Tenant: {
        select: {
          id: true,
          tenantUid: true
        }
      },
      ClinicSetting: true,
    }
  });
  return { message: "Clinic fetched successfully", data: clinic };
}))

type UpdateClinicPayload = {
  name: string;
  description?: string;
  logo: string;
  customUrl?: string;
  email: string;
  isPublic: boolean;
  sendEmailNotification: boolean;
  emailToClinicOnly: boolean;
  enableAppointment: boolean;
  enableConsultation: boolean;
}
export const updateClinicAction = withErrorHandling(async (clinicUid: string, data: UpdateClinicPayload) => {

  await sessionCheck();

  const { name, logo, description, customUrl, email, isPublic, sendEmailNotification, emailToClinicOnly, enableAppointment, enableConsultation } = data;

  const clinic = await prisma.clinic.update({
    where: { clinicUid, isActive: true },
    data: {
      name,
      description,
      logo,
      customUrl,
      email,
      ClinicSetting: {
        upsert: {
          where: {
            Clinic: {
              clinicUid
            }
          },
          create: {
            isPublic,
            sendEmailNotification,
            emailToClinicOnly,
            enableAppointment,
            enableConsultation,
          },
          update: {
            isPublic: data.isPublic,
            sendEmailNotification,
            emailToClinicOnly,
            enableAppointment,
            enableConsultation,
          }
        }
      }
    },
    include: {
      ClinicSetting: true,
    }
  });
  return { message: "Successfully updated clinic.", data: clinic };
})

type CreateLaboratoryRequestPayload = {
  name: string;
  age: number;
  address: string;
  hematology?: string[];
  clinicalMicroscopy?: string[];
  bloodChemistry?: string[];
  clinicUid: string;
};

export const createLaboratoryRequestAction = withErrorHandling(async (data: CreateLaboratoryRequestPayload) => {
  await sessionCheck();

  const { name, age, address, hematology, clinicalMicroscopy, bloodChemistry, clinicUid } = data;

  // Mock for now- only static. Need permission from sir Wave.
  const newLaboratoryRequest = null;

  return { message: "Laboratory request created successfully", data: newLaboratoryRequest };
});

/**
 * Get the user's default clinic, or first active clinic if no default is set
 */
export const getMyDefaultClinicAction = cache(
  withErrorHandling(async () => {
    const session = await getCachedSession();
    if (!session) throw new Error("User not authenticated.");

    // First, check if user has a default clinic through UserDefaultClinicRole
    const defaultClinicRole = await prisma.userDefaultClinicRole.findFirst({
      where: {
        User: {
          userId: session.user.sub
        },
        isActive: true
      },
      select: {
        Clinic: {
          select: {
            id: true,
            name: true,
            clinicUid: true
          }
        }
      }
    });

    if (defaultClinicRole) {
      return {
        message: "Default clinic retrieved",
        data: {
          Clinic: defaultClinicRole.Clinic
        }
      };
    }

    // Fallback: if no default clinic, get first active clinic membership
    const firstClinic = await prisma.clinicMember.findFirst({
      where: {
        User: {
          userId: session.user.sub
        },
        Clinic: {
          isActive: true
        },
        isActive: true,
        status: "ACTIVE",
        deletedAt: null
      },
      select: {
        Clinic: {
          select: {
            id: true,
            name: true,
            clinicUid: true
          }
        }
      },
      orderBy: {
        createdAt: "asc"
      }
    });

    if (!firstClinic) {
      return {
        message: "No active clinic memberships found",
        data: null
      };
    }

    return {
      message: "First clinic retrieved",
      data: {
        Clinic: firstClinic.Clinic
      }
    };
  })
);

export type GetClinicWithUserRole = Awaited<ReturnType<typeof getClinicWithUserRoleAction>>;
export const getClinicWithUserRoleAction = withErrorHandling(cache(async (clinicUid: string) => {
  const session = await getCachedSession();
  if (!session) throw new Error("User not authenticated");

  // Fetch the clinic
  const clinic = await prisma.clinic.findFirst({
    where: {
      isActive: true,
      clinicUid
    },
    select: {
      id: true,
      clinicUid: true,
      name: true,
      description: true,
      customUrl: true,
      logo: true,
      email: true
    }
  });

  if (!clinic) {
    throw new Error(`Clinic with UID ${clinicUid} not found`);
  }

  // Fetch user's role in this clinic (if they're a member)
  const clinicMember = await prisma.clinicMember.findFirst({
    where: {
      Clinic: {
        clinicUid
      },
      User: {
        userId: session.user.sub
      },
      isActive: true,
      status: "ACTIVE",
      deletedAt: null
    },
    select: {
      Role: {
        select: {
          id: true,
          name: true
        }
      }
    }
  });

  return {
    message: "Clinic with user role retrieved successfully",
    data: {
      clinic,
      userRole: clinicMember?.Role || null
    }
  };
}));

export type GetUserClinicsWithRoles = Awaited<ReturnType<typeof getUserClinicsWithRolesAction>>;
export const getUserClinicsWithRolesAction = withErrorHandling(cache(async () => {
  const session = await getCachedSession();
  if (!session) throw new Error("User not authenticated");

  // Fetch all clinics where user is an active member with their roles
  const clinicMemberships = await prisma.clinicMember.findMany({
    where: {
      User: {
        userId: session.user.sub
      },
      isActive: true,
      status: "ACTIVE",
      deletedAt: null,
      Clinic: {
        isActive: true
      }
    },
    select: {
      Clinic: {
        select: {
          id: true,
          clinicUid: true,
          name: true,
          logo: true
        }
      },
      Role: {
        select: {
          id: true,
          name: true
        }
      }
    },
    orderBy: {
      Clinic: {
        name: "asc"
      }
    }
  });

  const clinics = clinicMemberships.map(membership => ({
    id: membership.Clinic.id,
    clinicUid: membership.Clinic.clinicUid,
    name: membership.Clinic.name,
    logo: membership.Clinic.logo,
    role: membership.Role.name
  }));

  return {
    message: "User clinics with roles retrieved successfully",
    data: clinics
  };
}));