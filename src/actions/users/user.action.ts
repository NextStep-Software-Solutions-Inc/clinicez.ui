"use server";
import 'server-only'
import prisma from "@lib/prisma-common";
import { Prisma } from "@prisma/common/client";
import { managementClient } from "@services/auth0/management-client";
import { cache } from 'react';


export type GetUsersFiltersType = {
  orgId?: string
  search?: string
  page?: number
  pageSize?: number
  userId?: string
  email?: string
}

export type GetUsers = Awaited<ReturnType<typeof getUsersAction>>
export const getUsersAction = async (filter?:GetUsersFiltersType) => {
  const { orgId, search, page = 1, pageSize = 100, userId, email } = filter || {};
  return await prisma.$transaction(async (prisma) => {
    const users = await prisma.user.findMany({
      orderBy: {
        updatedAt: 'desc'
      },
      take: pageSize,
      skip: (page - 1) * pageSize,
      where: {
        userId, 
        email,
        ...orgId ? { 
          Organizations: { 
            some: { 
              Organization: {
                orgId
              } 
            }
          } 
        } : {},
        ...search ? {
          OR: [
            { firstName: { mode: "insensitive", contains: search } },
            { lastName: { mode: "insensitive", contains: search } },
            { middleName: { mode: "insensitive", contains: search } },
            { email: { mode: "insensitive", contains: search } }
          ]
        }: {},
        isActive: true
      },
      include: {
        Organizations: {
          distinct: "organizationId",
          where: {
            Organization: {
              orgId
            }
          },
          select: {
            status: true,
          }
        }
      }
    })
    const total = await prisma.user.count({ where: {
      ...orgId ? { 
        Organizations: { 
          some: { 
            Organization: {
              orgId
            } 
          }
        } 
      } : {},
      ...search ? {
        OR: [
          { firstName: { mode: "insensitive", contains: search } },
          { lastName: { mode: "insensitive", contains: search } },
          { middleName: { mode: "insensitive", contains: search } },
          { email: { mode: "insensitive", contains: search } }
        ]
      }: {},
      isActive: true
    } })
    return [ users, total ] as const;
  }, {
    timeout: 10000,
    maxWait: 5000,
    isolationLevel: Prisma.TransactionIsolationLevel.Serializable, // optional, default defined by database configuration
  });
}


export type GetUser = Awaited<ReturnType<typeof getUserAction>>
export const getUserAction = cache(async (key: string)=> {
  const user = await prisma.user.findFirstOrThrow({ 
    where: { 
      isActive: true,
      OR: [
        { userId: key },
        { email: key }
      ], 
    },
  }); 
  return user;
})

export const createUserAction = async (data: Prisma.UserCreateArgs["data"]) => {

  const newUser = await prisma.user.create({
    data
  });

  return newUser;
}

export const updateUserAction = async (userId: string, data: Prisma.UserUpdateArgs["data"]) => {
  const updatedUser = await prisma.user.update({
    where: { userId },
    data
  });
  return updatedUser;
}

export const resetPasswordAction = async (userId: string, password: string) => {
  const res = await managementClient.users.update({id: userId}, {
    password
  })
  return [200, 201, 200].includes(res.status);
}