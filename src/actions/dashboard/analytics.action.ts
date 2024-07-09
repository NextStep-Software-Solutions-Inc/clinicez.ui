import { mails } from './../../app/(process)/[organization]/appointments/mail/data';
"use server";

import prisma from "@lib/prisma";


export const getAnalyticsData = async (orgUid: string) => {
  const [userHealthCondition, userDisability] = await Promise.all([
    prisma.healthCondition.findMany({
      distinct: ['name'],
      take: 10,
      where: {
        isActive: true,
        UserHealthConditions:{
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
            User: {
              select: {
                gender: true,
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
      },
    }),
    prisma.disability.findMany({
      distinct: ['name'],
      take: 10,
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
