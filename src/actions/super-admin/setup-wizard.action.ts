"use server";

import "server-only";
import prisma from "@lib/prisma";
import { isSuperAdminAction } from "./admin-check.action";
import { getCachedSession } from "@actions/session.action";

export async function setupTenantWizardAction(payload: {
  tenantUid: string;
  tenantName: string;
  tenantDescription?: string;
  ownerEmail?: string;
  orgUid?: string;
  orgName?: string;
  orgDescription?: string;
  clinicUid?: string;
  clinicName?: string;
  clinicDescription?: string;
}) {
  try {
    const isSuperAdmin = await isSuperAdminAction();
    if (!isSuperAdmin) throw new Error("Unauthorized: Only super admins can perform this action");

    const session = await getCachedSession();
    if (!session?.user?.sub) throw new Error("Unauthorized: User not authenticated");

    const creatorUser = await prisma.user.findUnique({
      where: { userId: session.user.sub },
    });
    if (!creatorUser) throw new Error("Authenticated creator user not found in database.");

    const {
      tenantUid, tenantName, tenantDescription, ownerEmail,
      orgUid, orgName, orgDescription,
      clinicUid, clinicName, clinicDescription
    } = payload;

    if (!tenantUid?.trim() || !tenantName?.trim()) {
      throw new Error("Tenant UID and Name are required.");
    }

    const trimmedTenantUid = tenantUid.trim();
    const trimmedTenantName = tenantName.trim();

    // Check if tenant UID already exists
    const existingTenant = await prisma.tenant.findUnique({
      where: { tenantUid: trimmedTenantUid },
    });
    if (existingTenant) {
      throw new Error(`Tenant UID "${trimmedTenantUid}" is already taken.`);
    }

    // Determine Owner User: if ownerEmail provided, find that user; otherwise creatorUser is owner
    let ownerUser = creatorUser;
    if (ownerEmail?.trim()) {
      const foundUser = await prisma.user.findFirst({
        where: { email: ownerEmail.trim(), isActive: true },
      });
      if (!foundUser) {
        throw new Error(`Owner user with email "${ownerEmail.trim()}" not found or is inactive.`);
      }
      ownerUser = foundUser;
    }

    const hasOrg = Boolean(orgUid?.trim() && orgName?.trim());
    const hasClinic = Boolean(clinicUid?.trim() && clinicName?.trim());

    if (hasOrg) {
      const existingOrg = await prisma.organization.findUnique({
        where: { orgUid: orgUid!.trim() },
      });
      if (existingOrg) {
        throw new Error(`Organization UID "${orgUid!.trim()}" is already taken.`);
      }
    }

    if (hasClinic) {
      const existingClinic = await prisma.clinic.findUnique({
        where: { clinicUid: clinicUid!.trim() },
      });
      if (existingClinic) {
        throw new Error(`Clinic UID "${clinicUid!.trim()}" is already taken.`);
      }
    }

    // Run in transaction to ensure all or nothing
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Tenant with assigned owner
      const tenant = await tx.tenant.create({
        data: {
          tenantUid: trimmedTenantUid,
          name: trimmedTenantName,
          description: tenantDescription?.trim() || null,
          ownerId: ownerUser.id,
          isActive: true,
        }
      });

      let organization = null;
      if (hasOrg) {
        // 2. Create Organization
        organization = await tx.organization.create({
          data: {
            tenantId: tenant.id,
            orgUid: orgUid!.trim(),
            name: orgName!.trim(),
            description: orgDescription?.trim() || null,
            isActive: true,
          }
        });

        // 3. Create or find Organization Owner Role
        let orgRole = await tx.organizationRole.findFirst({
          where: {
            orgId: organization.id,
            name: { equals: "Owner", mode: "insensitive" },
          },
        });
        if (!orgRole) {
          orgRole = await tx.organizationRole.create({
            data: {
              orgId: organization.id,
              name: "Owner",
              description: "Organization Owner",
              canAccessDashboard: true,
            }
          });
        }

        // 4. Add the creator as Organization Member and assign as Owner
        await tx.organizationMember.create({
          data: {
            userId: creatorUser.id,
            organizationId: organization.id,
            role: orgRole.id,
            status: "ACCEPTED",
            acceptedAt: new Date(),
          }
        });

        // If specified owner is different from creator, also add owner as Organization Member
        if (ownerUser.id !== creatorUser.id) {
          await tx.organizationMember.create({
            data: {
              userId: ownerUser.id,
              organizationId: organization.id,
              role: orgRole.id,
              status: "ACCEPTED",
              acceptedAt: new Date(),
            }
          });
        }
      }

      let clinic = null;
      if (hasClinic) {
        // Find or create "Owner" Clinic Role strictly (no Admin fallback)
        let clinicRole = await tx.clinicRole.findFirst({
          where: { name: { equals: "Owner", mode: "insensitive" } }
        });
        if (!clinicRole) {
          clinicRole = await tx.clinicRole.create({
            data: {
              name: "Owner",
              canAccessDashboard: true,
              isActive: true,
            }
          });
        }

        // 5. Create Clinic
        clinic = await tx.clinic.create({
          data: {
            tenantId: tenant.id,
            clinicUid: clinicUid!.trim(),
            name: clinicName!.trim(),
            description: clinicDescription?.trim() || null,
            isActive: true,
          }
        });

        // 6. Link Clinic to Organization if both exist
        if (organization) {
          await tx.clinicOrganization.create({
            data: {
              clinicId: clinic.id,
              organizationId: organization.id,
            }
          });
        }

        // 7. Add creator as Clinic Member and assign as Owner
        await tx.clinicMember.create({
          data: {
            userId: creatorUser.id,
            clinicId: clinic.id,
            roleId: clinicRole.id,
            status: "ACTIVE",
            isActive: true,
          }
        });

        // If specified owner is different from creator, also add owner as Clinic Member
        if (ownerUser.id !== creatorUser.id) {
          await tx.clinicMember.create({
            data: {
              userId: ownerUser.id,
              clinicId: clinic.id,
              roleId: clinicRole.id,
              status: "ACTIVE",
              isActive: true,
            }
          });
        }
      }

      return { tenant, organization, clinic };
    });

    return { success: true, data: result };
  } catch (error: any) {
    console.error("Setup Wizard Error:", error);
    return { success: false, error: error.message || "Failed to complete setup wizard" };
  }
}

