"use server";

import { getSession } from '@auth0/nextjs-auth0';
import prisma from "@lib/prisma";
import { Prisma, UserOrganizationStatus } from "@prisma/client";
import fs from 'fs/promises';
import { revalidatePath } from 'next/cache';
import { sendMail } from './email.action';

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
export const getOrganizationsAction = async (filters?: FiltersType) => {

  const { userId } = filters || {};
  const organizations = await prisma.organization.findMany({
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

type FilterType = {
  userId?: string;
  orgId?: string;
  status?: UserOrganizationStatus;
  roleId?: number;
}

export const getUserOrganizationsAction = async (filter?: FilterType) => {
  const { userId, orgId, status, roleId } = filter || {};
  const organizations = await prisma.userOrganization.findMany({
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
          userId: true,
          firstName: true,
          lastName: true
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
        }
      },
      Organization: {
        select: {
          name: true,
          orgId: true,
          id: true
        }
      }
    }
  });
  return organizations;

}

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

export const joinOrganizationAction = async ({ orgId, userId, roleId}:{
  orgId: string, userId: string, roleId: number
}) => {
  const request = await prisma.userOrganization.create({
    data: {
      UserRole: {
        connect: { id: roleId  }
      },
      User: {
        connect: { userId }
      },
      Organization: {
        connect: { orgId }
      }
    },
    include: {
      User: {
        select: {
          firstName: true,
          lastName: true,
          email: true
        }
      },
      Organization: {
        select: {
          name: true,
          Users: {
            select: {
              User: {
                select: {
                  email: true
                }
              },
              status: true,
              UserRole: {
                select: {
                  name: true,
                }
              }
            }
          }
        }
      }
    }
  })

  if(!request) throw new Error("Error sending membership request");

  const adminEmails = request.Organization.Users.filter(u => u.UserRole.name.toUpperCase() === "ADMIN" && u.status === "ACTIVE").map(u => u.User.email);

  const userName = `${request.User.firstName} ${request.User.lastName}`;
  const receiver = request.User.email;
  await Promise.all([
    notifyUser([receiver], request.Organization.name, userName),
    notifyAdmins([...adminEmails], request.Organization.name)
  ])
  
  return request;
}


export const getOrganizationRolesAction = async (filter?: Pick<FilterType, 'orgId' | "userId" | "status">) => {
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
            status,
            User: {
              userId
            }
          }
        
        }
      }
    }
  })
  return roles;
}

export const setMembershipRequestStatusAction = async (id: number, status: UserOrganizationStatus) => {
  const session = await getSession();

  const request = await prisma.userOrganization.update({
    where: { id },
    data: {
      status,
      ...status === "ACTIVE" && {
        AcceptedBy: {
          connect: {
            userId: session?.user.sub
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
  const emailTemplate = await fs.readFile("./src/email-templates/org-membership-update.html", "utf-8");
  const userName = `${request.User.firstName} ${request.User.lastName}`;
  const appName = process.env.NEXT_PUBLIC_APP_NAME!;
  const html = emailTemplate.replace("@{userName}", userName).replace("@{status}", status).replace("@{appName}", appName)
  const receiver = request.User.email;
  
  await sendMail({
    subject: `Membership Request to ${request.Organization.name} Status Update`,
    to: receiver,
    text: html,
    html
  })

  revalidatePath(`/[organization]/membership`, "page")
  return request;
}


const notifyAdmins = async (receiver: string[], orgName: string) => {
  const emailTemplate = await fs.readFile("./src/email-templates/org-membership-application.html", "utf-8");
  const appName = process.env.NEXT_PUBLIC_APP_NAME!;
  const html = emailTemplate.replaceAll("@{orgName}", orgName).replaceAll("@{appName}", appName)
  const subject = `New membership application to ${orgName}`;

  await sendMail({
    subject,
    to: receiver,
    text: html,
    html
  })
}

const notifyUser = async (receiver: string[], orgName: string, userName: string) => {
  const emailTemplate = await fs.readFile("./src/email-templates/org-membership-request.html", "utf-8");
  const appName = process.env.NEXT_PUBLIC_APP_NAME!;
  const html = emailTemplate.replaceAll("@{userName}", userName).replaceAll("@{appName}", appName).replaceAll("@{orgName}", orgName)
  const subject = `Membership application to ${orgName}`;
  
  await sendMail({
    subject,
    to: receiver,
    text: html,
    html
  })
}
