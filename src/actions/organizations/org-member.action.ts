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
import { isSuperAdminAction } from "@actions/super-admin/admin-check.action";
import { hasOrgPermissionAction } from "@actions/permission.action";
import { createNotification } from "@/actions/notifications/notification.action";

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
  /** Cursor-based pagination: last seen record id */
  cursor?: number;
};

export type GetOrgMembers = Awaited<ReturnType<typeof getOrgMembersAction>>;
export const getOrgMembersAction = withErrorHandling(
  cache(async (filter?: GetOrgMembersFilters) => {
    const session = await getCachedSession();
    if (!session) throw new Error("User not authenticated.");

    const { userId, orgUid, distinct, clinicUid } = filter || {};

    const searchKey = filter?.searchKey ? String(filter.searchKey) : undefined;

    const castToNumber = (value: string | number) => Number(value);

    const pageSize = filter?.pageSize ? castToNumber(filter.pageSize) : undefined;
    const pageNumber = filter?.pageNumber ? castToNumber(filter.pageNumber) : undefined;
    const cursor = filter?.cursor ? castToNumber(filter.cursor) : undefined;
    const take = pageSize ?? 20;
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
        // Fetch one extra record to determine if there are more pages
        const userOrganizations = await prisma.organizationMember.findMany({
          take: take + 1,
          ...(distinct ? { distinct: ["organizationId"] } : {}),
          ...(cursor
            ? { skip: 1, cursor: { id: cursor } }
            : { skip: pageNumber ? (pageNumber - 1) * take : 0 }),
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
              ...(searchKey ? {
                OR: [
                  {
                    firstName: {
                      contains: searchKey,
                      mode: "insensitive"
                    }
                  },
                  {
                    lastName: {
                      contains: searchKey,
                      mode: "insensitive"
                    }
                  },
                  {
                    userId: {
                      contains: searchKey,
                      mode: "insensitive"
                    }
                  },
                  {
                    StudentRecords: {
                      some: {
                        studentId: {
                          contains: searchKey,
                          mode: "insensitive"
                        },
                        isActive: true
                      }
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
                email: true,
                firstName: true,
                lastName: true,
                middleName: true,
                suffix: true,
                gender: true,
                dob: true,
                civilStatus: true,
                bloodType: true,
                nationality: true,
                placeOfBirth: true,
                mobile: true,
                telephone: true,
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
            acceptedAt: true,
            role: true,
            OrgMemberRequirementFiles: {
              select: {
                id: true,
                requirementType: true,
                fileName: true,
                fileSize: true,
                mimeType: true,
                url: true,
                createdAt: true,
              },
              orderBy: { createdAt: "asc" },
            },
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
                id: true,
                termsAndConditionsUrl: true,
                privacyPolicyUrl: true,
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
              ...(searchKey ? {
                OR: [
                  {
                    firstName: {
                      contains: searchKey,
                      mode: "insensitive"
                    }
                  },
                  {
                    lastName: {
                      contains: searchKey,
                      mode: "insensitive"
                    }
                  },
                  {
                    userId: {
                      contains: searchKey,
                      mode: "insensitive"
                    }
                  },
                  {
                    StudentRecords: {
                      some: {
                        studentId: {
                          contains: searchKey,
                          mode: "insensitive"
                        },
                        isActive: true
                      }
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

    const hasMore = paginatedData.data.length > take;
    const data = hasMore ? paginatedData.data.slice(0, take) : paginatedData.data;
    const nextCursor = hasMore ? (data[data.length - 1]?.id ?? null) : null;

    return {
      message: "User organizations fetched successfully",
      status: true,
      data: {
        data,
        total: paginatedData.total,
        nextCursor,
        hasMore,
      }
    };
  })
);

export const setMembershipRequestStatusAction = withErrorHandling(
  async (id: number, status: OrganizationMemberStatus) => {
    const session = await getCachedSession();
    if (!session) throw new Error("User not authenticated.");

    const userId = session.user.sub as string;

    // First, get the membership to find the orgUid
    const membership = await prisma.organizationMember.findUnique({
      where: { id },
      select: { Organization: { select: { orgUid: true } } }
    });

    if (!membership) throw new Error("Membership not found");

    // Check permissions in parallel
    const [isSuperAdmin, hasPermission] = await Promise.all([
      isSuperAdminAction(),
      hasOrgPermissionAction({
        userId,
        orgUid: membership.Organization.orgUid,
        permissionName: PERMISSIONS.ORGANIZATION["UPDATE:ORG:MEMBERS"].name
      })
    ]);

    if (!isSuperAdmin && !hasPermission)
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
              id: true,
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

      // In-app notification for the affected user
      const notificationType = (() => {
        switch (status) {
          case "ACTIVE": return "ORG_MEMBERSHIP_APPROVED" as const;
          case "SUSPENDED": return "ORG_MEMBERSHIP_SUSPENDED" as const;
          case "INACTIVE": return "ORG_MEMBERSHIP_DEACTIVATED" as const;
          default: return "ORG_MEMBERSHIP_REJECTED" as const;
        }
      })();
      const notificationTitle = (() => {
        switch (status) {
          case "ACTIVE": return "Membership Approved";
          case "SUSPENDED": return "Membership Suspended";
          case "INACTIVE": return "Membership Deactivated";
          default: return "Membership Update";
        }
      })();
      const notificationMessage = (() => {
        switch (status) {
          case "ACTIVE": return `Your membership in ${userOrganization.Organization.name} has been approved.`;
          case "SUSPENDED": return `Your membership in ${userOrganization.Organization.name} has been suspended.`;
          case "INACTIVE": return `Your membership in ${userOrganization.Organization.name} has been deactivated.`;
          default: return `Your membership status in ${userOrganization.Organization.name} has been updated to ${status}.`;
        }
      })();
      await createNotification({
        userId: userOrganization.User.id,
        type: notificationType,
        title: notificationTitle,
        message: notificationMessage,
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

export const updateOrgMemberRoleAction = withErrorHandling(
  async (id: number, orgRoleId: number) => {
    const session = await getCachedSession();
    if (!session) throw new Error("User not authenticated.");

    const userId = session.user.sub as string;

    const membership = await prisma.organizationMember.findUnique({
      where: { id },
      select: { Organization: { select: { orgUid: true } } }
    });

    if (!membership) throw new Error("Membership not found");

    const [isSuperAdmin, hasPermission] = await Promise.all([
      isSuperAdminAction(),
      hasOrgPermissionAction({
        userId,
        orgUid: membership.Organization.orgUid,
        permissionName: PERMISSIONS.ORGANIZATION["UPDATE:ORG:MEMBERS"].name
      })
    ]);

    if (!isSuperAdmin && !hasPermission)
      throw new Error("You do not have permission to update member roles");

    await prisma.organizationMember.update({
      where: { id },
      data: { OrganizationRole: { connect: { id: orgRoleId } } }
    });

    return { status: true, message: "Member role updated successfully", data: null };
  },
  async (error) => {
    if (error instanceof Error && "code" in error && (error as { code: string }).code === "P2002")
      return "Member already has a membership with the selected role in this organization";
    if (error instanceof Error) return error.message;
    return "Error updating member role";
  }
);

export const resetOrgMemberPermissionsAction = withErrorHandling(async (orgMemberId: number) => {
  const session = await getCachedSession();
  if (!session) throw new Error("User not authenticated.");

  const userId = session.user.sub as string;

  const membership = await prisma.organizationMember.findUnique({
    where: { id: orgMemberId },
    select: {
      role: true,
      Organization: { select: { orgUid: true, id: true } },
    },
  });

  if (!membership) throw new Error("Membership not found.");

  const [isSuperAdmin, hasPermission] = await Promise.all([
    isSuperAdminAction(),
    hasOrgPermissionAction({
      userId,
      orgUid: membership.Organization.orgUid,
      permissionName: PERMISSIONS.ORGANIZATION["UPDATE:ORG:PERMISSIONS"].name,
    }),
  ]);

  if (!isSuperAdmin && !hasPermission)
    throw new Error("You do not have permission to reset member permissions.");

  await prisma.$transaction(async (tx) => {
    const initialPermissions = await tx.orgRoleInitialPermission.findMany({
      where: {
        orgId: membership.Organization.id,
        orgRoleId: membership.role,
        Permission: { isActive: true },
      },
      select: { permissionId: true },
    });

    await tx.orgMemberPermission.deleteMany({ where: { orgMemberId } });

    if (initialPermissions.length > 0) {
      await tx.orgMemberPermission.createMany({
        skipDuplicates: true,
        data: initialPermissions.map((p) => ({ orgMemberId, permissionId: p.permissionId })),
      });
    }
  });

  return { message: "Permissions have been restored to the role defaults.", data: null };
});

export const deleteMembershipAction = async (id: number) => {
  try {
    const session = await getCachedSession();
    if (!session) throw new Error("User not authenticated.");

    const userId = session.user.sub as string;

    // First, get the membership to find the orgUid
    const membership = await prisma.organizationMember.findUnique({
      where: { id },
      select: { Organization: { select: { orgUid: true } } }
    });

    if (!membership) throw new Error("Membership not found");

    // Check permissions in parallel
    const [isSuperAdmin, hasPermission] = await Promise.all([
      isSuperAdminAction(),
      hasOrgPermissionAction({
        userId,
        orgUid: membership.Organization.orgUid,
        permissionName: PERMISSIONS.ORGANIZATION["DELETE:ORG:MEMBERS"].name
      })
    ]);

    if (!isSuperAdmin && !hasPermission)
      throw new Error("You do not have permission to delete membership");

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

export type SearchUsersForOrg = Awaited<ReturnType<typeof searchUsersForOrgAction>>;
export const searchUsersForOrgAction = withErrorHandling(
  async (orgUid: string, query: string) => {
    const session = await getCachedSession();
    if (!session) throw new Error("User not authenticated.");

    if (!query || query.trim().length < 2) {
      return { message: "Query too short", data: [] };
    }

    const users = await prisma.user.findMany({
      take: 10,
      orderBy: { lastName: "asc" },
      where: {
        isActive: true,
        OR: [
          { firstName: { contains: query, mode: "insensitive" } },
          { lastName: { contains: query, mode: "insensitive" } },
          { email: { contains: query, mode: "insensitive" } },
        ],
        NOT: {
          OrganizationMembers: {
            some: {
              Organization: { orgUid },
            },
          },
        },
      },
      select: {
        userId: true,
        email: true,
        firstName: true,
        lastName: true,
        picture: true,
      },
    });

    return { message: "Users found", data: users };
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
