"use server";

import "server-only";
import fs from "fs/promises";
import { sendMail } from "@actions/email.action";
import { getCachedSession } from "@actions/session.action";
import prisma from "@lib/prisma";
import { Prisma } from "@prisma/client";
import path from "path";
import { cache } from "react";
import { getPermissionsAction } from "@actions/permission.action";
import { PERMISSIONS } from "@lib/permissions";
import { OrganizationMemberStatus } from "@/types";
import { withErrorHandling } from "@/lib/with-error-handling";
import { parseObject } from '@/lib/utils';

const HEALTHCARE_PROVIDER_ROLES = [
  "Nurse",
  "Dental Aide",
  "Psychologist",
  "Dentist",
  "Doctor",
];

export const isOrgHealthcareProviderAction = async (userId: string, orgUid: string) => {
  const orgMember = await prisma.organizationMember.findFirst({
    where: {
      User: {
        userId
      },
      Organization: {
        orgUid,
        isActive: true
      },
      OrganizationRole: {
        name: {
          in: HEALTHCARE_PROVIDER_ROLES,
        },
        isActive: true,
      },
    },
  });
  return !!orgMember;
}

export type GetOrgMembersFilters = {
  userId?: string;
  orgUid?: string;
  status?: OrganizationMemberStatus[];
  role?: string[];
  pageNumber?: number;
  pageSize?: number;
  distinct?: boolean;
  clinicUid?: string;
  searchKey?: string;
};

