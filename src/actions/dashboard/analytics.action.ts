"use server";

import prisma from "@lib/prisma";
import { Prisma } from "@prisma/client";

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
            User:{
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
        UserDisabilities:{
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
    }),,
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
export const getDailyOrgMembershipRequestAction = async (orgUid: string, startDate:string, endDate: string) => {
  const query = Prisma.sql`
    SELECT
      DATE_TRUNC('day', uo."createdAt") as date,
      COUNT(*) as total_requests
    FROM
      "UserOrganization" uo
    INNER JOIN 
      "Organization" o ON uo."organizationId" = o."id"
    WHERE
      o."orgId" = ${Prisma.raw(`'${orgUid}'`)} -- Correctly parameterized
        AND uo."createdAt" >= ${Prisma.raw(`'${startDate}'`)} -- Start date filter
        AND uo."createdAt" <= ${Prisma.raw(`'${endDate}'`)} -- End date filter
      -- AND uo."status" NOT IN ('PENDING') -- Uncomment if needed
    GROUP BY
      DATE_TRUNC('day', uo."createdAt")
    ORDER BY
      date ASC;
  `;
  const dailyMembershipRequest = await prisma.$queryRaw(query, orgUid);
  return dailyMembershipRequest as { date: Date, total_requests: BigInt }[];
}