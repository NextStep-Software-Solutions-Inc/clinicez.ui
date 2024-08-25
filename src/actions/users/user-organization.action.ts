"use server";

import "server-only";
import fs from "fs/promises";
import { sendMail } from "@actions/email.action";
import { getCachedSession } from "@actions/session.action";
import prisma from "@lib/prisma-common";
import { isOrgAdmin } from "@lib/protect-org";
import { UserOrganizationStatus, Prisma } from "@prisma/common/client";
import path from "path";
import { cache } from "react";

export type GetUserOrgFilterType = {
    userId?: string | null;
    orgId?: string | null;
    status?: UserOrganizationStatus | null;
    roleId?: number | null;
    pageNumber?: number | null;
    pageSize?: number | null;
    distinct?: boolean | null;
}
  
export type GetUserOrganizations = Awaited<ReturnType<typeof getUserOrganizationsAction>>
export const getUserOrganizationsAction = cache(async (filter?: GetUserOrgFilterType) => {
  const { userId, orgId, status, roleId, pageNumber, pageSize, distinct } = filter || {};
  const paginatedData = await prisma.$transaction(async (prisma) => {
    const userOrganizations =await prisma.userOrganization.findMany({
      ... pageSize? { take: pageSize }: {},
      ... distinct? { distinct: ["organizationId"]}: {},
      skip: pageNumber ? (pageNumber - 1) * (pageSize || 10) : 0,
      orderBy: {
        createdAt: "desc"
      },
      where: {
        ...roleId && { roleId },
        ...status && { status },
        ...orgId && {
          Organization: {
            orgId
          }
        },
        ...userId && {
          User: {
            isActive: true,
            userId
          }
        }
      },
      select: {
        id: true,
        createdAt: true,
        User: {
          select: {
            id: true,
            picture: true,
            userId: true,
            firstName: true,
            lastName: true,
            gender: true,
            dob: true,
            // ...orgId ? {
            StudentRecords: {
              where: {
                isActive: true,
                Organization: {
                  orgId: orgId ?? ""
                }
              },
              select: {
                studentId: true,
                lrn: true,
                Level: {
                  select: {
                    name: true
                  }
                },
                YearLevel: {
                  select: {
                    name: true
                  }
                },
                Program: {
                  select: {
                    name: true
                  }
                },
                Department: {
                  select: {
                    name: true
                  }
                },
                College: {
                  select: {
                    name: true
                  }
                }
              }
            },
            UserEmployments: {
              where: {
                isActive: true,
                Organization: {
                  orgId: orgId ?? ""
                }
              },
              select: {
                employeeId: true,
                position: true,
                designation: true,
                Office: {
                  select: {
                    name: true
                  }
                },
                Department: {
                  select: {
                    name: true
                  }
                },
                College: {
                  select: {
                    name: true
                  }
                }
              }
            }
          }
        },
        AcceptedBy: {
          select: {
            id: true,
            userId: true,
            firstName: true,
            lastName: true
          }
        },
        status: true,
        role: true,
        UserRole: {
          select: {
            id: true,
            name: true,
            requirements: true
          }
        },
        Organization: {
          select: {
            name: true,
            orgId: true,
            id: true,
            Users: {
              select: {
                User: {
                  select: {
                    userId: true,
                  },
                },
              }
            },
            UserDefaultOrganizations: {
              where: {
                isActive: true,
                User: {
                  ...userId? {userId}: {}
                }
              },
              select: {
                id: true,
                organizationId: true,
                User: {
                  select: {
                    userId: true,
                  }
                },
                Organization: {
                  select: {
                    orgId: true,
                  }
                }
              }
            },
            UserDefaultOrganizationRoles: {
              where: {
                isActive: true,
                User: {
                  ...userId? {userId}: {}
                }
              },
              select: {
                id: true,
                organizationId: true,
                UserRole: {
                  select: {
                    id: true,
                    name: true
                  }
                }
              }
            }
          }
        },
      }
    })
    const total = await prisma.userOrganization.count({
      where: {
        ...roleId && { roleId },
        ...status && { status },
        ...orgId && {
          Organization: {
            orgId
          }
        },
        ...userId && {
          User: {
            isActive: true,
            userId
          }
        }
      },
    });
    return {
      data: userOrganizations,
      total
    }
  }, {
    timeout: 10000,
    maxWait: 5000,
    isolationLevel: Prisma.TransactionIsolationLevel.Serializable
    
  });
  return paginatedData;
})



export const setMembershipRequestStatusAction = async (id: number, status: UserOrganizationStatus) => {
  const [session, orgAdmin] = await Promise.all([
    getCachedSession(),
    isOrgAdmin()
  ]);
  const userId = session?.user.sub;
  if(!userId) throw new Error("No session found");
  if(!orgAdmin) throw new Error("Unauthorized");
  
  const request = await prisma.userOrganization.update({
    where: { id },
    data: {
      status,
      ...status === "ACTIVE" && {
        AcceptedBy: {
          connect: {
            userId
          }
        }
      }
    }, 
    include: {
      Organization: {
        select: {
          name: true
        }
      },
      User: {
        select: {
          firstName: true,
          lastName: true,
          email: true
        }
      }
    }
  })
  if(!request) throw new Error("Error updating membership request status");
  
  const filePath = path.join(process.cwd(), "email-templates/org-membership-update.html");
    
  const emailTemplate = await fs.readFile(filePath, "utf-8");
  const userName = `${request.User.firstName} ${request.User.lastName}`;
  const appName = process.env.NEXT_PUBLIC_APP_NAME!;
  const html = emailTemplate.replace("@{userName}", userName).replace("@{status}", status).replace("@{appName}", appName)
  const receiver = request.User.email;
    
  try {
    await sendMail({
      subject: `Membership Request to ${request.Organization.name} Status Update`,
      to: receiver,
      text: html,
      html
    })
  } catch (error) {
    console.error(error);
  }
  return request;
}
  

export const deleteMembershipAction = async (id: number) => {
  await prisma.userOrganization.delete({
    where: { id  }
  })
}