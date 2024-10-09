"use server";

import "server-only";
import fs from "fs/promises";
import { sendMail } from "@actions/email.action";
import { getCachedSession } from "@actions/session.action";
import prismaCommon from "@lib/prisma-common";
import { UserOrganizationStatus, Prisma } from "@prisma/common/client";
import path from "path";
import { cache } from "react";
import { getPermissionsAction } from "@actions/permission.action";

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
  
  const paginatedData = await prismaCommon.$transaction(async (prisma) => {
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
                  ...orgId? {orgId}: {}
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
                  ...orgId? {orgId}: {}
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
  const session = await getCachedSession();
  if(!session) {
    return {
      status: false,
      message: "No session found"
    }
  }
  const userId = session.user.sub as string;
  const updateMembershipPermissions = ["update:org:membership-request"];
  const myPermissions = await getPermissionsAction(userId);
  const myPermissionArray = myPermissions.map((item) => item.name);
  const hasMembershipPermission = updateMembershipPermissions.every((item) => myPermissionArray.includes(item));
  
  if(!hasMembershipPermission) {
    return {
      status: false,
      message: "You do not have permission to update membership request status"
    }
  }
  try {
    await prismaCommon.$transaction(async (prisma) => {
      const userOrganization = await prisma.userOrganization.update({
        where: { id },
        data: {
          status,
          ...status === "ACTIVE" && {
            AcceptedBy: {
              connect: {
                userId
              }
            },
          }
        }, 
        include: {
          UserRole: {
            select: {
              id: true,
            }
          },
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
      if (status === "ACTIVE") {
        const permissions = await prisma.orgRoleInitialPermission.findMany({
          where: {
            orgRoleId: userOrganization.role,
          },
          select: {
            Permission: {
              select: {
                id: true,
                name: true,
                description: true
              }
            }
          }
        })
    
        await prisma.orgUserPermission.createMany({
          skipDuplicates: true,
          data: permissions.map((item) => {
            return {
              permissionId: item.Permission.id,
              orgId: userOrganization.organizationId,
              userId: userOrganization.userId
            }
          })
        })
      }

      await sendMembershipUpdateEmailNotification({
        name: `${userOrganization.User.firstName} ${userOrganization.User.lastName}`,
        email: userOrganization.User.email,
        organization: userOrganization.Organization.name,
        status: userOrganization.status
      })
    })
    return {
      status: true,
      message: `Membership request status updated to ${status}`,
    }
  } catch (error) {
    console.error(`Error updating membership request status: ${error}`);
    return {
      status: false,
      message: "Error updating membership request status"
    }
  }
}

export const deleteMembershipAction = async (id: number) => {
  try {
    await prismaCommon.$transaction(async (prisma) => {
      const userOrganization = await prismaCommon.userOrganization.delete({
        where: { id  },
        select: {
          UserRole: {
            select: {
              id: true,
              name: true
            }
          },
          status: true,
          Organization: {
            select:{
              id: true,
              name: true
            }
          },
          User: {
            select: {
              id: true,
              userId: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      })
      const permissions = await prisma.orgRoleInitialPermission.findMany({
        where: {
          orgRoleId: userOrganization.UserRole.id,
          orgId: userOrganization.Organization.id
        },
        select: {
          Permission: {
            select: {
              id: true,
              name: true,
              description: true
            }
          }
        }
      })
      await prisma.orgUserPermission.deleteMany({
        where: {
          orgId: userOrganization.Organization.id,
          userId: userOrganization.User.id,
          Permission: {
            id: {
              in: permissions.map((item) => item.Permission.id)
            }
          }
        }
      })

      await sendMembershipDeletionEmailNotification({
        name: `${userOrganization.User.firstName} ${userOrganization.User.lastName}`,
        email: userOrganization.User.email,
        organization: userOrganization.Organization.name,
        role: userOrganization.UserRole.name
      })
    })

    return {
      status: true,
      message: "Membership request deleted successfully"
    }
  } catch (error) {
    console.error(`Error deleting membership request: ${error}`);
    return {
      status: false,
      message: "Error deleting membership request"
    }
  }
}

type RecipientType = {
  organization: string
  email: string
  name: string,
  status?: UserOrganizationStatus
  role?: string
}

export const requestMembershipAdditionalInfo = async (id: number) => {
  try {
    const userOrganization = await prismaCommon.userOrganization.findUniqueOrThrow({
      where: { id },
      select: {
        User: {
          select: {
            email: true,
            firstName: true,
            lastName: true
          }
        },
        Organization: {
          select: {
            name: true,
            email: true
          }
        },
        UserRole: {
          select: {
            name: true
          }
        }
      }
    })
    await sendMembershipAdditionalInfo({
      name: `${userOrganization.User.firstName} ${userOrganization.User.lastName}`,
      email: userOrganization.User.email,
      organization: userOrganization.Organization.name,
      orgMail: userOrganization.Organization.email ?? ""
    })
    return {
      status: true,
      message: "Additional information request sent"
    }
  } catch (error) {
    console.error(`Error sending additional information request: ${error}`);
    return {
      status: false,
      message: "Error sending additional information request"
    }
  }
}

const sendMembershipUpdateEmailNotification = async ({name, email, organization, status}:{
  organization: string
  email: string
  name: string,
  status: UserOrganizationStatus
}) => {
  try {
    const filePath = path.join(process.cwd(), "email-templates/org-membership-update.html");
    const emailTemplate = await fs.readFile(filePath, "utf-8");
    const appName = process.env.NEXT_PUBLIC_APP_NAME!;
    const html = emailTemplate.replaceAll("@{userName}", name).replaceAll("@{status}", status).replaceAll("@{appName}", appName)

    await sendMail({
      subject: `Membership request to ${organization} status was changed - ${status?.toUpperCase()}`,
      to: email,
      text: html,
      html
    })
    return true;
  } catch (error) {
    console.error(`Error sending email notification: ${error}`);
    return false;
  }
}

const sendMembershipDeletionEmailNotification = async ({name, email, organization, role}:{
  organization: string
  email: string
  name: string,
  role: string
}) => {
  try {
    const filePath = path.join(process.cwd(), "email-templates/org-membership-deleted.html");
    const emailTemplate = await fs.readFile(filePath, "utf-8");
    const appName = process.env.NEXT_PUBLIC_APP_NAME!;
    const html = emailTemplate.replaceAll("@{userName}", name).replaceAll("@{orgName}", organization).replaceAll("@{appName}", appName).replaceAll("@{roleName}", role)

    await sendMail({
      subject: `Your membership to ${organization} was dropped.`,
      to: email,
      text: html,
      html
    })
    return true;
  } catch (error) {
    console.error(`Error sending email notification: ${error}`);
    return false;
  }
}

const sendMembershipAdditionalInfo = async ({name, email, organization, orgMail}:{
  organization: string
  email: string
  name: string,
  orgMail: string
}) => {
  try {
    const filePath = path.join(process.cwd(), "email-templates/org-membership-comply-request.html");
    const emailTemplate = await fs.readFile(filePath, "utf-8");
    const appName = process.env.NEXT_PUBLIC_APP_NAME!;
    const html = emailTemplate.replaceAll("@{userName}", name).replaceAll("@{orgName}", organization).replaceAll("@{appName}", appName).replaceAll("@{orgMail}", orgMail)

    await sendMail({
      subject: `Keep Your Membership Active: Update Your Information`,
      to: email,
      text: html,
      html
    })
    return true;
  } catch (error) {
    console.error(`Error sending email notification: ${error}`);
    return false;
  }
}