export async function createOrganizationAction(payload: {
  tenantId: number;
  orgUid: string;
  name: string;
  description: string;
}) {
  try {
    const isSuperAdmin = await isSuperAdminAction();
    if (!isSuperAdmin) throw new Error("Unauthorized: Only super admins can perform this action");

    const session = await getCachedSession();
    if (!session?.user?.sub) throw new Error("Unauthorized: User not authenticated");

    const creatorUser = await prisma.user.findUnique({
      where: { userId: session.user.sub },
    });
    if (!creatorUser) throw new Error("Authenticated creator user not found in database.");

    const { tenantId, orgUid, name, description } = payload;
    
    if (!tenantId || !orgUid?.trim() || !name?.trim()) {
      throw new Error("Tenant ID, Org UID, and Name are required.");
    }

    const trimmedOrgUid = orgUid.trim();
    const trimmedName = name.trim();

    // Check if organization UID already exists
    const existingOrg = await prisma.organization.findUnique({
      where: { orgUid: trimmedOrgUid },
    });
    if (existingOrg) {
      throw new Error(`Organization UID "${trimmedOrgUid}" is already taken.`);
    }

    // Find the tenant and owner
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: { Owner: true },
    });
    if (!tenant) {
      throw new Error(`Tenant with ID ${tenantId} not found.`);
    }

    const result = await prisma.$transaction(async (tx) => {
      const organization = await tx.organization.create({
        data: {
          tenantId,
          orgUid: trimmedOrgUid,
          name: trimmedName,
          description: description?.trim() || null,
          isActive: true,
        }
      });

      // Find or create Organization "Owner" Role
      let ownerRole = await tx.organizationRole.findFirst({
        where: {
          orgId: organization.id,
          name: { equals: "Owner", mode: "insensitive" },
        },
      });
      if (!ownerRole) {
        ownerRole = await tx.organizationRole.create({
          data: {
            orgId: organization.id,
            name: "Owner",
            description: "Organization Owner",
            canAccessDashboard: true,
          }
        });
      }

      // Add the user who creates the organization as member and assign as owner
      await tx.organizationMember.create({
        data: {
          userId: creatorUser.id,
          organizationId: organization.id,
          role: ownerRole.id,
          status: "ACCEPTED",
          acceptedAt: new Date(),
        }
      });

      // If tenant owner is different from creator, also add tenant owner as member
      if (tenant.Owner && tenant.Owner.id !== creatorUser.id) {
        await tx.organizationMember.create({
          data: {
            userId: tenant.Owner.id,
            organizationId: organization.id,
            role: ownerRole.id,
            status: "ACCEPTED",
            acceptedAt: new Date(),
          }
        });
      }

      return organization;
    });

    return { success: true, data: result };
  } catch (error: any) {
    console.error("Create Organization Error:", error);
    return { success: false, error: error.message || "Failed to create organization" };
  }
}

