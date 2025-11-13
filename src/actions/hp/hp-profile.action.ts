"use server";

import prisma from "@/lib/prisma";

export const getHPProfileAction = async (hpId: number) => {
  const hpProfile = await prisma.hPProfile.findUnique({
    where: {
      id: hpId,
      isActive: true,
    },
    select: {
      id: true,
      title: true,
      name: true,
      suffix: true,
      picture: true,
      specialties: true,
      educations: true,
      languages: true,
      experience: true,
      philosophy: true,
      HealthcareProvider: {
        select: {
          User: {
            select: {
              OrganizationMembers: {
                select: {
                  Organization: {
                    select: {
                      name: true,
                    }
                  }
                },
                take: 1,
              },
            },
          },
          HPType: {
            select: {
              name: true,
            },
          },
        },
      },
      workEmail: true,
      workPhone: true,
    },
  });

  return hpProfile;
}