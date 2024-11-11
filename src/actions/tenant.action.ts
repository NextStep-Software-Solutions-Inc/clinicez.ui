"use server";
import "server-only";

import prismaCommon from '@lib/prisma-common';
import { getCachedSession } from './session.action';
import dayjs from 'dayjs';
import { claimReceiptCodeAction } from './reciept-code.action';
import { hasCodeProperty } from '@lib/utils';

export type GetTenants = Awaited<ReturnType<typeof getTenantsAction>>;
export const getTenantsAction = async () => {

  const tenants = await prismaCommon.tenant.findMany({
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
    const tenants = await prismaCommon.tenant.findMany({
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
        tenantId: true,
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
  const tenant = await prismaCommon.tenant.findUnique({
    where: {
      id: id
    }
  });
  return tenant;
}

type CreateTenantPayload = {
  receiptCode: string;
  tenantId: string;
  name: string;
  description?: string;
  planId?: number;
}

export const createTenantAction = async (data: CreateTenantPayload) => {
  const session = await getCachedSession();
  try {
    if(!session) throw new Error("Unauthorized");
    const userId = String(session?.user.sub);
    const { tenantId, name, description, planId, receiptCode } = data;

    const {success, message} = await claimReceiptCodeAction(receiptCode);
    if(!success) throw new Error(message);

    const newUserPlan = await prismaCommon.$transaction(async (prisma) => {
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
              tenantId,
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
   
    return { status: true, message: "Tenant created successfully", data: newUserPlan }
  } catch (error) {
    console.error(`Error creating tenant: ${error}`);
    let message = "An error occurred while creating tenant";
    if(error instanceof Error) message = error.message;
    if(hasCodeProperty(error) && error.code === "P2025") message = "Tenant ID already exists";
    return { status: false, message, data: null }
  }
}