export async function createClinicAction(payload: {
  tenantId: number;
  clinicUid: string;
  name: string;
  description: string;
  organizationId?: number;
}) {
  try {
    const isSuperAdmin = await isSuperAdminAction();
    if (!isSuperAdmin) throw new Error("Unauthorized: Only super admins can perform this action");

    const session = await getCachedSession();
    if (!session?.user?.sub) throw new Error("Unauthorized: User not authenticated");

    const creatorUser = await prisma.user.findUnique({
      where: { userId: session.user.sub },
    });
    if (!creatorUser) throw new Error("Authenticated creator user not found in database.");

    const { tenantId, clinicUid, name, description, organizationId } = payload;
    
    if (!tenantId || !clinicUid?.trim() || !name?.trim()) {
      throw new Error("Tenant ID, Clinic UID, and Name are required.");
    }

    const trimmedClinicUid = clinicUid.trim();
    const trimmedName = name.trim();

    // Check if clinic UID already exists
    const existingClinic = await prisma.clinic.findUnique({
      where: { clinicUid: trimmedClinicUid },
    });
    if (existingClinic) {
      throw new Error(`Clinic UID "${trimmedClinicUid}" is already taken.`);
    }

    // Find the tenant and owner
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: { Owner: true },
    });
    if (!tenant) {
      throw new Error(`Tenant with ID ${tenantId} not found.`);
    }

    // Find or create "Owner" clinic role strictly (no Admin fallback)
    let ownerRole = await prisma.clinicRole.findFirst({
      where: { name: { equals: "Owner", mode: "insensitive" } }
    });
    if (!ownerRole) {
      ownerRole = await prisma.clinicRole.create({
        data: {
          name: "Owner",
          canAccessDashboard: true,
          isActive: true,
        }
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      const clinic = await tx.clinic.create({
        data: {
          tenantId,
          clinicUid: trimmedClinicUid,
          name: trimmedName,
          description: description?.trim() || null,
          isActive: true,
        }
      });

      if (organizationId) {
        await tx.clinicOrganization.create({
          data: {
            clinicId: clinic.id,
            organizationId,
          }
        });
      }

      // Add the user who creates the clinic as member and assign as owner
      await tx.clinicMember.create({
        data: {
          userId: creatorUser.id,
          clinicId: clinic.id,
          roleId: ownerRole.id,
          status: "ACTIVE",
          isActive: true,
        }
      });

      // If tenant owner is different from creator, also add tenant owner as member
      if (tenant.Owner && tenant.Owner.id !== creatorUser.id) {
        await tx.clinicMember.create({
          data: {
            userId: tenant.Owner.id,
            clinicId: clinic.id,
            roleId: ownerRole.id,
            status: "ACTIVE",
            isActive: true,
          }
        });
      }

      return clinic;
    });

    return { success: true, data: result };
  } catch (error: any) {
    console.error("Create Clinic Error:", error);
    return { success: false, error: error.message || "Failed to create clinic" };
  }
}
