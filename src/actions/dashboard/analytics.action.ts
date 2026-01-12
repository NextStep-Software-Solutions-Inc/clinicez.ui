"use server";

import prisma from "@lib/prisma";
import { Prisma } from "@prisma";


export async function resolveOrgUidFromClinicUid(clinicUid: string): Promise<string | null> {
  const org = await prisma.clinicOrganization.findFirst({
    where: {
      Clinic: {
        clinicUid
      }
    },
    select: {
      Organization: {
        select: {
          orgUid: true
        }
      }
    }
  });

  return org?.Organization?.orgUid ?? null;
}

export const getHealthAnalyticsData = async (orgUid: string) => {
  const [userHealthCondition, userDisability] = await Promise.all([
    prisma.healthCondition.findMany({
      take: 10,
      distinct: "name",
      orderBy: {
        UserHealthConditions: {
          _count: "desc"
        }
      },
      where: {
        isActive: true,
        UserHealthConditions: {
          some: {
            User: {
              OrganizationMembers: {
                some: {
                  Organization: {
                    orgUid
                  }
                }
              }
            }
          }
        }
      },
      select: {
        name: true,
        UserHealthConditions: {
          where: {
            User: {
              OrganizationMembers: {
                some: {
                  Organization: {
                    orgUid
                  }
                }
              }
            }
          },
          select: {
            User: {
              select: {
                gender: true
              }
            }
          }
        },
        _count: {
          select: {
            UserHealthConditions: {
              where: {
                User: {
                  OrganizationMembers: {
                    some: {
                      Organization: {
                        orgUid
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
    prisma.disability.findMany({
      take: 10,
      distinct: ["name"],
      orderBy: {
        UserDisabilities: {
          _count: 'desc'
        }
      },
      where: {
        isActive: true,
        UserDisabilities: {
          some: {
            User: {
              OrganizationMembers: {
                some: {
                  Organization: {
                    orgUid
                  }
                }
              }
            }
          }
        }
      },
      select: {
        name: true,
        UserDisabilities: {
          where: {
            User: {
              OrganizationMembers: {
                some: {
                  Organization: {
                    orgUid
                  }
                }
              }
            }
          },
          select: {
            User: {
              select: {
                gender: true,
              }
            }
          }
        },
        _count: {
          select: {
            UserDisabilities: {
              where: {
                User: {
                  OrganizationMembers: {
                    some: {
                      Organization: {
                        orgUid
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
    }), ,
  ])

  return {
    illness: userHealthCondition,
    disability: userDisability
  }
}


export const getPatientAnalyticsData = async (orgUid: string) => {
  const [genderStats, bloodTypeStats, civilStatusStats] = await Promise.all([
    prisma.user.groupBy({
      by: "gender",
      where: {
        OrganizationMembers: {
          some: {
            Organization: {
              orgUid
            }
          }
        }
      },
      _count: {
        gender: true,
        _all: true
      }
    }),
    prisma.user.groupBy({
      by: "bloodType",
      where: {
        OrganizationMembers: {
          some: {
            Organization: {
              orgUid
            }
          }
        }
      },
      _count: {
        bloodType: true,
        _all: true
      }
    }),
    prisma.user.groupBy({
      by: "civilStatus",
      where: {
        OrganizationMembers: {
          some: {
            Organization: {
              orgUid
            }
          }
        }
      },
      _count: {
        civilStatus: true,
        _all: true
      }
    })
  ])

  return {
    genderStats,
    bloodTypeStats,
    civilStatusStats
  }
}

export type GetDailyOrgMembershipRequest = Awaited<ReturnType<typeof getDailyOrgMembershipRequestAction>>;
export const getDailyOrgMembershipRequestAction = async (orgUid: string, startDate: string, endDate: string) => {
  const query = Prisma.sql`
    SELECT
      date,
      COUNT(CASE WHEN gender = 'MALE' THEN 1 END) AS total_male_request,
      COUNT(CASE WHEN gender = 'FEMALE' THEN 1 END) AS total_female_request
    FROM (
      SELECT DISTINCT
        u."id" as user_id,
        u."gender",
        DATE_TRUNC('day', om."createdAt") AS date
      FROM
        "OrganizationMember" om
      INNER JOIN "Organization" o ON om."organizationId" = o."id"
      INNER JOIN "User" u ON om."userId" = u."id"
      WHERE
        o."orgUid" = ${orgUid}
        AND om."createdAt" >= ${new Date(startDate)}
        AND om."createdAt" <= ${new Date(endDate)}
    ) AS unique_members
    GROUP BY date
    ORDER BY date ASC;
  `;

  const rawResult = await prisma.$queryRaw<
    { date: Date; total_male_request: bigint; total_female_request: bigint }[]
  >(query)

  return rawResult.map(row => ({
    date: row.date.toISOString().split('T')[0], // 'YYYY-MM-DD'
    total_male_request: Number(row.total_male_request),
    total_female_request: Number(row.total_female_request),
  }));
}