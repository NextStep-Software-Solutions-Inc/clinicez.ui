"use server";

import prisma from "@lib/prisma";
import { Prisma, UserOrganizationStatus } from "@prisma/client";
import { cache } from "react";
import { sendMail } from "./email.action";
import path from "path";
import { revalidatePath } from "next/cache";
import { getCachedSession } from "./session.action";
import { isOrgAdmin } from "@lib/protect-org";
import fs from "fs/promises";

export const createOrganizationAction = async (data: Prisma.OrganizationCreateArgs["data"]) => {

  const newOrganization = await prisma.organization.create({
    data: { 
      ...data
    }
  });
  
  return newOrganization;
};
  

type FiltersType = {
  userId?: string;
}

export type GetOrganizations = Awaited<ReturnType<typeof getOrganizationsAction>>
export const getOrganizationsAction = async (filters?: FiltersType) => {

  const { userId } = filters || {};
  const organizations = await prisma.organization.findMany({
    orderBy: {
      name: "asc"
    },
    where: {
      ...(userId && {
        Users: {
          every: {
            User: {
              userId
            }
          }
        }
      }),
      isActive: true
    }
  });
    
  return organizations;
};

export const getOrganizationAction = async (id: number) => {

  const organization = await prisma.organization.findUnique({
    where: {
      id: id
    }
  });``

  return organization;
}

export type GetUserOrgFilterType = {
  userId?: string | null;
  orgId?: string | null;
  status?: UserOrganizationStatus | null;
  roleId?: number | null;
  pageNumber?: number | null;
  pageSize?: number | null;
}

export type GetUserOrganizations = Awaited<ReturnType<typeof getUserOrganizationsAction>>
export const getUserOrganizationsAction = cache(async (filter?: GetUserOrgFilterType) => {
  const { userId, orgId, status, roleId, pageNumber, pageSize } = filter || {};
  const userOrganizations = await prisma.userOrganization.findMany({
    ... pageSize && { take: pageSize },
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
          ...orgId ? {
            StudentRecords: {
              where: {
                isActive: true,
                Organization: {
                  orgId: orgId
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
            }
          } : {},
          ...orgId ? {
            UserEmployments: {
              where: {
                isActive: true,
                Organization: {
                  orgId: orgId
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
          } : {}
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
          }
        }
      }
    }
  });
  return userOrganizations;
})

export const getMyDefaultOrganizationAction = async (userId: string) => {
  const org = await prisma.userDefaultOrganization.findFirst({
    where: {
      User: {
        userId
      }
    },
    select: {
      id: true,
      Organization: {
        select: {
          name: true,
          orgId: true,
          id: true
        }
      }
    }
  })
  return org;
}

export const setMyDefaultOrganizationAction = async (id: number, orgId: string, userId?: string) => {
  const org = await prisma.userDefaultOrganization.upsert({
    where: { id, User: { userId } },
    create: {
      User: {
        connect: { userId }
      },
      Organization: {
        connect: { orgId }
      },
    },
    update: {
      User: {
        connect: { userId }
      },
      Organization: {
        connect: { orgId }
      },
    }
  })
  return org;
}



export type GetOrganizationRoles = Awaited<ReturnType<typeof getOrganizationRolesAction>>
export const getOrganizationRolesAction = cache(async (filter?: Pick<GetUserOrgFilterType, 'orgId' | "userId" | "status">) => {
  const {userId, orgId, status} = filter || { status: "ACTIVE"};
  const roles = await prisma.userOrganizationRole.findMany({
    orderBy: {
      name: "asc"
    },
    where: {
      isActive: true,
      ...orgId && { Organization: { orgId } },
      ...userId && { 
        UserOrganizations: {
          some: {
            ...status ? { status }: {},
            User: {
              userId
            }
          }
        
        }
      }
    },
    select: {
      id: true,
      orgId: true,
      name: true,
      description: true,
      requirements: true
    }
  })
  return roles;
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

  revalidatePath(`/[organization]/membership`, "page")
  return request;
}
