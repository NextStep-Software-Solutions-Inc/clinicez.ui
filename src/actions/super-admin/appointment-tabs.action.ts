"use server";

import "server-only";
import prisma from "@lib/prisma";

export type GetAllAppointmentTabs = Awaited<
  ReturnType<typeof getAllAppointmentTabsAction>
>;
export async function getAllAppointmentTabsAction({
  search,
  pageSize = 10,
  pageNumber = 1,
  includeInactive = false,
}: {
  search?: string;
  pageSize?: number;
  pageNumber?: number;
  includeInactive?: boolean;
}) {
  const where = {
    ...(!includeInactive ? { isActive: true } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { description: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [tabs, total] = await Promise.all([
    prisma.appointmentTab.findMany({
      where,
      select: {
        id: true,
        name: true,
        description: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            ClinicAppointmentTabs: true,
          },
        },
      },
      orderBy: { name: "asc" },
      skip: (pageNumber - 1) * pageSize,
      take: pageSize,
    }),
    prisma.appointmentTab.count({ where }),
  ]);

  return {
    data: tabs,
    total,
    pageSize,
    pageNumber,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function createAppointmentTabAction({
  name,
  description,
}: {
  name: string;
  description?: string;
}) {
  const tab = await prisma.appointmentTab.create({
    data: {
      name,
      description,
    },
  });

  return { data: tab };
}

export async function updateAppointmentTabAction({
  id,
  name,
  description,
  isActive,
}: {
  id: number;
  name?: string;
  description?: string;
  isActive?: boolean;
}) {
  const tab = await prisma.appointmentTab.update({
    where: { id },
    data: {
      ...(name !== undefined ? { name } : {}),
      ...(description !== undefined ? { description } : {}),
      ...(isActive !== undefined ? { isActive } : {}),
    },
  });

  return { data: tab };
}

export async function deleteAppointmentTabAction(id: number) {
  await prisma.appointmentTab.update({
    where: { id },
    data: {
      isActive: false,
      deletedAt: new Date(),
    },
  });

  return { success: true };
}
