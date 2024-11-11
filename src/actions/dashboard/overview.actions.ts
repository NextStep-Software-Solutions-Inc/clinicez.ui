"use server";

import prisma from "@lib/prisma";

export const getDashboardData = async (clinicUid: string) => {
  const [files, memberships, members, roles] = await Promise.all([
    prisma.file.aggregate({
      where: {
        isActive: true,
        FileType: {
          FileTypeAttribute: {
            Clinic: {
              clinicUid
            } 
          }
        }
      },
      _count: true,
      _sum: {
        size: true
      }
    }),
    prisma.organizationMember.groupBy({
      by: ["status"],
      where: {
        Organization: {
          ClinicOrganizations: {
            some: {
              Clinic: {
                clinicUid
              }
            }
          }
        },
      },
      _count: {
        status: true,
        role: true,
        _all: true
      },
    }),
    prisma.user.count({
      where: {
        ClinicMembers: {
          some: {
            Clinic: {
              clinicUid
            }
          }
        }
      },
    }),
    prisma.organizationRole.findMany({
      orderBy: {
        name: "asc"
      },
      where: {
        Organization: {
          ClinicOrganizations: {
            some: {
              Clinic: {
                clinicUid
              }
            }
          }
        },
      },
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            OrganizationMembers: {
              where: {
                Organization: {
                  ClinicOrganizations: {
                    some: {
                      Clinic: {
                        clinicUid
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }),
  ])
  return {
    files,
    memberships,
    members,
    roles
  }
}