export type GetOrgMembers = Awaited<ReturnType<typeof getOrgMembersAction>>;
export const getOrgMembersAction = withErrorHandling(
  cache(async (filter?: GetOrgMembersFilters) => {
    const session = await getCachedSession();
    if (!session) throw new Error("User not authenticated.");

    const { userId, orgUid, distinct, clinicUid } = filter || {};

    const castToNumber = (value: string | number) => Number(value);

    const pageSize = filter?.pageSize ? castToNumber(filter.pageSize) : undefined;
    const pageNumber = filter?.pageNumber ? castToNumber(filter.pageNumber) : undefined;
    const normalizeToArray = <T>(val: T | T[] | undefined): T[] => {
      if (val === undefined) return [];
      return Array.isArray(val) ? val : [val];
    };

    const roles = normalizeToArray(filter?.role);
    const statuses = normalizeToArray(filter?.status).filter(
      (status) => ["ACTIVE", "SUSPENDED", "PENDING", "INACTIVE"].includes(status)
    );
    const paginatedData = await prisma.$transaction(
      async (prisma) => {
        const userOrganizations = await prisma.organizationMember.findMany({
          ...(pageSize ? { take: pageSize } : {}),
          ...(distinct ? { distinct: ["organizationId"] } : {}),
          skip: pageNumber ? (pageNumber - 1) * (pageSize || 10) : 0,
          orderBy: {
            createdAt: "desc"
          },
          where: {
            Organization: {
              isActive: true,
              ...(orgUid ? { orgUid } : {}),
              ...(clinicUid
                ? {
                  ClinicOrganizations: {
                    some: {
                      Clinic: {
                        isActive: true,
                        clinicUid
                      }
                    }
                  }
                }
                : {})
            },
            User: {
              isActive: true,
              ...(userId ? { userId } : {}),
              ...(filter?.searchKey ? {
                OR: [
                  {
                    firstName: {
                      contains: filter?.searchKey,
                      mode: "insensitive"
                    }
                  },
                  {
                    lastName: {
                      contains: filter?.searchKey,
                      mode: "insensitive"
                    }
                  },
                  {
                    userId: {
                      contains: filter?.searchKey,
                      mode: "insensitive"
                    }
                  }
                ]
              } : {})
            },
            ...(roles.length > 0 ? { OrganizationRole: { name: { in: roles } } } : {}),
            ...(statuses.length > 0 ? { status: { in: statuses } } : {}),
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
                suffix: true,
                gender: true,
                dob: true,
                StudentRecords: {
                  where: {
                    isActive: true,
                    Organization: {
                      ...(orgUid ? { orgUid } : {})
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
                    OrganizationYearLevel: {
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
                      ...(orgUid ? { orgUid } : {})
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
            OrganizationRole: {
              select: {
                id: true,
                name: true,
                description: true,
                requirements: true
              }
            },
            Organization: {
              select: {
                name: true,
                orgUid: true,
                id: true
              }
            }
          }
        });

        const total = await prisma.organizationMember.count({
          where: {
            ...(statuses.length > 0 ? { status: { in: statuses } } : {}),
            ...(roles.length > 0 ? { OrganizationRole: { name: { in: roles } } } : {}),
            Organization: {
              isActive: true,
              ...(orgUid ? { orgUid } : {})
            },
            User: {
              isActive: true,
              ...(userId ? { userId } : {}),
              ...(filter?.searchKey ? {
                OR: [
                  {
                    firstName: {
                      contains: filter?.searchKey,
                      mode: "insensitive"
                    }
                  },
                  {
                    lastName: {
                      contains: filter?.searchKey,
                      mode: "insensitive"
                    }
                  },
                  {
                    userId: {
                      contains: filter?.searchKey,
                      mode: "insensitive"
                    }
                  }
                ]
              } : {})
            }
          }
        });

        return { data: userOrganizations, total };
      },
      {
        timeout: 10000,
        maxWait: 5000,
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable
      }
    );
    return {
      message: "User organizations fetched successfully",
      status: true,
      data: paginatedData
    };
  })
);

export const setMembershipRequestStatusAction = withErrorHandling(
  async (id: number, status: OrganizationMemberStatus) => {
    const session = await getCachedSession();
    if (!session) throw new Error("User not authenticated.");

    const userId = session.user.sub as string;
    const updateMembershipPermissions = [
      PERMISSIONS.ORGANIZATION["UPDATE:ORG:MEMBERSHIP_REQUEST"].name
    ];
    const myPermissions = await getPermissionsAction({ userId });
    const myPermissionArray = myPermissions.map((item) => item.name);
    const hasMembershipPermission = updateMembershipPermissions.every((item) =>
      myPermissionArray.includes(item)
    );

    if (!hasMembershipPermission)
      throw new Error(
        "You do not have permission to update membership request status"
      );

    await prisma.$transaction(async (prisma) => {
      const userOrganization = await prisma.organizationMember.update({
        where: { id },
        data: {
          status,
          ...(status === "ACTIVE" && {
            AcceptedBy: {
              connect: {
                userId
              }
            }
          })
        },
        select: {
          id: true,
          status: true,
          OrganizationRole: {
            select: {
              id: true
            }
          },
          Organization: {
            select: {
              name: true,
              email: true
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
      });
      if (status === "ACTIVE") {
        const permissions = await prisma.orgRoleInitialPermission.findMany({
          where: {
            orgRoleId: userOrganization.OrganizationRole.id
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
        });

        await prisma.orgMemberPermission.createMany({
          skipDuplicates: true,
          data: permissions.map((item) => {
            return {
              permissionId: item.Permission.id,
              orgMemberId: userOrganization.id
            };
          })
        });
      }

      await sendMembershipUpdateEmailNotification({
        name: `${userOrganization.User.firstName} ${userOrganization.User.lastName}`,
        email: userOrganization.User.email,
        organization: userOrganization.Organization.name,
        status: userOrganization.status as OrganizationMemberStatus,
        orgMail: userOrganization.Organization.email ?? ""
      });
    });
    return {
      status: true,
      message: `Membership request status updated to ${status}`,
      data: null
    };
  },
  async (error) => {
    if (error instanceof Error) return error.message;
    return "Error updating membership request status";
  }
);

export const deleteMembershipAction = async (id: number) => {
  try {
    await prisma.$transaction(async (prisma) => {
      const userOrganization = await prisma.organizationMember.delete({
        where: { id },
        select: {
          id: true,
          OrganizationRole: {
            select: {
              id: true,
              name: true
            }
          },
          status: true,
          Organization: {
            select: {
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
      });
      const permissions = await prisma.orgRoleInitialPermission.findMany({
        where: {
          orgRoleId: userOrganization.OrganizationRole.id,
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
      });
      await prisma.orgMemberPermission.deleteMany({
        where: {
          orgMemberId: userOrganization.id,
          Permission: {
            id: {
              in: permissions.map((item) => item.Permission.id)
            }
          }
        }
      });

      await sendMembershipDeletionEmailNotification({
        name: `${userOrganization.User.firstName} ${userOrganization.User.lastName}`,
        email: userOrganization.User.email,
        organization: userOrganization.Organization.name,
        role: userOrganization.OrganizationRole.name
      });
    });

    return {
      status: true,
      message: "Membership request deleted successfully"
    };
  } catch (error) {
    console.error(`Error deleting membership request: ${error}`);
    return {
      status: false,
      message: "Error deleting membership request"
    };
  }
};

export const requestMembershipAdditionalInfo = withErrorHandling(
  async (id: number) => {
    const session = await getCachedSession();
    if (!session) throw new Error("User not authenticated.");
    const userOrganization = await prisma.organizationMember.findUniqueOrThrow({
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
        OrganizationRole: {
          select: {
            name: true
          }
        }
      }
    });
    await sendMembershipAdditionalInfo({
      name: `${userOrganization.User.firstName} ${userOrganization.User.lastName}`,
      email: userOrganization.User.email,
      organization: userOrganization.Organization.name,
      orgMail: userOrganization.Organization.email ?? ""
    });
    return { message: "Additional information request sent", data: null };
  }
);

const sendMembershipUpdateEmailNotification = async ({
  name,
  email,
  organization,
  status,
  orgMail
}: {
  organization: string;
  email: string;
  name: string;
  status: OrganizationMemberStatus;
  orgMail: string;
}) => {
  try {
    const filePath = path.join(
      process.cwd(),
      "email-templates/org-membership-update.html"
    );
    const emailTemplate = await fs.readFile(filePath, "utf-8");
    const appName = process.env.NEXT_PUBLIC_APP_NAME!;
    const html = emailTemplate
      .replaceAll("@{userName}", name)
      .replaceAll("@{status}", status)
      .replaceAll("@{appName}", appName)
      .replaceAll("@{orgName}", organization)
      .replaceAll("@{orgMail}", orgMail);

    await sendMail({
      subject: `Membership request to ${organization} status was changed - ${status?.toUpperCase()}`,
      to: email,
      text: html,
      html
    });
    return true;
  } catch (error) {
    console.error(`Error sending email notification: ${error}`);
    return false;
  }
};

const sendMembershipDeletionEmailNotification = async ({
  name,
  email,
  organization,
  role
}: {
  organization: string;
  email: string;
  name: string;
  role: string;
}) => {
  try {
    const filePath = path.join(
      process.cwd(),
      "email-templates/org-membership-deleted.html"
    );
    const emailTemplate = await fs.readFile(filePath, "utf-8");
    const appName = process.env.NEXT_PUBLIC_APP_NAME!;
    const html = emailTemplate
      .replaceAll("@{userName}", name)
      .replaceAll("@{orgName}", organization)
      .replaceAll("@{appName}", appName)
      .replaceAll("@{roleName}", role);

    await sendMail({
      subject: `Your membership to ${organization} was dropped.`,
      to: email,
      text: html,
      html
    });
    return true;
  } catch (error) {
    console.error(`Error sending email notification: ${error}`);
    return false;
  }
};

const sendMembershipAdditionalInfo = async ({
  name,
  email,
  organization,
  orgMail
}: {
  organization: string;
  email: string;
  name: string;
  orgMail: string;
}) => {
  try {
    const filePath = path.join(
      process.cwd(),
      "email-templates/org-membership-comply-request.html"
    );
    const emailTemplate = await fs.readFile(filePath, "utf-8");
    const appName = process.env.NEXT_PUBLIC_APP_NAME!;
    const html = emailTemplate
      .replaceAll("@{userName}", name)
      .replaceAll("@{orgName}", organization)
      .replaceAll("@{appName}", appName)
      .replaceAll("@{orgMail}", orgMail);

    await sendMail({
      subject: `Keep Your Membership Active: Update Your Information`,
      to: email,
      text: html,
      html
    });
    return true;
  } catch (error) {
    console.error(`Error sending email notification: ${error}`);
    return false;
  }
};
