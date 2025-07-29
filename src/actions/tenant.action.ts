"use server";
import "server-only";

import prisma from '@lib/prisma';
import { getCachedSession } from './session.action';
import dayjs from 'dayjs';
import { claimReceiptCodeAction } from './receipt-code.action';
import { hasCodeProperty } from '@lib/utils';
import { managementClient } from "@/services/auth0/management-client";
import { sessionCheck } from "@/lib/auth";
import { withErrorHandling } from "@/lib/with-error-handling";

export type GetTenants = Awaited<ReturnType<typeof getTenantsAction>>;
export const getTenantsAction = async () => {

  const tenants = await prisma.tenant.findMany({
    where: {
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      createdAt: true,
      _count: {
        select: {
          Organizations: true
        }
      }
    }
  });

  return tenants;
}

export type GetMyTenants = Awaited<ReturnType<typeof getMyTenantsAction>>;
export const getMyTenantsAction = async (userId: string) => {
  const session = await getCachedSession();
  try {
    if(!session) throw new Error("Unauthorized");
    const tenants = await prisma.tenant.findMany({
      orderBy: {
        createdAt: "asc"
      },
      where: {
        isActive: true,
        Owner: {
          userId: userId
        }
      },
      select: {
        id: true,
        tenantUid: true,
        name: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            Organizations: true
          }
        }
      }
    });
    return { success: true, data: tenants, message: "Tenants fetched successfully" };
  } catch (error) {
    console.error(`Error fetching tenants for user ${userId}: ${error}`);
    let message = "An error occurred while fetching tenants";
    if(error instanceof Error) message = error.message;
    return { success: false, message: message, data: [] }
  }
}

export const getTenantAction = async (id: number) => {
  const tenant = await prisma.tenant.findUnique({
    where: {
      id: id
    }
  });
  return tenant;
}

type CreateTenantPayload = {
  receiptCode: string;
  tenantUid: string;
  name: string;
  description?: string;
  planId?: number;
}

export const createTenantAction = withErrorHandling(async (data: CreateTenantPayload) => {
  const session = await sessionCheck();
  const userId = String(session.user.sub);

  const { tenantUid, name, description, planId, receiptCode } = data;
    
  const newUserPlan = await prisma.$transaction(async (prisma) => {

    const auth0User = await managementClient.users.get({id: userId})
    if(!auth0User.data.email_verified) throw new Error("User email is not verified")

    const {success, message} = await claimReceiptCodeAction(prisma, receiptCode);
    if(!success) throw new Error(message);
    const plan = await prisma.plan.findUniqueOrThrow({
      where: {isActive: true, id: planId},
      select: { id: true, frequency: true }
    })

    const freq = plan.frequency.trim().toLocaleLowerCase() === "yearly" ? "year": "month";
    return await prisma.userPlan.create({
      data: {
        User: {
          connect: { userId }
        },
        Plan: {
          connect: {
            id: plan.id
          }
        },
        status: "ACTIVE",
        startDate: dayjs().toDate(),
        endDate: dayjs().add(1, freq).toDate(),
        Tenants: {
          create: {
            tenantUid,
            name,
            description,
            Owner: {
              connect: { userId }
            }
          }
        }
      }
    });
  });
   
  return { message: "Tenant created successfully", data: newUserPlan }
 
}, async error => {
  if(hasCodeProperty(error) && error.code === "P2025") return "Tenant ID already exists";
  return error instanceof Error ? error.message : "An error occurred while creating tenant";
})