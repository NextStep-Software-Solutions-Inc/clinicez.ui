"use server";

import "server-only";
import prisma from "@lib/prisma";
import { isSuperAdminAction } from "./admin-check.action";

export async function setupTenantWizardAction(payload: {
  tenantUid: string;
  tenantName: string;
  tenantDescription: string;
  ownerEmail: string;
  orgUid: string;
  orgName: string;
  orgDescription: string;
  clinicUid: string;
  clinicName: string;
  clinicDescription: string;
}) {
  try {
    const isSuperAdmin = await isSuperAdminAction();
    if (!isSuperAdmin) throw new Error("Unauthorized: Only super admins can perform this action");

    const {
      tenantUid, tenantName, tenantDescription, ownerEmail,
      orgUid, orgName, orgDescription,
      clinicUid, clinicName, clinicDescription
    } = payload;

    if (!tenantUid || !tenantName || !ownerEmail) throw new Error("Tenant UID, Name, and Owner Email are required.");
    if (!orgUid || !orgName) throw new Error("Organization UID and Name are required.");
    if (!clinicUid || !clinicName) throw new Error("Clinic UID and Name are required.");

    // Find Owner User
    const ownerUser = await prisma.user.findFirst({
      where: { email: ownerEmail },
    });

    if (!ownerUser) {
      throw new Error(`Owner user with email ${ownerEmail} not found`);
    }

    // Find an existing Clinic Role to assign to the owner (fallback to first available if 'Admin' or 'Owner' not found)
    let clinicRole = await prisma.clinicRole.findFirst({
      where: { name: { in: ['Admin', 'Clinic Admin', 'Owner'] } }
    });
    
    if (!clinicRole) {
      clinicRole = await prisma.clinicRole.findFirst();
    }

    if (!clinicRole) {
      throw new Error("No clinic roles exist in the system. Please create a clinic role first.");
    }

    // Run in transaction to ensure all or nothing
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Tenant
      const tenant = await tx.tenant.create({
        data: {
          tenantUid,
          name: tenantName,
          description: tenantDescription,
          ownerId: ownerUser.id,
          isActive: true,
        }
      });

      // 2. Create Organization
      const organization = await tx.organization.create({
        data: {
          tenantId: tenant.id,
          orgUid,
          name: orgName,
          description: orgDescription,
          isActive: true,
        }
      });

      // 3. Create Clinic
      const clinic = await tx.clinic.create({
        data: {
          tenantId: tenant.id,
          clinicUid,
          name: clinicName,
          description: clinicDescription,
          isActive: true,
        }
      });

      // 4. Link Clinic to Organization
      await tx.clinicOrganization.create({
        data: {
          clinicId: clinic.id,
          organizationId: organization.id,
        }
      });

      // 5. Create Organization Admin Role
      const orgRole = await tx.organizationRole.create({
        data: {
          orgId: organization.id,
          name: "Admin",
          description: "System generated admin role",
          canAccessDashboard: true,
        }
      });

      // 6. Add Owner as Organization Member
      await tx.organizationMember.create({
        data: {
          userId: ownerUser.id,
          organizationId: organization.id,
          role: orgRole.id,
          status: "ACCEPTED",
          acceptedAt: new Date(),
        }
      });

      // 7. Add Owner as Clinic Member
      await tx.clinicMember.create({
        data: {
          userId: ownerUser.id,
          clinicId: clinic.id,
          roleId: clinicRole!.id,
          status: "ACCEPTED",
        }
      });

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

    const { tenantId, orgUid, name, description } = payload;
    
    if (!tenantId || !orgUid || !name) throw new Error("Tenant ID, Org UID, and Name are required.");

    const organization = await prisma.organization.create({
      data: {
        tenantId,
        orgUid,
        name,
        description,
        isActive: true,
      }
    });

    return { success: true, data: organization };
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

    const { tenantId, clinicUid, name, description, organizationId } = payload;
    
    if (!tenantId || !clinicUid || !name) throw new Error("Tenant ID, Clinic UID, and Name are required.");

    const result = await prisma.$transaction(async (tx) => {
      const clinic = await tx.clinic.create({
        data: {
          tenantId,
          clinicUid,
          name,
          description,
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

      return clinic;
    });

    return { success: true, data: result };
  } catch (error: any) {
    console.error("Create Clinic Error:", error);
    return { success: false, error: error.message || "Failed to create clinic" };
  }
}
