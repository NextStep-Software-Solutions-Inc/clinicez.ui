"use server";

import prisma from "@lib/prisma";


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
              Organizations: {
                some: {
                  Organization: {
                    orgId: orgUid
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
              Organizations: {
                some: {
                  Organization: {
                    orgId: orgUid
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
                  Organizations: {
                    some: {
                      Organization: {
                        orgId: orgUid
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
              Organizations: {
                some: {
                  Organization: {
                    orgId: orgUid
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
              Organizations: {
                some: {
                  Organization: {
                    orgId: orgUid
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
                  Organizations: {
                    some: {
                      Organization: {
                        orgId: orgUid
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
        Organizations: {
          some: {
            Organization: {
              orgId: orgUid
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
        Organizations: {
          some: {
            Organization: {
              orgId: orgUid
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
        Organizations: {
          some: {
            Organization: {
              orgId: orgUid
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